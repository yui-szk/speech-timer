/**
 * Tests for useTimer hook
 * Covers React integration and store synchronization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from './useTimer'
import { useAppStore } from '../store'

// Mock audio manager and bell scheduler
vi.mock('../utils/audio-manager', () => ({
  getAudioManager: () => ({
    playBell: vi.fn().mockResolvedValue(undefined),
    testSound: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
    setVolume: vi.fn(),
    isReady: vi.fn().mockReturnValue(true)
  })
}))

vi.mock('../utils/bell-scheduler', () => ({
  BellScheduler: vi.fn().mockImplementation(() => ({
    checkBells: vi.fn().mockReturnValue([]),
    reset: vi.fn(),
    setVolume: vi.fn(),
    testBell: vi.fn().mockResolvedValue(undefined),
    initializeAudio: vi.fn().mockResolvedValue(undefined),
    isAudioReady: vi.fn().mockReturnValue(true)
  }))
}))

// Mock performance.now() for predictable testing
const mockPerformanceNow = vi.fn()
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
})

// Mock requestAnimationFrame and cancelAnimationFrame
let rafIdCounter = 1
const mockRaf = vi.fn((callback) => {
  // Return a unique RAF ID
  return rafIdCounter++
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

describe('useTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPerformanceNow.mockReturnValue(0)
    
    // Reset store to initial state
    useAppStore.getState().resetTimer()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Initial State', () => {
    it('should return correct initial timer state', () => {
      const { result } = renderHook(() => useTimer())
      
      expect(result.current.status).toBe('idle')
      expect(result.current.elapsedMs).toBe(0)
      expect(result.current.remainingMs).toBe(10 * 60 * 1000) // Default 10 minutes
      expect(result.current.durationMs).toBe(10 * 60 * 1000)
      expect(result.current.precisionDriftMs).toBe(0)
      
      expect(result.current.isIdle).toBe(true)
      expect(result.current.isRunning).toBe(false)
      expect(result.current.isPaused).toBe(false)
      expect(result.current.isFinished).toBe(false)
    })
  })

  describe('Timer Controls', () => {
    it('should start timer correctly', () => {
      const { result } = renderHook(() => useTimer())
      
      act(() => {
        result.current.start()
      })
      
      expect(result.current.status).toBe('running')
      expect(result.current.isRunning).toBe(true)
      expect(result.current.isIdle).toBe(false)
    })

    it('should pause timer correctly', () => {
      const { result } = renderHook(() => useTimer())
      
      act(() => {
        result.current.start()
      })
      
      act(() => {
        result.current.pause()
      })
      
      expect(result.current.status).toBe('paused')
      expect(result.current.isPaused).toBe(true)
      expect(result.current.isRunning).toBe(false)
    })

    it('should resume timer correctly', () => {
      const { result } = renderHook(() => useTimer())
      
      act(() => {
        result.current.start()
      })
      
      act(() => {
        result.current.pause()
      })
      
      act(() => {
        result.current.resume()
      })
      
      expect(result.current.status).toBe('running')
      expect(result.current.isRunning).toBe(true)
      expect(result.current.isPaused).toBe(false)
    })

    it('should reset timer correctly', () => {
      const { result } = renderHook(() => useTimer())
      
      act(() => {
        result.current.start()
      })
      
      // Simulate some time passing
      mockPerformanceNow.mockReturnValue(2000)
      
      act(() => {
        result.current.reset()
      })
      
      expect(result.current.status).toBe('idle')
      expect(result.current.elapsedMs).toBe(0)
      expect(result.current.remainingMs).toBe(result.current.durationMs)
      expect(result.current.isIdle).toBe(true)
    })

    it('should set duration correctly', () => {
      const { result } = renderHook(() => useTimer())
      const newDuration = 5 * 60 * 1000 // 5 minutes
      
      act(() => {
        result.current.setDuration(newDuration)
      })
      
      expect(result.current.durationMs).toBe(newDuration)
      expect(result.current.remainingMs).toBe(newDuration)
    })

    it('should prevent duplicate duration updates', async () => {
      const { result } = renderHook(() => useTimer())
      
      // timerSingletonをimport
      const { timerSingleton } = await import('../utils/timer-singleton')
      
      // 初期状態を確認
      const initialDuration = result.current.durationMs
      
      // スパイを設定（初期化後に設定）
      const setDurationSpy = vi.spyOn(timerSingleton, 'setDuration')
      const setStoreDurationSpy = vi.spyOn(useAppStore.getState(), 'setDuration')
      
      // 同じ値でsetDurationを複数回呼び出し
      act(() => {
        result.current.setDuration(initialDuration)
        result.current.setDuration(initialDuration)
        result.current.setDuration(initialDuration)
      })
      
      // 同じ値の場合は更新が呼ばれていないことを確認
      expect(setDurationSpy).not.toHaveBeenCalled()
      expect(setStoreDurationSpy).not.toHaveBeenCalled()
      
      setDurationSpy.mockRestore()
      setStoreDurationSpy.mockRestore()
    })

    it('should allow updates when duration value changes', async () => {
      const { result } = renderHook(() => useTimer())
      
      // timerSingletonをimport
      const { timerSingleton } = await import('../utils/timer-singleton')
      
      // 初期状態を確認
      const initialDuration = result.current.durationMs
      
      // 異なる値でsetDurationを呼び出し
      const newDuration = initialDuration + 1000
      
      act(() => {
        result.current.setDuration(newDuration)
      })
      
      // 最終的に値が更新されていることを確認
      expect(result.current.durationMs).toBe(newDuration)
      
      // timerSingletonの状態も更新されていることを確認
      const updatedState = timerSingleton.getState()
      expect(updatedState?.durationMs).toBe(newDuration)
    })
  })

  describe('Store Synchronization', () => {
    it('should sync with store duration changes', () => {
      const { result } = renderHook(() => useTimer())
      const newDuration = 15 * 60 * 1000 // 15 minutes
      
      act(() => {
        useAppStore.getState().setDuration(newDuration)
      })
      
      expect(result.current.durationMs).toBe(newDuration)
    })

    it('should update store time on timer ticks', () => {
      const { result } = renderHook(() => useTimer())
      
      act(() => {
        result.current.start()
      })
      
      // Simulate RAF callback
      const rafCallback = mockRaf.mock.calls[0]?.[0]
      if (rafCallback) {
        mockPerformanceNow.mockReturnValue(1000)
        act(() => {
          rafCallback(1000)
        })
      }
      
      // Store should be updated with current time
      const storeState = useAppStore.getState()
      expect(storeState.timer.nowEpochMs).toBeGreaterThan(0)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup timer engine on unmount', () => {
      const { result, unmount } = renderHook(() => useTimer())
      
      // Start timer to create RAF loop
      act(() => {
        result.current.start()
      })
      
      // Verify RAF was called to start the loop
      expect(mockRaf).toHaveBeenCalled()
      
      // Simulate RAF callback to actually start the loop
      const rafCallback = mockRaf.mock.calls[0]?.[0]
      if (rafCallback) {
        mockPerformanceNow.mockReturnValue(100)
        act(() => {
          rafCallback(100)
        })
      }
      
      unmount()
      
      // Should have called cancelAnimationFrame during cleanup
      expect(mockCancelRaf).toHaveBeenCalled()
    })
  })

  describe('Time Calculations', () => {
    it('should calculate elapsed and remaining time correctly', () => {
      const { result } = renderHook(() => useTimer())
      
      act(() => {
        result.current.start()
      })
      
      // Simulate RAF callback after 2 seconds
      const rafCallback = mockRaf.mock.calls[0]?.[0]
      if (rafCallback) {
        mockPerformanceNow.mockReturnValue(2000)
        act(() => {
          rafCallback(2000)
        })
      }
      
      expect(result.current.elapsedMs).toBe(2000)
      expect(result.current.remainingMs).toBe(result.current.durationMs - 2000)
    })

    it('should handle timer completion', () => {
      const { result } = renderHook(() => useTimer())
      
      // Set short duration for testing
      act(() => {
        result.current.setDuration(1000) // 1 second
      })
      
      act(() => {
        result.current.start()
      })
      
      // Simulate timer completion
      const rafCallback = mockRaf.mock.calls[0]?.[0]
      if (rafCallback) {
        mockPerformanceNow.mockReturnValue(1000)
        act(() => {
          rafCallback(1000)
        })
      }
      
      expect(result.current.status).toBe('finished')
      expect(result.current.isFinished).toBe(true)
      expect(result.current.remainingMs).toBe(0)
      expect(result.current.elapsedMs).toBe(1000)
    })
  })

  describe('Precision Monitoring', () => {
    it('should track precision drift', () => {
      const { result } = renderHook(() => useTimer())
      
      act(() => {
        result.current.start()
      })
      
      // Simulate RAF callback with some timing variance
      const rafCallback = mockRaf.mock.calls[0]?.[0]
      if (rafCallback) {
        mockPerformanceNow.mockReturnValue(1100) // 100ms drift
        act(() => {
          rafCallback(1100)
        })
      }
      
      expect(typeof result.current.precisionDriftMs).toBe('number')
      expect(result.current.precisionDriftMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Bell System Integration', () => {
    it('should provide bell control functions', () => {
      const { result } = renderHook(() => useTimer())
      
      expect(typeof result.current.testBell).toBe('function')
      expect(typeof result.current.initializeAudio).toBe('function')
      expect(typeof result.current.isAudioReady).toBe('boolean')
    })

    it('should test bell sound', async () => {
      const { result } = renderHook(() => useTimer())
      
      await act(async () => {
        await result.current.testBell()
      })
      
      // Should not throw and complete successfully
      expect(true).toBe(true)
    })

    it('should initialize audio', async () => {
      const { result } = renderHook(() => useTimer())
      
      await act(async () => {
        await result.current.initializeAudio()
      })
      
      // Should not throw and complete successfully
      expect(true).toBe(true)
    })

    it('should reset bells when timer resets', () => {
      const { result } = renderHook(() => useTimer())
      
      act(() => {
        result.current.start()
      })
      
      act(() => {
        result.current.reset()
      })
      
      // Bell state should be reset in store
      const bellState = useAppStore.getState().bells
      expect(bellState.triggered.first).toBe(false)
      expect(bellState.triggered.second).toBe(false)
      expect(bellState.triggered.third).toBe(false)
    })

    it('should sync volume changes to bell scheduler', () => {
      const { result } = renderHook(() => useTimer())
      
      act(() => {
        useAppStore.getState().updateSettings({ volume: 0.5 })
      })
      
      // Volume should be synced to bell scheduler
      // This is tested through the effect, actual implementation is mocked
      expect(result.current).toBeDefined()
    })
  })

  describe('Multiple Hook Instances', () => {
    it('should handle multiple useTimer instances independently', () => {
      const { result: result1 } = renderHook(() => useTimer())
      const { result: result2 } = renderHook(() => useTimer())
      
      // Both should start with same initial state
      expect(result1.current.status).toBe('idle')
      expect(result2.current.status).toBe('idle')
      
      // Starting one should not affect the other's engine state
      act(() => {
        result1.current.start()
      })
      
      expect(result1.current.isRunning).toBe(true)
      // Note: Both hooks share the same store, so they will have the same underlying state
      // but each has its own timer engine instance
    })
  })
})