/**
 * Tests for TimerEngine class
 * Covers precision, state transitions, and time calculations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TimerEngine, type TimerEngineState, type TimerStatus } from './timer-engine'

// Mock performance.now() for predictable testing
const mockPerformanceNow = vi.fn()
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
})

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRaf = vi.fn((callback) => {
  // Return a mock RAF ID
  return 1
})
const mockCancelRaf = vi.fn()
Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRaf,
  writable: true
})
Object.defineProperty(global, 'cancelAnimationFrame', {
  value: mockCancelRaf,
  writable: true
})

describe('TimerEngine', () => {
  let engine: TimerEngine
  let mockCallbacks: {
    onTick: ReturnType<typeof vi.fn>
    onStatusChange: ReturnType<typeof vi.fn>
    onFinish: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPerformanceNow.mockReturnValue(0)
    
    mockCallbacks = {
      onTick: vi.fn(),
      onStatusChange: vi.fn(),
      onFinish: vi.fn()
    }
    
    engine = new TimerEngine(10000, mockCallbacks) // 10 second timer
  })

  afterEach(() => {
    engine.destroy()
  })

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const state = engine.getState()
      
      expect(state.status).toBe('idle')
      expect(state.durationMs).toBe(10000)
      expect(state.elapsedMs).toBe(0)
      expect(state.remainingMs).toBe(10000)
      expect(state.pauseAccumulatedMs).toBe(0)
      expect(state.precisionDriftMs).toBe(0)
    })
  })

  describe('State Transitions', () => {
    it('should transition from idle to running when started', () => {
      mockPerformanceNow.mockReturnValue(1000)
      
      engine.start()
      
      const state = engine.getState()
      expect(state.status).toBe('running')
      expect(state.startTime).toBe(1000)
      expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith('running', expect.any(Object))
    })

    it('should transition from running to paused when paused', () => {
      mockPerformanceNow.mockReturnValue(1000)
      engine.start()
      
      mockPerformanceNow.mockReturnValue(3000) // 2 seconds elapsed
      engine.pause()
      
      const state = engine.getState()
      expect(state.status).toBe('paused')
      expect(state.pauseAccumulatedMs).toBe(2000)
      expect(state.startTime).toBeUndefined()
      expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith('paused', expect.any(Object))
    })

    it('should transition from paused to running when resumed', () => {
      mockPerformanceNow.mockReturnValue(1000)
      engine.start()
      
      mockPerformanceNow.mockReturnValue(3000)
      engine.pause()
      
      mockPerformanceNow.mockReturnValue(5000)
      engine.resume()
      
      const state = engine.getState()
      expect(state.status).toBe('running')
      expect(state.pauseAccumulatedMs).toBe(2000)
      expect(state.startTime).toBe(5000)
    })

    it('should transition to finished when time runs out', () => {
      mockPerformanceNow.mockReturnValue(0)
      engine.start()
      
      // Verify timer started correctly
      expect(engine.getState().status).toBe('running')
      expect(engine.getState().startTime).toBe(0)
      
      // Mock RAF callback to simulate time passing
      const rafCallback = mockRaf.mock.calls[0][0]
      mockPerformanceNow.mockReturnValue(10000) // Full duration elapsed
      
      rafCallback(10000)
      
      const state = engine.getState()
      expect(state.status).toBe('finished')
      expect(state.elapsedMs).toBe(10000)
      expect(state.remainingMs).toBe(0)
      expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith('finished', expect.any(Object))
      expect(mockCallbacks.onFinish).toHaveBeenCalled()
    })

    it('should reset to idle state when reset', () => {
      mockPerformanceNow.mockReturnValue(1000)
      engine.start()
      
      mockPerformanceNow.mockReturnValue(3000)
      engine.reset()
      
      const state = engine.getState()
      expect(state.status).toBe('idle')
      expect(state.elapsedMs).toBe(0)
      expect(state.remainingMs).toBe(10000)
      expect(state.pauseAccumulatedMs).toBe(0)
      expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith('idle', expect.any(Object))
    })
  })

  describe('Time Calculations', () => {
    it('should calculate elapsed time correctly during running', () => {
      mockPerformanceNow.mockReturnValue(1000)
      engine.start()
      
      // Simulate RAF tick after 2 seconds
      const rafCallback = mockRaf.mock.calls[0][0]
      mockPerformanceNow.mockReturnValue(3000)
      rafCallback(3000)
      
      const state = engine.getState()
      expect(state.elapsedMs).toBe(2000)
      expect(state.remainingMs).toBe(8000)
    })

    it('should handle pause and resume time calculations correctly', () => {
      // Start timer
      mockPerformanceNow.mockReturnValue(1000)
      engine.start()
      
      // Run for 2 seconds, then pause
      mockPerformanceNow.mockReturnValue(3000)
      engine.pause()
      
      let state = engine.getState()
      expect(state.pauseAccumulatedMs).toBe(2000)
      
      // Resume after 1 second pause
      mockPerformanceNow.mockReturnValue(4000)
      engine.resume()
      
      // Run for another 3 seconds
      const rafCallback = mockRaf.mock.calls[1][0] // Second RAF call after resume
      mockPerformanceNow.mockReturnValue(7000)
      rafCallback(7000)
      
      state = engine.getState()
      expect(state.elapsedMs).toBe(5000) // 2s + 3s
      expect(state.remainingMs).toBe(5000)
    })

    it('should not exceed duration when calculating elapsed time', () => {
      mockPerformanceNow.mockReturnValue(0)
      engine.start()
      
      // Simulate time beyond duration
      const rafCallback = mockRaf.mock.calls[0][0]
      mockPerformanceNow.mockReturnValue(15000) // 5 seconds over
      rafCallback(15000)
      
      const state = engine.getState()
      expect(state.elapsedMs).toBe(10000) // Capped at duration
      expect(state.remainingMs).toBe(0)
    })
  })

  describe('Duration Changes', () => {
    it('should handle duration changes while idle', () => {
      engine.setDuration(20000)
      
      const state = engine.getState()
      expect(state.durationMs).toBe(20000)
      expect(state.remainingMs).toBe(20000)
    })

    it('should handle duration changes while running', () => {
      mockPerformanceNow.mockReturnValue(0)
      engine.start()
      
      // Run for 2 seconds
      const rafCallback = mockRaf.mock.calls[0][0]
      mockPerformanceNow.mockReturnValue(2000)
      rafCallback(2000)
      
      // Change duration to 5 seconds (half of original)
      engine.setDuration(5000)
      
      const state = engine.getState()
      expect(state.durationMs).toBe(5000)
      // Remaining should be proportionally adjusted
      expect(state.remainingMs).toBeLessThanOrEqual(5000)
    })
  })

  describe('Precision Monitoring', () => {
    it('should track precision drift', () => {
      mockPerformanceNow.mockReturnValue(0)
      engine.start()
      
      // Simulate multiple RAF ticks with some timing variance
      const rafCallback = mockRaf.mock.calls[0][0]
      
      mockPerformanceNow.mockReturnValue(1000)
      rafCallback(1000)
      
      mockPerformanceNow.mockReturnValue(2100) // 100ms drift
      rafCallback(2100)
      
      const state = engine.getState()
      expect(typeof state.precisionDriftMs).toBe('number')
      expect(state.precisionDriftMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('RAF Loop Management', () => {
    it('should start RAF loop when timer starts', () => {
      engine.start()
      expect(mockRaf).toHaveBeenCalled()
    })

    it('should stop RAF loop when timer is paused', () => {
      engine.start()
      const rafCallsBefore = mockRaf.mock.calls.length
      engine.pause()
      // RAF should be cancelled when pausing
      expect(mockCancelRaf).toHaveBeenCalled()
    })

    it('should stop RAF loop when timer is reset', () => {
      engine.start()
      const rafCallsBefore = mockRaf.mock.calls.length
      engine.reset()
      // RAF should be cancelled when resetting
      expect(mockCancelRaf).toHaveBeenCalled()
    })

    it('should clean up RAF loop when destroyed', () => {
      engine.start()
      const rafCallsBefore = mockRaf.mock.calls.length
      engine.destroy()
      // RAF should be cancelled when destroying
      expect(mockCancelRaf).toHaveBeenCalled()
    })
  })

  describe('Callback Invocation', () => {
    it('should call onTick during RAF loop', () => {
      mockPerformanceNow.mockReturnValue(0)
      engine.start()
      
      // Get the RAF callback that was registered
      expect(mockRaf).toHaveBeenCalled()
      const rafCallback = mockRaf.mock.calls[0][0]
      
      // Simulate time passing and call the RAF callback
      mockPerformanceNow.mockReturnValue(1000)
      rafCallback(1000)
      
      expect(mockCallbacks.onTick).toHaveBeenCalledWith(expect.objectContaining({
        status: 'running',
        elapsedMs: 1000,
        remainingMs: 9000
      }))
    })

    it('should not call onTick when not running', () => {
      engine.pause() // Pause without starting
      expect(mockCallbacks.onTick).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple start calls gracefully', () => {
      engine.start()
      const firstCallCount = mockRaf.mock.calls.length
      
      engine.start() // Second start call
      expect(mockRaf.mock.calls.length).toBe(firstCallCount) // Should not start again
    })

    it('should handle pause when not running', () => {
      engine.pause() // Pause without starting
      expect(engine.getState().status).toBe('idle')
    })

    it('should handle resume when not paused', () => {
      engine.resume() // Resume without pausing
      expect(engine.getState().status).toBe('idle')
    })

    it('should handle zero duration timer', () => {
      const zeroEngine = new TimerEngine(0, mockCallbacks)
      zeroEngine.start()
      
      const state = zeroEngine.getState()
      expect(state.durationMs).toBe(0)
      expect(state.remainingMs).toBe(0)
      
      zeroEngine.destroy()
    })
  })
})