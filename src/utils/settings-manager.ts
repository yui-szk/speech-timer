import type { TimerSettings } from '../types'

// Storage key for settings
const SETTINGS_STORAGE_KEY = 'speech-timer-settings'
const SETTINGS_VERSION = '1.0.0'

// Default settings
export const DEFAULT_SETTINGS: TimerSettings = {
  theme: 'mint',
  bellEnabled: {
    first: true,
    second: true,
    third: true
  },
  bellTimesMs: {
    first: 3 * 60 * 1000, // 3 minutes
    second: 2 * 60 * 1000, // 2 minutes  
    third: 1 * 60 * 1000   // 1 minute
  },
  progressMode: 'remaining',
  volume: 0.7
}

// Versioned settings structure for future migrations
interface VersionedSettings {
  version: string
  settings: TimerSettings
}

// Settings validation functions
function isValidTheme(theme: unknown): theme is TimerSettings['theme'] {
  return typeof theme === 'string' && ['mint', 'system'].includes(theme)
}

function isValidProgressMode(mode: unknown): mode is TimerSettings['progressMode'] {
  return typeof mode === 'string' && ['remaining', 'elapsed'].includes(mode)
}

function isValidBellEnabled(bellEnabled: unknown): bellEnabled is TimerSettings['bellEnabled'] {
  if (typeof bellEnabled !== 'object' || bellEnabled === null) return false
  const obj = bellEnabled as Record<string, unknown>
  return (
    typeof obj.first === 'boolean' &&
    typeof obj.second === 'boolean' &&
    typeof obj.third === 'boolean'
  )
}

function isValidBellTimesMs(bellTimesMs: unknown): bellTimesMs is TimerSettings['bellTimesMs'] {
  if (typeof bellTimesMs !== 'object' || bellTimesMs === null) return false
  const obj = bellTimesMs as Record<string, unknown>
  return (
    typeof obj.first === 'number' && obj.first >= 0 &&
    typeof obj.second === 'number' && obj.second >= 0 &&
    typeof obj.third === 'number' && obj.third >= 0
  )
}

function isValidVolume(volume: unknown): volume is number {
  return typeof volume === 'number' && volume >= 0 && volume <= 1
}

// Validate settings object
function validateSettings(settings: unknown): TimerSettings {
  if (typeof settings !== 'object' || settings === null) {
    return DEFAULT_SETTINGS
  }

  const obj = settings as Record<string, unknown>
  
  return {
    theme: isValidTheme(obj.theme) ? obj.theme : DEFAULT_SETTINGS.theme,
    bellEnabled: isValidBellEnabled(obj.bellEnabled) ? obj.bellEnabled : DEFAULT_SETTINGS.bellEnabled,
    bellTimesMs: isValidBellTimesMs(obj.bellTimesMs) ? obj.bellTimesMs : DEFAULT_SETTINGS.bellTimesMs,
    progressMode: isValidProgressMode(obj.progressMode) ? obj.progressMode : DEFAULT_SETTINGS.progressMode,
    volume: isValidVolume(obj.volume) ? obj.volume : DEFAULT_SETTINGS.volume
  }
}

// Settings migration for future versions
function migrateSettings(versionedSettings: VersionedSettings): TimerSettings {
  // Currently only version 1.0.0 exists, so no migration needed
  // Future versions can add migration logic here
  switch (versionedSettings.version) {
    case '1.0.0':
      return validateSettings(versionedSettings.settings)
    default:
      // Unknown version, use defaults
      return DEFAULT_SETTINGS
  }
}

export class SettingsManager {
  private static instance: SettingsManager | null = null
  private isLocalStorageAvailable: boolean = true

  constructor() {
    // Test localStorage availability
    try {
      const testKey = '__localStorage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
    } catch {
      this.isLocalStorageAvailable = false
      console.warn('localStorage is not available. Settings will not persist.')
    }
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager()
    }
    return SettingsManager.instance
  }

  /**
   * Load settings from localStorage with fallback to defaults
   */
  loadSettings(): TimerSettings {
    if (!this.isLocalStorageAvailable) {
      return DEFAULT_SETTINGS
    }

    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (!stored) {
        return DEFAULT_SETTINGS
      }

      const parsed = JSON.parse(stored) as VersionedSettings
      return migrateSettings(parsed)
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error)
      // Clear corrupted data
      this.clearSettings()
      return DEFAULT_SETTINGS
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings(settings: TimerSettings): boolean {
    if (!this.isLocalStorageAvailable) {
      return false
    }

    try {
      const versionedSettings: VersionedSettings = {
        version: SETTINGS_VERSION,
        settings: validateSettings(settings)
      }
      
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(versionedSettings))
      return true
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error)
      
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Attempting to clear old data.')
        this.handleQuotaExceeded()
        
        // Try saving again after cleanup
        try {
          const versionedSettings: VersionedSettings = {
            version: SETTINGS_VERSION,
            settings: validateSettings(settings)
          }
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(versionedSettings))
          return true
        } catch {
          console.error('Failed to save settings even after cleanup')
          return false
        }
      }
      
      return false
    }
  }

  /**
   * Clear all settings from localStorage
   */
  clearSettings(): void {
    if (!this.isLocalStorageAvailable) {
      return
    }

    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear settings from localStorage:', error)
    }
  }

  /**
   * Handle localStorage quota exceeded by clearing old data
   */
  private handleQuotaExceeded(): void {
    try {
      // Clear all localStorage data except our settings
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key !== SETTINGS_STORAGE_KEY) {
          keys.push(key)
        }
      }
      
      for (const key of keys) {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn('Failed to clear localStorage during quota cleanup:', error)
    }
  }

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    return this.isLocalStorageAvailable
  }

  /**
   * Get storage usage information (for debugging)
   */
  getStorageInfo(): { used: number; available: boolean } {
    if (!this.isLocalStorageAvailable) {
      return { used: 0, available: false }
    }

    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
      return {
        used: stored ? stored.length : 0,
        available: true
      }
    } catch {
      return { used: 0, available: false }
    }
  }
}

// Export singleton instance
export const settingsManager = SettingsManager.getInstance()