/**
 * Unit tests for AudioManager
 * Tests Web Audio API integration, volume control, and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AudioManager, getAudioManager, initializeAudio } from './audio-manager'

// Mock Web Audio API
const mockAudioContext = {
  state: 'running' as AudioContextState,
  currentTime: 0,
  destination: {},
  createOscillator: vi.fn(),
  createGain: vi.fn(),
  resume: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined)
}

const mockGainNode = {
  gain: { value: 0.7, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  connect: vi.fn()
}

const mockOscillator = {
  type: 'sine' as OscillatorType,
  frequency: { setValueAtTime: vi.fn() },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  disconnect: vi.fn(),
  addEventListener: vi.fn()
}

// Mock global AudioContext
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockAudioContext)
})

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockAudioContext)
})

describe('AudioManager', () => {
  let audioManager: AudioManager
  let onContextStateChange: ReturnType<typeof vi.fn>
  let onError: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mock implementations
    mockAudioContext.createGain.mockReturnValue(mockGainNode)
    mockAudioContext.createOscillator.mockReturnValue(mockOscillator)
    mockAudioContext.state = 'running'
    
    onContextStateChange = vi.fn()
    onError = vi.fn()
    
    audioManager = new AudioManager({
      onContextStateChange,
      onError
    })
  })

  afterEach(async () => {
    try {
      await audioManager.destroy()
    } catch {
      // Ignore cleanup errors in tests
    }
  })

  describe('initialization', () => {
    it('should initialize audio context successfully', async () => {
      await audioManager.initialize()
      
      expect(window.AudioContext).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalled()
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination)
      expect(onContextStateChange).toHaveBeenCalledWith('running')
      expect(audioManager.isReady()).toBe(true)
    })

    it('should resume suspended audio context', async () => {
      mockAudioContext.state = 'suspended'
      
      await audioManager.initialize()
      
      expect(mockAudioContext.resume).toHaveBeenCalled()
    })

    it('should handle initialization errors', async () => {
      const error = new Error('AudioContext creation failed')
      vi.mocked(window.AudioContext).mockImplementationOnce(() => {
        throw error
      })
      
      await expect(audioManager.initialize()).rejects.toThrow('AudioContext creation failed')
      expect(onError).toHaveBeenCalledWith(error)
    })

    it('should not reinitialize if already initialized', async () => {
      await audioManager.initialize()
      vi.clearAllMocks()
      
      await audioManager.initialize()
      
      expect(window.AudioContext).not.toHaveBeenCalled()
    })
  })

  describe('volume control', () => {
    beforeEach(async () => {
      await audioManager.initialize()
    })

    it('should set volume within valid range', () => {
      audioManager.setVolume(0.5)
      
      expect(audioManager.getVolume()).toBe(0.5)
      expect(mockGainNode.gain.value).toBe(0.5)
    })

    it('should clamp volume to 0-1 range', () => {
      audioManager.setVolume(-0.5)
      expect(audioManager.getVolume()).toBe(0)
      
      audioManager.setVolume(1.5)
      expect(audioManager.getVolume()).toBe(1)
    })

    it('should set volume before initialization', () => {
      const newManager = new AudioManager()
      newManager.setVolume(0.3)
      
      expect(newManager.getVolume()).toBe(0.3)
    })
  })

  describe('bell sound playback', () => {
    beforeEach(async () => {
      await audioManager.initialize()
    })

    it('should play bell sound successfully', async () => {
      await audioManager.playBell()
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(2) // Initial + envelope
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(1000, 0)
      expect(mockOscillator.start).toHaveBeenCalledWith(0)
      expect(mockOscillator.stop).toHaveBeenCalledWith(0.25)
    })

    it('should initialize audio context if not ready', async () => {
      const newManager = new AudioManager()
      
      await newManager.playBell()
      
      expect(window.AudioContext).toHaveBeenCalled()
    })

    it('should resume suspended context before playing', async () => {
      mockAudioContext.state = 'suspended'
      
      await audioManager.playBell()
      
      expect(mockAudioContext.resume).toHaveBeenCalled()
    })

    it('should handle playback errors', async () => {
      const error = new Error('Oscillator creation failed')
      mockAudioContext.createOscillator.mockImplementationOnce(() => {
        throw error
      })
      
      await expect(audioManager.playBell()).rejects.toThrow('Oscillator creation failed')
      expect(onError).toHaveBeenCalled()
    })

    it('should test sound playback', async () => {
      await audioManager.testSound()
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled()
    })
  })

  describe('state management', () => {
    it('should report ready state correctly', async () => {
      expect(audioManager.isReady()).toBe(false)
      
      await audioManager.initialize()
      
      expect(audioManager.isReady()).toBe(true)
    })

    it('should return context state', async () => {
      expect(audioManager.getContextState()).toBeNull()
      
      await audioManager.initialize()
      
      expect(audioManager.getContextState()).toBe('running')
    })

    it('should handle context state changes', async () => {
      mockAudioContext.state = 'suspended'
      
      await audioManager.initialize()
      
      expect(audioManager.isReady()).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('should destroy audio manager properly', async () => {
      await audioManager.initialize()
      
      await audioManager.destroy()
      
      expect(mockAudioContext.close).toHaveBeenCalled()
      expect(audioManager.isReady()).toBe(false)
    })
  })
})

describe('singleton functions', () => {
  afterEach(async () => {
    // Reset singleton
    const manager = getAudioManager()
    await manager.destroy()
  })

  it('should return same instance from getAudioManager', () => {
    const manager1 = getAudioManager()
    const manager2 = getAudioManager()
    
    expect(manager1).toBe(manager2)
  })

  it('should initialize audio with initializeAudio function', async () => {
    const manager = await initializeAudio()
    
    expect(manager.isReady()).toBe(true)
  })
})