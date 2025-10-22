import type { TimerSettings, TimerState, BellState, Millis, ProgressMode } from '../types'
import { validateTimeFormat, parseTimeToMs } from './time'

/**
 * Data model validation utilities for the Speech Timer application
 */

/**
 * Validation result structure for time input
 */
export interface ValidationResult {
  isValid: boolean
  error: string | null
  parsedValue: Millis | null
}

/**
 * Validates and parses time input string
 * @param input - Time input string to validate and parse
 * @returns Structured validation result
 */
export function validateAndParse(input: string): ValidationResult {
  const trimmed = input.trim()
  
  if (!validateTimeFormat(trimmed)) {
    return {
      isValid: false,
      error: 'mm:ss形式で入力してください（例：05:30）',
      parsedValue: null
    }
  }
  
  const parsedMs = parseTimeToMs(trimmed)
  if (parsedMs === null) {
    return {
      isValid: false,
      error: '59:59以下の時間を入力してください',
      parsedValue: null
    }
  }
  
  if (parsedMs === 0) {
    return {
      isValid: false,
      error: '0より大きい時間を入力してください',
      parsedValue: null
    }
  }
  
  return {
    isValid: true,
    error: null,
    parsedValue: parsedMs
  }
}

/**
 * Validates TimerSettings object
 * @param settings - Settings object to validate
 * @returns true if valid, false otherwise
 */
export function validateTimerSettings(settings: unknown): settings is TimerSettings {
  if (!settings || typeof settings !== 'object') {
    return false
  }

  const s = settings as Record<string, unknown>

  // Validate theme
  if (s.theme !== 'mint' && s.theme !== 'system') {
    return false
  }

  // Validate bellEnabled
  if (!s.bellEnabled || typeof s.bellEnabled !== 'object') {
    return false
  }
  const bellEnabled = s.bellEnabled as Record<string, unknown>
  if (
    typeof bellEnabled.first !== 'boolean' ||
    typeof bellEnabled.second !== 'boolean' ||
    typeof bellEnabled.third !== 'boolean'
  ) {
    return false
  }

  // Validate bellTimesMs
  if (!s.bellTimesMs || typeof s.bellTimesMs !== 'object') {
    return false
  }
  const bellTimesMs = s.bellTimesMs as Record<string, unknown>
  if (
    typeof bellTimesMs.first !== 'number' ||
    typeof bellTimesMs.second !== 'number' ||
    typeof bellTimesMs.third !== 'number' ||
    bellTimesMs.first < 0 ||
    bellTimesMs.second < 0 ||
    bellTimesMs.third < 0
  ) {
    return false
  }

  // Validate progressMode
  if (s.progressMode !== 'remaining' && s.progressMode !== 'elapsed') {
    return false
  }

  // Validate volume
  if (typeof s.volume !== 'number' || s.volume < 0 || s.volume > 1) {
    return false
  }

  return true
}

/**
 * Validates TimerState object
 * @param state - State object to validate
 * @returns true if valid, false otherwise
 */
export function validateTimerState(state: unknown): state is TimerState {
  if (!state || typeof state !== 'object') {
    return false
  }

  const s = state as Record<string, unknown>

  // Validate status
  const validStatuses = ['idle', 'running', 'paused', 'finished']
  if (!validStatuses.includes(s.status as string)) {
    return false
  }

  // Validate durationMs
  if (typeof s.durationMs !== 'number' || s.durationMs < 0) {
    return false
  }

  // Validate startEpochMs (optional)
  if (s.startEpochMs !== undefined && typeof s.startEpochMs !== 'number') {
    return false
  }

  // Validate pauseAccumulatedMs
  if (typeof s.pauseAccumulatedMs !== 'number' || s.pauseAccumulatedMs < 0) {
    return false
  }

  // Validate nowEpochMs
  if (typeof s.nowEpochMs !== 'number') {
    return false
  }

  return true
}

/**
 * Validates BellState object
 * @param state - Bell state object to validate
 * @returns true if valid, false otherwise
 */
export function validateBellState(state: unknown): state is BellState {
  if (!state || typeof state !== 'object') {
    return false
  }

  const s = state as Record<string, unknown>

  // Validate triggered
  if (!s.triggered || typeof s.triggered !== 'object') {
    return false
  }
  const triggered = s.triggered as Record<string, unknown>
  if (
    typeof triggered.first !== 'boolean' ||
    typeof triggered.second !== 'boolean' ||
    typeof triggered.third !== 'boolean'
  ) {
    return false
  }

  // Validate lastCheckMs
  if (typeof s.lastCheckMs !== 'number' || s.lastCheckMs < 0) {
    return false
  }

  return true
}

/**
 * Creates default TimerSettings with safe values
 * @returns Default TimerSettings object
 */
export function createDefaultTimerSettings(): TimerSettings {
  return {
    theme: 'mint',
    bellEnabled: {
      first: true,
      second: true,
      third: true
    },
    bellTimesMs: {
      first: 8 * 60 * 1000, // 8 minutes
      second: 2 * 60 * 1000, // 2 minutes
      third: 30 * 1000 // 30 seconds
    },
    progressMode: 'remaining',
    volume: 0.7
  }
}

/**
 * Creates default TimerState with safe values
 * @returns Default TimerState object
 */
export function createDefaultTimerState(): TimerState {
  return {
    status: 'idle',
    durationMs: 10 * 60 * 1000, // 10 minutes default
    startEpochMs: undefined,
    pauseAccumulatedMs: 0,
    nowEpochMs: Date.now()
  }
}

/**
 * Creates default BellState with safe values
 * @returns Default BellState object
 */
export function createDefaultBellState(): BellState {
  return {
    triggered: {
      first: false,
      second: false,
      third: false
    },
    lastCheckMs: 0
  }
}