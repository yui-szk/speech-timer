import { describe, it, expect } from 'vitest'
import {
  validateTimeFormat,
  parseTimeToMs,
  formatMsToTime,
  validateDurationMs,
  sanitizeTimeInput
} from './time'

describe('Time Utilities', () => {
  describe('validateTimeFormat', () => {
    it('should validate correct mm:ss format', () => {
      expect(validateTimeFormat('05:30')).toBe(true)
      expect(validateTimeFormat('12:00')).toBe(true)
      expect(validateTimeFormat('00:59')).toBe(true)
      expect(validateTimeFormat('59:59')).toBe(true)
    })

    it('should accept single digit minutes', () => {
      expect(validateTimeFormat('5:30')).toBe(true)
      expect(validateTimeFormat('1:00')).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(validateTimeFormat('5:3')).toBe(false) // Single digit seconds
      expect(validateTimeFormat('60:00')).toBe(false) // Minutes > 59
      expect(validateTimeFormat('05:60')).toBe(false) // Seconds > 59
      expect(validateTimeFormat('5')).toBe(false) // No colon
      expect(validateTimeFormat('5:30:00')).toBe(false) // Hours included
      expect(validateTimeFormat('abc:def')).toBe(false) // Non-numeric
      expect(validateTimeFormat('')).toBe(false) // Empty string
      expect(validateTimeFormat('-5:30')).toBe(false) // Negative minutes
    })
  })

  describe('parseTimeToMs', () => {
    it('should parse valid time strings to milliseconds', () => {
      expect(parseTimeToMs('05:30')).toBe(5 * 60 * 1000 + 30 * 1000)
      expect(parseTimeToMs('12:00')).toBe(12 * 60 * 1000)
      expect(parseTimeToMs('00:59')).toBe(59 * 1000)
      expect(parseTimeToMs('1:30')).toBe(1 * 60 * 1000 + 30 * 1000)
    })

    it('should return null for invalid formats', () => {
      expect(parseTimeToMs('60:00')).toBe(null)
      expect(parseTimeToMs('05:60')).toBe(null)
      expect(parseTimeToMs('abc:def')).toBe(null)
      expect(parseTimeToMs('5')).toBe(null)
      expect(parseTimeToMs('')).toBe(null)
    })

    it('should handle edge cases', () => {
      expect(parseTimeToMs('00:00')).toBe(0)
      expect(parseTimeToMs('59:59')).toBe(59 * 60 * 1000 + 59 * 1000)
    })
  })

  describe('formatMsToTime', () => {
    it('should format milliseconds to mm:ss format', () => {
      expect(formatMsToTime(5 * 60 * 1000 + 30 * 1000)).toBe('05:30')
      expect(formatMsToTime(12 * 60 * 1000)).toBe('12:00')
      expect(formatMsToTime(59 * 1000)).toBe('00:59')
      expect(formatMsToTime(0)).toBe('00:00')
    })

    it('should handle large values correctly', () => {
      expect(formatMsToTime(59 * 60 * 1000 + 59 * 1000)).toBe('59:59')
      expect(formatMsToTime(100 * 60 * 1000)).toBe('100:00') // Over 59 minutes
    })

    it('should handle fractional seconds by flooring', () => {
      expect(formatMsToTime(5 * 60 * 1000 + 30 * 1000 + 500)).toBe('05:30')
      expect(formatMsToTime(999)).toBe('00:00')
    })
  })

  describe('validateDurationMs', () => {
    it('should validate reasonable duration ranges', () => {
      expect(validateDurationMs(0)).toBe(true)
      expect(validateDurationMs(5 * 60 * 1000)).toBe(true)
      expect(validateDurationMs(59 * 60 * 1000 + 59 * 1000)).toBe(true)
    })

    it('should reject negative values', () => {
      expect(validateDurationMs(-1)).toBe(false)
      expect(validateDurationMs(-1000)).toBe(false)
    })

    it('should reject values over 59:59', () => {
      expect(validateDurationMs(60 * 60 * 1000)).toBe(false) // 60 minutes
      expect(validateDurationMs(100 * 60 * 1000)).toBe(false) // 100 minutes
    })
  })

  describe('sanitizeTimeInput', () => {
    it('should return parsed value for valid input', () => {
      expect(sanitizeTimeInput('05:30')).toBe(5 * 60 * 1000 + 30 * 1000)
      expect(sanitizeTimeInput('12:00')).toBe(12 * 60 * 1000)
    })

    it('should return fallback for invalid input', () => {
      expect(sanitizeTimeInput('invalid')).toBe(0)
      expect(sanitizeTimeInput('60:00')).toBe(0)
      expect(sanitizeTimeInput('', 5000)).toBe(5000)
    })

    it('should trim whitespace', () => {
      expect(sanitizeTimeInput('  05:30  ')).toBe(5 * 60 * 1000 + 30 * 1000)
      expect(sanitizeTimeInput('\t12:00\n')).toBe(12 * 60 * 1000)
    })

    it('should use custom fallback values', () => {
      const customFallback = 10 * 60 * 1000 // 10 minutes
      expect(sanitizeTimeInput('invalid', customFallback)).toBe(customFallback)
    })
  })
})