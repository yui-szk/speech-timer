import type { Millis } from '../types'

/**
 * Time validation and formatting utilities for the Speech Timer application
 */

/**
 * Validates a time string in mm:ss format
 * @param timeString - Time string to validate (e.g., "05:30", "12:00")
 * @returns true if valid, false otherwise
 */
export function validateTimeFormat(timeString: string): boolean {
  const timeRegex = /^(\d{1,2}):([0-5]\d)$/
  if (!timeRegex.test(timeString)) {
    return false
  }
  
  const [minutes] = timeString.split(':').map(Number)
  return minutes <= 59
}

/**
 * Parses a time string in mm:ss format to milliseconds
 * @param timeString - Time string in mm:ss format (e.g., "05:30")
 * @returns Milliseconds or null if invalid
 */
export function parseTimeToMs(timeString: string): Millis | null {
  if (!validateTimeFormat(timeString)) {
    return null
  }

  const [minutes, seconds] = timeString.split(':').map(Number)
  
  // Additional validation for reasonable ranges
  if (minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return null
  }

  return (minutes * 60 + seconds) * 1000
}

/**
 * Formats milliseconds to mm:ss format
 * @param ms - Milliseconds to format
 * @returns Formatted time string (e.g., "05:30")
 */
export function formatMsToTime(ms: Millis): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Validates if milliseconds represent a reasonable time duration
 * @param ms - Milliseconds to validate
 * @returns true if valid (0 to 59:59), false otherwise
 */
export function validateDurationMs(ms: Millis): boolean {
  return ms >= 0 && ms <= 59 * 60 * 1000 + 59 * 1000 // Max 59:59
}

/**
 * Sanitizes and validates time input, returning a safe value
 * @param input - Raw time input string
 * @param fallback - Fallback value in milliseconds if input is invalid
 * @returns Valid milliseconds value
 */
export function sanitizeTimeInput(input: string, fallback: Millis = 0): Millis {
  const parsed = parseTimeToMs(input.trim())
  
  if (parsed === null || !validateDurationMs(parsed)) {
    return fallback
  }
  
  return parsed
}