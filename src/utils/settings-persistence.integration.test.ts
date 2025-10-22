import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { settingsManager, DEFAULT_SETTINGS } from './settings-manager'
import type { TimerSettings } from '../types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  }
})()

describe('Settings Persistence Integration', () => {
  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.clear()
    vi.clearAllMocks()
    
    // Mock global localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should load default settings when localStorage is empty', () => {
    const loadedSettings = settingsManager.loadSettings()
    
    expect(loadedSettings.theme).toBe('mint')
    expect(loadedSettings.volume).toBe(0.7)
    expect(loadedSettings.progressMode).toBe('remaining')
  })

  it('should load saved settings from localStorage', () => {
    // Pre-populate localStorage with settings
    const savedSettings: TimerSettings = {
      theme: 'system',
      bellEnabled: { first: false, second: true, third: false },
      bellTimesMs: { first: 5000, second: 3000, third: 1000 },
      progressMode: 'elapsed',
      volume: 0.3
    }
    
    const versionedSettings = {
      version: '1.0.0',
      settings: savedSettings
    }
    
    localStorageMock.setItem('speech-timer-settings', JSON.stringify(versionedSettings))
    
    // Load settings using settings manager
    const loadedSettings = settingsManager.loadSettings()
    
    expect(loadedSettings).toEqual(savedSettings)
  })

  it('should save settings to localStorage', () => {
    const testSettings: TimerSettings = {
      theme: 'system',
      bellEnabled: { first: false, second: true, third: false },
      bellTimesMs: { first: 5000, second: 3000, third: 1000 },
      progressMode: 'elapsed',
      volume: 0.5
    }
    
    const result = settingsManager.saveSettings(testSettings)
    
    expect(result).toBe(true)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'speech-timer-settings',
      expect.stringContaining('"theme":"system"')
    )
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'speech-timer-settings',
      expect.stringContaining('"volume":0.5')
    )
  })

  it('should save and load settings round-trip correctly', () => {
    const testSettings: TimerSettings = {
      theme: 'system',
      bellEnabled: { first: false, second: true, third: false },
      bellTimesMs: { first: 5000, second: 3000, third: 1000 },
      progressMode: 'elapsed',
      volume: 0.9
    }
    
    // Save settings
    const saveResult = settingsManager.saveSettings(testSettings)
    expect(saveResult).toBe(true)
    
    // Load settings back
    const loadedSettings = settingsManager.loadSettings()
    expect(loadedSettings).toEqual(testSettings)
  })

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage to throw error
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage error')
    })
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // This should not throw an error
    const result = settingsManager.saveSettings(DEFAULT_SETTINGS)
    
    // Should return false indicating failure
    expect(result).toBe(false)
    
    // Error should be logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to save settings to localStorage:',
      expect.any(Error)
    )
    
    consoleSpy.mockRestore()
  })

  it('should validate and fix corrupted settings on load', () => {
    // Store corrupted settings
    const corruptedSettings = {
      version: '1.0.0',
      settings: {
        theme: 'invalid-theme',
        bellEnabled: 'not-an-object',
        volume: 5.0 // Out of range
      }
    }
    
    localStorageMock.setItem('speech-timer-settings', JSON.stringify(corruptedSettings))
    
    const loadedSettings = settingsManager.loadSettings()
    
    // Should fall back to default settings
    expect(loadedSettings.theme).toBe('mint')
    expect(loadedSettings.volume).toBe(0.7)
    expect(loadedSettings.bellEnabled).toEqual({
      first: true,
      second: true,
      third: true
    })
  })

  it('should handle localStorage unavailability', () => {
    // Mock localStorage to be unavailable during construction
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage not available')
    })
    
    // Create new settings manager instance
    const unavailableManager = new (settingsManager.constructor as any)()
    
    // Should return false for availability
    expect(unavailableManager.isAvailable()).toBe(false)
    
    // Should return default settings when loading
    const settings = unavailableManager.loadSettings()
    expect(settings).toEqual(DEFAULT_SETTINGS)
    
    // Should return false when trying to save
    const saveResult = unavailableManager.saveSettings(DEFAULT_SETTINGS)
    expect(saveResult).toBe(false)
  })

  it('should maintain settings consistency across multiple operations', () => {
    let currentSettings = DEFAULT_SETTINGS
    
    // Perform multiple save operations
    currentSettings = { ...currentSettings, theme: 'system' }
    settingsManager.saveSettings(currentSettings)
    
    currentSettings = { ...currentSettings, volume: 0.4 }
    settingsManager.saveSettings(currentSettings)
    
    currentSettings = { 
      ...currentSettings, 
      bellEnabled: { first: false, second: true, third: false }
    }
    settingsManager.saveSettings(currentSettings)
    
    // Load final settings
    const finalSettings = settingsManager.loadSettings()
    
    // Verify final state
    expect(finalSettings.theme).toBe('system')
    expect(finalSettings.volume).toBe(0.4)
    expect(finalSettings.bellEnabled).toEqual({
      first: false,
      second: true,
      third: false
    })
    
    // Verify localStorage was called for each save
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(3)
  })
})