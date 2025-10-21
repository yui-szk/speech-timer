/**
 * Web Audio API manager for bell sounds
 * Handles audio context initialization, volume control, and bell sound generation
 */

export interface AudioManagerCallbacks {
  onContextStateChange?: (state: AudioContextState) => void
  onError?: (error: Error) => void
}

export class AudioManager {
  private context: AudioContext | null = null
  private gainNode: GainNode | null = null
  private callbacks: AudioManagerCallbacks
  private isInitialized = false
  private volume = 0.7 // Default volume (0-1)

  constructor(callbacks: AudioManagerCallbacks = {}) {
    this.callbacks = callbacks
  }

  /**
   * Initialize audio context (requires user gesture)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Create audio context
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Create gain node for volume control
      this.gainNode = this.context.createGain()
      this.gainNode.connect(this.context.destination)
      this.gainNode.gain.value = this.volume

      // Resume context if suspended (required by autoplay policy)
      if (this.context.state === 'suspended') {
        await this.context.resume()
      }

      this.isInitialized = true
      this.callbacks.onContextStateChange?.(this.context.state)
    } catch (error) {
      const audioError = error instanceof Error ? error : new Error('Failed to initialize audio context')
      this.callbacks.onError?.(audioError)
      throw audioError
    }
  }

  /**
   * Play bell sound using OscillatorNode
   */
  async playBell(): Promise<void> {
    if (!this.isInitialized || !this.context || !this.gainNode) {
      await this.initialize()
    }

    if (!this.context || !this.gainNode) {
      throw new Error('Audio context not available')
    }

    try {
      // Resume context if suspended
      if (this.context.state === 'suspended') {
        await this.context.resume()
      }

      const now = this.context.currentTime
      
      // Create oscillator for bell sound
      const oscillator = this.context.createOscillator()
      const envelope = this.context.createGain()

      // Connect: oscillator -> envelope -> main gain -> destination
      oscillator.connect(envelope)
      envelope.connect(this.gainNode)

      // Configure bell sound (1kHz sine wave)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(1000, now)

      // Create envelope (attack: 50ms, decay: 200ms)
      envelope.gain.setValueAtTime(0, now)
      envelope.gain.linearRampToValueAtTime(1, now + 0.05) // 50ms attack
      envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.25) // 200ms decay

      // Start and stop oscillator
      oscillator.start(now)
      oscillator.stop(now + 0.25)

      // Clean up after sound finishes
      oscillator.addEventListener('ended', () => {
        oscillator.disconnect()
        envelope.disconnect()
      })

    } catch (error) {
      const audioError = error instanceof Error ? error : new Error('Failed to play bell sound')
      this.callbacks.onError?.(audioError)
      throw audioError
    }
  }

  /**
   * Set volume (0-1 range)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume
  }

  /**
   * Test sound playback (same as playBell but for testing)
   */
  async testSound(): Promise<void> {
    return this.playBell()
  }

  /**
   * Check if audio context is initialized and ready
   */
  isReady(): boolean {
    return this.isInitialized && 
           this.context !== null && 
           this.context.state === 'running'
  }

  /**
   * Get audio context state
   */
  getContextState(): AudioContextState | null {
    return this.context?.state || null
  }

  /**
   * Destroy audio manager and clean up resources
   */
  async destroy(): Promise<void> {
    if (this.context) {
      await this.context.close()
      this.context = null
    }
    
    this.gainNode = null
    this.isInitialized = false
  }
}

// Singleton instance for app-wide use
let audioManagerInstance: AudioManager | null = null

/**
 * Get singleton audio manager instance
 */
export function getAudioManager(callbacks?: AudioManagerCallbacks): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager(callbacks)
  }
  return audioManagerInstance
}

/**
 * Initialize audio manager with user gesture
 * Call this from a user interaction event (click, touch, etc.)
 */
export async function initializeAudio(callbacks?: AudioManagerCallbacks): Promise<AudioManager> {
  const manager = getAudioManager(callbacks)
  await manager.initialize()
  return manager
}