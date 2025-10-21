/**
 * Bell scheduling logic with threshold detection and duplicate prevention
 * Manages when bells should trigger based on remaining time thresholds
 */

import type { Millis, BellState, TimerSettings } from '../types'
import { getAudioManager } from './audio-manager'

export type BellType = 'first' | 'second' | 'third'

export interface BellTriggerEvent {
  type: BellType
  remainingMs: Millis
  thresholdMs: Millis
  timestamp: number
}

export interface BellSchedulerCallbacks {
  onBellTriggered?: (event: BellTriggerEvent) => void
  onError?: (error: Error) => void
}

export class BellScheduler {
  private callbacks: BellSchedulerCallbacks
  private lastRemainingMs: Millis = Infinity
  private audioManager = getAudioManager()

  constructor(callbacks: BellSchedulerCallbacks = {}) {
    this.callbacks = callbacks
  }

  /**
   * Check if any bells should trigger based on current and previous remaining time
   * Implements: previousRemaining > threshold && currentRemaining <= threshold
   */
  checkBells(
    currentRemainingMs: Millis,
    settings: TimerSettings,
    bellState: BellState
  ): BellType[] {
    const triggeredBells: BellType[] = []
    const previousRemainingMs = this.lastRemainingMs

    // Skip bell checking on first call (when lastRemainingMs is Infinity)
    // This prevents triggering bells when starting below threshold
    if (previousRemainingMs === Infinity) {
      this.lastRemainingMs = currentRemainingMs
      return triggeredBells
    }

    // Check each bell type
    const bellChecks: Array<{
      type: BellType
      thresholdMs: Millis
      enabled: boolean
      alreadyTriggered: boolean
    }> = [
      {
        type: 'first',
        thresholdMs: settings.bellTimesMs.first,
        enabled: settings.bellEnabled.first,
        alreadyTriggered: bellState.triggered.first
      },
      {
        type: 'second',
        thresholdMs: settings.bellTimesMs.second,
        enabled: settings.bellEnabled.second,
        alreadyTriggered: bellState.triggered.second
      },
      {
        type: 'third',
        thresholdMs: settings.bellTimesMs.third,
        enabled: settings.bellEnabled.third,
        alreadyTriggered: bellState.triggered.third
      }
    ]

    for (const bell of bellChecks) {
      if (this.shouldTriggerBell(
        bell.thresholdMs,
        currentRemainingMs,
        previousRemainingMs,
        bell.enabled,
        bell.alreadyTriggered
      )) {
        triggeredBells.push(bell.type)
        
        // Create trigger event
        const event: BellTriggerEvent = {
          type: bell.type,
          remainingMs: currentRemainingMs,
          thresholdMs: bell.thresholdMs,
          timestamp: performance.now()
        }

        // Play bell sound
        this.playBellSound(event)
        
        // Notify callback
        this.callbacks.onBellTriggered?.(event)
      }
    }

    // Update last remaining time for next check
    this.lastRemainingMs = currentRemainingMs

    return triggeredBells
  }

  /**
   * Determine if a bell should trigger based on threshold crossing logic
   */
  private shouldTriggerBell(
    thresholdMs: Millis,
    currentRemainingMs: Millis,
    previousRemainingMs: Millis,
    enabled: boolean,
    alreadyTriggered: boolean
  ): boolean {
    // Bell must be enabled
    if (!enabled) return false

    // Bell must not have been triggered already
    if (alreadyTriggered) return false

    // Threshold must be positive
    if (thresholdMs <= 0) return false

    // Check threshold crossing: previous > threshold && current <= threshold
    return previousRemainingMs > thresholdMs && currentRemainingMs <= thresholdMs
  }

  /**
   * Play bell sound using audio manager
   */
  private async playBellSound(event: BellTriggerEvent): Promise<void> {
    try {
      await this.audioManager.playBell()
    } catch (error) {
      const bellError = error instanceof Error 
        ? new Error(`Failed to play ${event.type} bell: ${error.message}`)
        : new Error(`Failed to play ${event.type} bell`)
      
      this.callbacks.onError?.(bellError)
    }
  }

  /**
   * Reset scheduler state (call when timer resets)
   */
  reset(): void {
    this.lastRemainingMs = Infinity
  }

  /**
   * Set volume for bell sounds
   */
  setVolume(volume: number): void {
    this.audioManager.setVolume(volume)
  }

  /**
   * Test bell sound playback
   */
  async testBell(): Promise<void> {
    try {
      await this.audioManager.testSound()
    } catch (error) {
      const testError = error instanceof Error 
        ? new Error(`Bell test failed: ${error.message}`)
        : new Error('Bell test failed')
      
      this.callbacks.onError?.(testError)
      throw testError
    }
  }

  /**
   * Initialize audio system (requires user gesture)
   */
  async initializeAudio(): Promise<void> {
    try {
      await this.audioManager.initialize()
    } catch (error) {
      const initError = error instanceof Error 
        ? new Error(`Audio initialization failed: ${error.message}`)
        : new Error('Audio initialization failed')
      
      this.callbacks.onError?.(initError)
      throw initError
    }
  }

  /**
   * Check if audio system is ready
   */
  isAudioReady(): boolean {
    return this.audioManager.isReady()
  }
}