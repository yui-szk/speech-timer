import { describe, it, expect } from 'vitest'
import {
  validateTimerSettings,
  validateTimerState,
  validateBellState,
  createDefaultTimerSettings,
  createDefaultTimerState,
  createDefaultBellState,
  validateAndParse
} from './validation'
import type { TimerSettings, TimerState, BellState } from '../types'

describe('Validation Utilities', () => {
  describe('validateTimerSettings', () => {
    it('should validate correct TimerSettings object', () => {
      const validSettings: TimerSettings = {
        theme: 'mint',
        bellEnabled: {
          first: true,
          second: false,
          third: true
        },
        bellTimesMs: {
          first: 8 * 60 * 1000,
          second: 2 * 60 * 1000,
          third: 30 * 1000
        },
        progressMode: 'remaining',
        volume: 0.7
      }

      expect(validateTimerSettings(validSettings)).toBe(true)
    })

    it('should validate system theme', () => {
      const settings = createDefaultTimerSettings()
      settings.theme = 'system'
      expect(validateTimerSettings(settings)).toBe(true)
    })

    it('should validate elapsed progress mode', () => {
      const settings = createDefaultTimerSettings()
      settings.progressMode = 'elapsed'
      expect(validateTimerSettings(settings)).toBe(true)
    })

    it('should reject invalid theme', () => {
      const settings = { ...createDefaultTimerSettings(), theme: 'invalid' }
      expect(validateTimerSettings(settings)).toBe(false)
    })

    it('should reject invalid bellEnabled structure', () => {
      const settings = { ...createDefaultTimerSettings(), bellEnabled: { first: true } }
      expect(validateTimerSettings(settings)).toBe(false)
    })

    it('should reject non-boolean bellEnabled values', () => {
      const settings = {
        ...createDefaultTimerSettings(),
        bellEnabled: { first: 'true', second: false, third: true }
      }
      expect(validateTimerSettings(settings)).toBe(false)
    })

    it('should reject invalid bellTimesMs structure', () => {
      const settings = { ...createDefaultTimerSettings(), bellTimesMs: { first: 1000 } }
      expect(validateTimerSettings(settings)).toBe(false)
    })

    it('should reject negative bell times', () => {
      const settings = {
        ...createDefaultTimerSettings(),
        bellTimesMs: { first: -1000, second: 2000, third: 3000 }
      }
      expect(validateTimerSettings(settings)).toBe(false)
    })

    it('should reject invalid progress mode', () => {
      const settings = { ...createDefaultTimerSettings(), progressMode: 'invalid' }
      expect(validateTimerSettings(settings)).toBe(false)
    })

    it('should reject invalid volume range', () => {
      const settings1 = { ...createDefaultTimerSettings(), volume: -0.1 }
      const settings2 = { ...createDefaultTimerSettings(), volume: 1.1 }
      expect(validateTimerSettings(settings1)).toBe(false)
      expect(validateTimerSettings(settings2)).toBe(false)
    })

    it('should reject null or non-object input', () => {
      expect(validateTimerSettings(null)).toBe(false)
      expect(validateTimerSettings(undefined)).toBe(false)
      expect(validateTimerSettings('string')).toBe(false)
      expect(validateTimerSettings(123)).toBe(false)
    })
  })

  describe('validateTimerState', () => {
    it('should validate correct TimerState object', () => {
      const validState: TimerState = {
        status: 'running',
        durationMs: 10 * 60 * 1000,
        startEpochMs: Date.now(),
        pauseAccumulatedMs: 1000,
        nowEpochMs: Date.now()
      }

      expect(validateTimerState(validState)).toBe(true)
    })

    it('should validate all status values', () => {
      const baseState = createDefaultTimerState()
      
      expect(validateTimerState({ ...baseState, status: 'idle' })).toBe(true)
      expect(validateTimerState({ ...baseState, status: 'running' })).toBe(true)
      expect(validateTimerState({ ...baseState, status: 'paused' })).toBe(true)
      expect(validateTimerState({ ...baseState, status: 'finished' })).toBe(true)
    })

    it('should validate optional startEpochMs', () => {
      const state1 = { ...createDefaultTimerState(), startEpochMs: undefined }
      const state2 = { ...createDefaultTimerState(), startEpochMs: Date.now() }
      
      expect(validateTimerState(state1)).toBe(true)
      expect(validateTimerState(state2)).toBe(true)
    })

    it('should reject invalid status', () => {
      const state = { ...createDefaultTimerState(), status: 'invalid' }
      expect(validateTimerState(state)).toBe(false)
    })

    it('should reject negative durationMs', () => {
      const state = { ...createDefaultTimerState(), durationMs: -1000 }
      expect(validateTimerState(state)).toBe(false)
    })

    it('should reject invalid startEpochMs type', () => {
      const state = { ...createDefaultTimerState(), startEpochMs: 'invalid' }
      expect(validateTimerState(state)).toBe(false)
    })

    it('should reject negative pauseAccumulatedMs', () => {
      const state = { ...createDefaultTimerState(), pauseAccumulatedMs: -100 }
      expect(validateTimerState(state)).toBe(false)
    })

    it('should reject non-number nowEpochMs', () => {
      const state = { ...createDefaultTimerState(), nowEpochMs: 'invalid' }
      expect(validateTimerState(state)).toBe(false)
    })

    it('should reject null or non-object input', () => {
      expect(validateTimerState(null)).toBe(false)
      expect(validateTimerState(undefined)).toBe(false)
      expect(validateTimerState('string')).toBe(false)
    })
  })

  describe('validateBellState', () => {
    it('should validate correct BellState object', () => {
      const validState: BellState = {
        triggered: {
          first: true,
          second: false,
          third: true
        },
        lastCheckMs: 5000
      }

      expect(validateBellState(validState)).toBe(true)
    })

    it('should reject invalid triggered structure', () => {
      const state = { ...createDefaultBellState(), triggered: { first: true } }
      expect(validateBellState(state)).toBe(false)
    })

    it('should reject non-boolean triggered values', () => {
      const state = {
        ...createDefaultBellState(),
        triggered: { first: 'true', second: false, third: true }
      }
      expect(validateBellState(state)).toBe(false)
    })

    it('should reject negative lastCheckMs', () => {
      const state = { ...createDefaultBellState(), lastCheckMs: -100 }
      expect(validateBellState(state)).toBe(false)
    })

    it('should reject null or non-object input', () => {
      expect(validateBellState(null)).toBe(false)
      expect(validateBellState(undefined)).toBe(false)
      expect(validateBellState([])).toBe(false)
    })
  })

  describe('createDefaultTimerSettings', () => {
    it('should create valid default settings', () => {
      const defaults = createDefaultTimerSettings()
      expect(validateTimerSettings(defaults)).toBe(true)
    })

    it('should have expected default values', () => {
      const defaults = createDefaultTimerSettings()
      
      expect(defaults.theme).toBe('mint')
      expect(defaults.bellEnabled.first).toBe(true)
      expect(defaults.bellEnabled.second).toBe(true)
      expect(defaults.bellEnabled.third).toBe(true)
      expect(defaults.bellTimesMs.first).toBe(8 * 60 * 1000)
      expect(defaults.bellTimesMs.second).toBe(2 * 60 * 1000)
      expect(defaults.bellTimesMs.third).toBe(30 * 1000)
      expect(defaults.progressMode).toBe('remaining')
      expect(defaults.volume).toBe(0.7)
    })
  })

  describe('createDefaultTimerState', () => {
    it('should create valid default state', () => {
      const defaults = createDefaultTimerState()
      expect(validateTimerState(defaults)).toBe(true)
    })

    it('should have expected default values', () => {
      const defaults = createDefaultTimerState()
      
      expect(defaults.status).toBe('idle')
      expect(defaults.durationMs).toBe(10 * 60 * 1000)
      expect(defaults.startEpochMs).toBeUndefined()
      expect(defaults.pauseAccumulatedMs).toBe(0)
      expect(typeof defaults.nowEpochMs).toBe('number')
    })
  })

  describe('createDefaultBellState', () => {
    it('should create valid default bell state', () => {
      const defaults = createDefaultBellState()
      expect(validateBellState(defaults)).toBe(true)
    })

    it('should have expected default values', () => {
      const defaults = createDefaultBellState()
      
      expect(defaults.triggered.first).toBe(false)
      expect(defaults.triggered.second).toBe(false)
      expect(defaults.triggered.third).toBe(false)
      expect(defaults.lastCheckMs).toBe(0)
    })
  })

  describe('validateAndParse', () => {
    it('should validate and parse correct time format', () => {
      const result = validateAndParse('05:30')
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBeNull()
      expect(result.parsedValue).toBe(5 * 60 * 1000 + 30 * 1000)
    })

    it('should validate and parse single digit minutes', () => {
      const result = validateAndParse('5:30')
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBeNull()
      expect(result.parsedValue).toBe(5 * 60 * 1000 + 30 * 1000)
    })

    it('should validate and parse zero seconds', () => {
      const result = validateAndParse('10:00')
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBeNull()
      expect(result.parsedValue).toBe(10 * 60 * 1000)
    })

    it('should handle whitespace in input', () => {
      const result = validateAndParse('  05:30  ')
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBeNull()
      expect(result.parsedValue).toBe(5 * 60 * 1000 + 30 * 1000)
    })

    it('should reject invalid time format', () => {
      const testCases = [
        '5',
        '5:',
        ':30',
        '5:3',
        '5:300',
        'abc',
        '5:60',
        '60:30',
        '5-30',
        '5.30'
      ]

      testCases.forEach(input => {
        const result = validateAndParse(input)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('mm:ss形式で入力してください（例：05:30）')
        expect(result.parsedValue).toBeNull()
      })
    })

    it('should reject zero time', () => {
      const result = validateAndParse('00:00')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('0より大きい時間を入力してください')
      expect(result.parsedValue).toBeNull()
    })

    it('should reject time over 59:59', () => {
      const result = validateAndParse('60:00')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('mm:ss形式で入力してください（例：05:30）')
      expect(result.parsedValue).toBeNull()
    })

    it('should accept maximum valid time 59:59', () => {
      const result = validateAndParse('59:59')
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBeNull()
      expect(result.parsedValue).toBe(59 * 60 * 1000 + 59 * 1000)
    })

    it('should accept minimum valid time 00:01', () => {
      const result = validateAndParse('00:01')
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBeNull()
      expect(result.parsedValue).toBe(1000)
    })

    it('should handle empty string', () => {
      const result = validateAndParse('')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('mm:ss形式で入力してください（例：05:30）')
      expect(result.parsedValue).toBeNull()
    })

    it('should handle whitespace-only string', () => {
      const result = validateAndParse('   ')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('mm:ss形式で入力してください（例：05:30）')
      expect(result.parsedValue).toBeNull()
    })
  })
})