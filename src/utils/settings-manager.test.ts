import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SettingsManager, DEFAULT_SETTINGS } from './settings-manager'
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

// Mock console methods
const consoleMock = {
  warn: vi.fn(),
  error: vi.fn()
}

describe('SettingsManager', () => {
  let settingsManager: SettingsManager
  
  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.clear()
    vi.clearAllMocks()
    
    // Mock global localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
    
    // Mock console
    vi.spyOn(console, 'warn').mockImplementation(consoleMock.warn)
    vi.spyOn(console, 'error').mockImplementation(consoleMock.error)
    
    // Create fresh instance
    settingsManager = new SettingsManager()
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should detect localStorage availability', () => {
      expect(settingsManager.isAvailable()).toBe(true)
    })

    it('should handle localStorage unavailability', () => {
      // Mock localStorage to throw error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      
      const manager = new SettingsManager()
      expect(manager.isAvailable()).toBe(false)
      expect(consoleMock.warn).toHaveBeenCalledWith(
        'localStorage is not available. Settings will not persist.'
      )
    })
  })

  describe('loadSettings', () => {
    it('should return default settings when localStorage is empty', () => {
      const settings = settingsManager.loadSettings()
      expect(settings).toEqual(DEFAULT_SETTINGS)
    })

    it('should return default settings when localStorage is unavailable', () => {
      const manager = new SettingsManager()
      // Mock localStorage unavailability
      Object.defineProperty(manager, 'isLocalStorageAvailable', {
        value: false,
        writable: true
      })
      
      const settings = manager.loadSettings()
      expect(settings).toEqual(DEFAULT_SETTINGS)
    })

    it('should load valid settings from localStorage', () => {
      const testSettings: TimerSettings = {
        ...DEFAULT_SETTINGS,
        theme: 'system',
        volume: 0.5
      }
      
      const versionedSettings = {
        version: '1.0.0',
        settings: testSettings
      }
      
      localStorageMock.setItem('speech-timer-settings', JSON.stringify(versionedSettings))
      
      const settings = settingsManager.loadSettings()
      expect(settings).toEqual(testSettings)
    })

    it('should handle corrupted localStorage data', () => {
      localStorageMock.setItem('speech-timer-settings', 'invalid json')
      
      const settings = settingsManager.loadSettings()
      expect(settings).toEqual(DEFAULT_SETTINGS)
      expect(consoleMock.warn).toHaveBeenCalledWith(
        'Failed to load settings from localStorage:',
        expect.any(Error)
      )
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('speech-timer-settings')
    })

    it('should validate and fix invalid settings', () => {
      const invalidSettings = {
        version: '1.0.0',
        settings: {
          theme: 'invalid-theme',
          bellEnabled: 'not-an-object',
          bellTimesMs: { first: -100 },
          progressMode: 'invalid-mode',
          volume: 2.0 // Out of range
        }
      }
      
      localStorageMock.setItem('speech-timer-settings', JSON.stringify(invalidSettings))
      
      const settings = settingsManager.loadSettings()
      expect(settings).toEqual(DEFAULT_SETTINGS)
    })

    it('should handle unknown version with migration', () => {
      const futureVersionSettings = {
        version: '2.0.0',
        settings: DEFAULT_SETTINGS
      }
      
      localStorageMock.setItem('speech-timer-settings', JSON.stringify(futureVersionSettings))
      
      const settings = settingsManager.loadSettings()
      expect(settings).toEqual(DEFAULT_SETTINGS)
    })
  })

  describe('saveSettings', () => {
    it('should save valid settings to localStorage', () => {
      const testSettings: TimerSettings = {
        ...DEFAULT_SETTINGS,
        theme: 'system',
        volume: 0.8
      }
      
      const result = settingsManager.saveSettings(testSettings)
      
      expect(result).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'speech-timer-settings',
        JSON.stringify({
          version: '1.0.0',
          settings: testSettings
        })
      )
    })

    it('should return false when localStorage is unavailable', () => {
      const manager = new SettingsManager()
      Object.defineProperty(manager, 'isLocalStorageAvailable', {
        value: false,
        writable: true
      })
      
      const result = manager.saveSettings(DEFAULT_SETTINGS)
      expect(result).toBe(false)
    })

    it('should handle localStorage errors', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      const result = settingsManager.saveSettings(DEFAULT_SETTINGS)
      
      expect(result).toBe(false)
      expect(consoleMock.error).toHaveBeenCalledWith(
        'Failed to save settings to localStorage:',
        expect.any(Error)
      )
    })

    it('should handle quota exceeded error', () => {
      // Clear previous calls
      localStorageMock.setItem.mockClear()
      
      // First call throws QuotaExceededError, second call succeeds
      let callCount = 0
      localStorageMock.setItem.mockImplementation((key: string, value: string) => {
        callCount++
        if (callCount === 1) {
          const error = new DOMException('Quota exceeded', 'QuotaExceededError')
          throw error
        }
        // Second call succeeds
      })
      
      const result = settingsManager.saveSettings(DEFAULT_SETTINGS)
      
      expect(result).toBe(true)
      expect(consoleMock.warn).toHaveBeenCalledWith(
        'localStorage quota exceeded. Attempting to clear old data.'
      )
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2)
    })

    it('should handle quota exceeded error with failed retry', () => {
      localStorageMock.setItem.mockImplementation(() => {
        const error = new DOMException('Quota exceeded', 'QuotaExceededError')
        throw error
      })
      
      const result = settingsManager.saveSettings(DEFAULT_SETTINGS)
      
      expect(result).toBe(false)
      expect(consoleMock.error).toHaveBeenCalledWith(
        'Failed to save settings even after cleanup'
      )
    })

    it('should validate settings before saving', () => {
      const invalidSettings = {
        theme: 'invalid',
        bellEnabled: null,
        bellTimesMs: { first: -1 },
        progressMode: 'invalid',
        volume: 5
      } as unknown as TimerSettings
      
      settingsManager.saveSettings(invalidSettings)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'speech-timer-settings',
        JSON.stringify({
          version: '1.0.0',
          settings: DEFAULT_SETTINGS
        })
      )
    })
  })

  describe('clearSettings', () => {
    it('should remove settings from localStorage', () => {
      settingsManager.clearSettings()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('speech-timer-settings')
    })

    it('should handle localStorage unavailability', () => {
      // Mock localStorage to be unavailable during construction
      const originalSetItem = localStorageMock.setItem
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      
      const manager = new SettingsManager()
      
      // Restore setItem for other operations
      localStorageMock.setItem.mockImplementation(originalSetItem)
      
      // Clear previous calls from constructor test
      localStorageMock.removeItem.mockClear()
      
      manager.clearSettings()
      expect(localStorageMock.removeItem).not.toHaveBeenCalled()
    })

    it('should handle localStorage errors', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Remove error')
      })
      
      settingsManager.clearSettings()
      expect(consoleMock.warn).toHaveBeenCalledWith(
        'Failed to clear settings from localStorage:',
        expect.any(Error)
      )
    })
  })

  describe('getStorageInfo', () => {
    it('should return storage information when available', () => {
      const testData = JSON.stringify({ version: '1.0.0', settings: DEFAULT_SETTINGS })
      localStorageMock.setItem('speech-timer-settings', testData)
      
      const info = settingsManager.getStorageInfo()
      
      expect(info).toEqual({
        used: testData.length,
        available: true
      })
    })

    it('should return zero usage when no data stored', () => {
      const info = settingsManager.getStorageInfo()
      
      expect(info).toEqual({
        used: 0,
        available: true
      })
    })

    it('should handle localStorage unavailability', () => {
      const manager = new SettingsManager()
      Object.defineProperty(manager, 'isLocalStorageAvailable', {
        value: false,
        writable: true
      })
      
      const info = manager.getStorageInfo()
      
      expect(info).toEqual({
        used: 0,
        available: false
      })
    })

    it('should handle localStorage errors', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Get error')
      })
      
      const info = settingsManager.getStorageInfo()
      
      expect(info).toEqual({
        used: 0,
        available: false
      })
    })
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SettingsManager.getInstance()
      const instance2 = SettingsManager.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('settings validation', () => {
    it('should validate theme values', () => {
      const settings = {
        version: '1.0.0',
        settings: {
          ...DEFAULT_SETTINGS,
          theme: 'invalid-theme'
        }
      }
      
      localStorageMock.setItem('speech-timer-settings', JSON.stringify(settings))
      
      const loaded = settingsManager.loadSettings()
      expect(loaded.theme).toBe(DEFAULT_SETTINGS.theme)
    })

    it('should validate bell enabled structure', () => {
      const settings = {
        version: '1.0.0',
        settings: {
          ...DEFAULT_SETTINGS,
          bellEnabled: { first: true, second: 'invalid' }
        }
      }
      
      localStorageMock.setItem('speech-timer-settings', JSON.stringify(settings))
      
      const loaded = settingsManager.loadSettings()
      expect(loaded.bellEnabled).toEqual(DEFAULT_SETTINGS.bellEnabled)
    })

    it('should validate bell times structure', () => {
      const settings = {
        version: '1.0.0',
        settings: {
          ...DEFAULT_SETTINGS,
          bellTimesMs: { first: -100, second: 'invalid', third: 1000 }
        }
      }
      
      localStorageMock.setItem('speech-timer-settings', JSON.stringify(settings))
      
      const loaded = settingsManager.loadSettings()
      expect(loaded.bellTimesMs).toEqual(DEFAULT_SETTINGS.bellTimesMs)
    })

    it('should validate progress mode values', () => {
      const settings = {
        version: '1.0.0',
        settings: {
          ...DEFAULT_SETTINGS,
          progressMode: 'invalid-mode'
        }
      }
      
      localStorageMock.setItem('speech-timer-settings', JSON.stringify(settings))
      
      const loaded = settingsManager.loadSettings()
      expect(loaded.progressMode).toBe(DEFAULT_SETTINGS.progressMode)
    })

    it('should validate volume range', () => {
      const settings = {
        version: '1.0.0',
        settings: {
          ...DEFAULT_SETTINGS,
          volume: 2.5
        }
      }
      
      localStorageMock.setItem('speech-timer-settings', JSON.stringify(settings))
      
      const loaded = settingsManager.loadSettings()
      expect(loaded.volume).toBe(DEFAULT_SETTINGS.volume)
    })
  })
})