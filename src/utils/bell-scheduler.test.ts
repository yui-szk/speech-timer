/**
 * Unit tests for BellScheduler
 * Tests bell triggering logic, threshold detection, and duplicate prevention
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BellScheduler, type BellTriggerEvent } from './bell-scheduler'
import type { TimerSettings, BellState } from '../types'

// Mock audio manager
vi.mock('./audio-manager', () => ({
  getAudioManager: () => ({
    playBell: vi.fn().mockResolvedValue(undefined),
    testSound: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
    setVolume: vi.fn(),
    isReady: vi.fn().mockReturnValue(true)
  })
}))

describe('BellScheduler', () => {
  let bellScheduler: BellScheduler
  let onBellTriggered: ReturnType<typeof vi.fn>
  let onError: ReturnType<typeof vi.fn>
  
  const defaultSettings: TimerSettings = {
    theme: 'mint',
    bellEnabled: {
      first: true,
      second: true,
      third: true
    },
    bellTimesMs: {
      first: 180000, // 3 minutes
      second: 120000, // 2 minutes
      third: 60000   // 1 minute
    },
    progressMode: 'remaining',
    volume: 0.7
  }

  const defaultBellState: BellState = {
    triggered: {
      first: false,
      second: false,
      third: false
    },
    lastCheckMs: 0
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    onBellTriggered = vi.fn()
    onError = vi.fn()
    
    bellScheduler = new BellScheduler({
      onBellTriggered,
      onError
    })
  })

  afterEach(() => {
    bellScheduler.reset()
  })

  describe('bell triggering logic', () => {
    it('should trigger bell when crossing threshold from above', () => {
      // First check: above threshold
      let triggeredBells = bellScheduler.checkBells(
        185000, // 3:05 remaining (above 3:00 threshold)
        defaultSettings,
        defaultBellState
      )
      expect(triggeredBells).toHaveLength(0)

      // Second check: below threshold
      triggeredBells = bellScheduler.checkBells(
        175000, // 2:55 remaining (below 3:00 threshold)
        defaultSettings,
        defaultBellState
      )
      expect(triggeredBells).toContain('first')
      expect(onBellTriggered).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'first',
          remainingMs: 175000,
          thresholdMs: 180000
        })
      )
    })

    it('should not trigger bell when starting below threshold', () => {
      // First call establishes baseline (should not trigger)
      let triggeredBells = bellScheduler.checkBells(
        175000, // 2:55 remaining (below 3:00 threshold)
        defaultSettings,
        defaultBellState
      )
      expect(triggeredBells).toHaveLength(0)
      
      // Second call should not trigger since we started below threshold
      triggeredBells = bellScheduler.checkBells(
        170000, // 2:50 remaining (still below threshold)
        defaultSettings,
        defaultBellState
      )
      
      expect(triggeredBells).toHaveLength(0)
      expect(onBellTriggered).not.toHaveBeenCalled()
    })

    it('should trigger multiple bells in sequence', () => {
      // Start above all thresholds
      bellScheduler.checkBells(200000, defaultSettings, defaultBellState)

      // Cross first bell threshold
      let triggeredBells = bellScheduler.checkBells(175000, defaultSettings, defaultBellState)
      expect(triggeredBells).toContain('first')

      // Cross second bell threshold
      const updatedBellState = {
        ...defaultBellState,
        triggered: { ...defaultBellState.triggered, first: true }
      }
      triggeredBells = bellScheduler.checkBells(115000, defaultSettings, updatedBellState)
      expect(triggeredBells).toContain('second')

      // Cross third bell threshold
      const finalBellState = {
        ...updatedBellState,
        triggered: { ...updatedBellState.triggered, second: true }
      }
      triggeredBells = bellScheduler.checkBells(55000, defaultSettings, finalBellState)
      expect(triggeredBells).toContain('third')
    })

    it('should not trigger disabled bells', () => {
      const settingsWithDisabledBells: TimerSettings = {
        ...defaultSettings,
        bellEnabled: {
          first: false,
          second: true,
          third: false
        }
      }

      bellScheduler.checkBells(200000, settingsWithDisabledBells, defaultBellState)
      
      // Try to trigger first bell (disabled)
      let triggeredBells = bellScheduler.checkBells(175000, settingsWithDisabledBells, defaultBellState)
      expect(triggeredBells).not.toContain('first')

      // Try to trigger second bell (enabled)
      triggeredBells = bellScheduler.checkBells(115000, settingsWithDisabledBells, defaultBellState)
      expect(triggeredBells).toContain('second')

      // Try to trigger third bell (disabled)
      const updatedBellState = {
        ...defaultBellState,
        triggered: { ...defaultBellState.triggered, second: true }
      }
      triggeredBells = bellScheduler.checkBells(55000, settingsWithDisabledBells, updatedBellState)
      expect(triggeredBells).not.toContain('third')
    })
  })

  describe('duplicate prevention', () => {
    it('should not trigger already triggered bells', () => {
      const triggeredBellState: BellState = {
        triggered: {
          first: true,
          second: false,
          third: false
        },
        lastCheckMs: 0
      }

      bellScheduler.checkBells(200000, defaultSettings, triggeredBellState)
      
      // Try to trigger first bell again
      const triggeredBells = bellScheduler.checkBells(175000, defaultSettings, triggeredBellState)
      
      expect(triggeredBells).not.toContain('first')
      expect(onBellTriggered).not.toHaveBeenCalled()
    })

    it('should reset triggered state when scheduler resets', () => {
      // Trigger a bell
      bellScheduler.checkBells(200000, defaultSettings, defaultBellState)
      bellScheduler.checkBells(175000, defaultSettings, defaultBellState)
      expect(onBellTriggered).toHaveBeenCalled()

      // Reset scheduler
      bellScheduler.reset()
      vi.clearAllMocks()

      // Should be able to trigger the same bell again
      bellScheduler.checkBells(200000, defaultSettings, defaultBellState)
      const triggeredBells = bellScheduler.checkBells(175000, defaultSettings, defaultBellState)
      
      expect(triggeredBells).toContain('first')
      expect(onBellTriggered).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle zero threshold', () => {
      const settingsWithZeroThreshold: TimerSettings = {
        ...defaultSettings,
        bellTimesMs: {
          first: 0,
          second: 120000,
          third: 60000
        }
      }

      bellScheduler.checkBells(1000, settingsWithZeroThreshold, defaultBellState)
      const triggeredBells = bellScheduler.checkBells(0, settingsWithZeroThreshold, defaultBellState)
      
      expect(triggeredBells).not.toContain('first') // Zero threshold should not trigger
    })

    it('should handle negative threshold', () => {
      const settingsWithNegativeThreshold: TimerSettings = {
        ...defaultSettings,
        bellTimesMs: {
          first: -1000,
          second: 120000,
          third: 60000
        }
      }

      bellScheduler.checkBells(1000, settingsWithNegativeThreshold, defaultBellState)
      const triggeredBells = bellScheduler.checkBells(0, settingsWithNegativeThreshold, defaultBellState)
      
      expect(triggeredBells).not.toContain('first') // Negative threshold should not trigger
    })

    it('should handle exact threshold crossing', () => {
      bellScheduler.checkBells(180001, defaultSettings, defaultBellState) // Just above
      const triggeredBells = bellScheduler.checkBells(180000, defaultSettings, defaultBellState) // Exactly at threshold
      
      expect(triggeredBells).toContain('first')
    })
  })

  describe('audio integration', () => {
    it('should test bell sound', async () => {
      await expect(bellScheduler.testBell()).resolves.not.toThrow()
    })

    it('should handle audio errors gracefully', async () => {
      // Mock the audio manager to throw an error
      const mockAudioManager = {
        playBell: vi.fn().mockRejectedValue(new Error('Audio failed')),
        testSound: vi.fn(),
        initialize: vi.fn(),
        setVolume: vi.fn(),
        isReady: vi.fn().mockReturnValue(true)
      }
      
      // Replace the audio manager in the scheduler
      ;(bellScheduler as any).audioManager = mockAudioManager

      bellScheduler.checkBells(200000, defaultSettings, defaultBellState)
      bellScheduler.checkBells(175000, defaultSettings, defaultBellState)

      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to play first bell')
        })
      )
    })

    it('should set volume', () => {
      const mockAudioManager = {
        setVolume: vi.fn(),
        playBell: vi.fn(),
        testSound: vi.fn(),
        initialize: vi.fn(),
        isReady: vi.fn()
      }
      
      ;(bellScheduler as any).audioManager = mockAudioManager
      
      bellScheduler.setVolume(0.5)
      
      expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0.5)
    })

    it('should initialize audio', async () => {
      const mockAudioManager = {
        initialize: vi.fn().mockResolvedValue(undefined),
        setVolume: vi.fn(),
        playBell: vi.fn(),
        testSound: vi.fn(),
        isReady: vi.fn()
      }
      
      ;(bellScheduler as any).audioManager = mockAudioManager
      
      await bellScheduler.initializeAudio()
      
      expect(mockAudioManager.initialize).toHaveBeenCalled()
    })

    it('should check audio ready state', () => {
      const isReady = bellScheduler.isAudioReady()
      
      expect(typeof isReady).toBe('boolean')
    })
  })

  describe('callback handling', () => {
    it('should call onBellTriggered with correct event data', () => {
      bellScheduler.checkBells(200000, defaultSettings, defaultBellState)
      bellScheduler.checkBells(175000, defaultSettings, defaultBellState)

      expect(onBellTriggered).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'first',
          remainingMs: 175000,
          thresholdMs: 180000,
          timestamp: expect.any(Number)
        })
      )
    })

    it('should work without callbacks', () => {
      const schedulerWithoutCallbacks = new BellScheduler()
      
      expect(() => {
        schedulerWithoutCallbacks.checkBells(200000, defaultSettings, defaultBellState)
        schedulerWithoutCallbacks.checkBells(175000, defaultSettings, defaultBellState)
      }).not.toThrow()
    })
  })
})