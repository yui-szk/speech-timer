/**
 * High-precision timer engine using performance.now() and requestAnimationFrame
 * Maintains ±50ms accuracy and handles state transitions properly
 */

import type { Millis } from '../types'

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'

export interface TimerEngineState {
  status: TimerStatus
  durationMs: Millis
  elapsedMs: Millis
  remainingMs: Millis
  startTime?: number
  pauseAccumulatedMs: Millis
  lastUpdateTime: number
  precisionDriftMs: number
}

export interface TimerEngineCallbacks {
  onTick?: (state: TimerEngineState) => void
  onStatusChange?: (status: TimerStatus, state: TimerEngineState) => void
  onFinish?: (state: TimerEngineState) => void
}

export class TimerEngine {
  private state: TimerEngineState
  private callbacks: TimerEngineCallbacks
  private rafId?: number
  private lastRafTime: number = 0
  private precisionCheckInterval: number = 1000 // Check precision every 1 second
  private lastPrecisionCheck: number = 0

  constructor(durationMs: Millis, callbacks: TimerEngineCallbacks = {}) {
    this.callbacks = callbacks
    this.state = {
      status: 'idle',
      durationMs,
      elapsedMs: 0,
      remainingMs: durationMs,
      pauseAccumulatedMs: 0,
      lastUpdateTime: performance.now(),
      precisionDriftMs: 0
    }
  }

  /**
   * Start the timer
   */
  start(): void {
    if (this.state.status === 'running') return

    const now = performance.now()
    
    this.state = {
      ...this.state,
      status: 'running',
      startTime: now,
      lastUpdateTime: now
    }

    this.callbacks.onStatusChange?.('running', this.state)
    this.startRafLoop()
  }

  /**
   * Pause the timer
   */
  pause(): void {
    if (this.state.status !== 'running') return

    const now = performance.now()
    const sessionElapsed = this.state.startTime ? now - this.state.startTime : 0
    
    this.state = {
      ...this.state,
      status: 'paused',
      pauseAccumulatedMs: this.state.pauseAccumulatedMs + sessionElapsed,
      startTime: undefined,
      lastUpdateTime: now
    }

    this.callbacks.onStatusChange?.('paused', this.state)
    this.stopRafLoop()
  }

  /**
   * Resume the timer (same as start for paused timer)
   */
  resume(): void {
    if (this.state.status !== 'paused') return
    this.start()
  }

  /**
   * Reset the timer to initial state
   */
  reset(): void {
    const now = performance.now()
    
    this.state = {
      status: 'idle',
      durationMs: this.state.durationMs,
      elapsedMs: 0,
      remainingMs: this.state.durationMs,
      pauseAccumulatedMs: 0,
      lastUpdateTime: now,
      precisionDriftMs: 0
    }

    this.callbacks.onStatusChange?.('idle', this.state)
    this.stopRafLoop()
  }

  /**
   * Set new duration (can be called while running)
   */
  setDuration(durationMs: Millis): void {
    // 現在の値と同じ場合は早期リターン（重複更新防止）
    if (this.state.durationMs === durationMs) {
      return
    }

    const oldDuration = this.state.durationMs
    const remainingRatio = this.state.remainingMs / oldDuration
    
    this.state = {
      ...this.state,
      durationMs,
      remainingMs: Math.max(0, durationMs * remainingRatio)
    }

    // Recalculate elapsed based on new duration
    this.updateTimeCalculations(performance.now())
  }

  /**
   * Get current timer state
   */
  getState(): TimerEngineState {
    return { ...this.state }
  }

  /**
   * Destroy the timer and clean up resources
   */
  destroy(): void {
    this.stopRafLoop()
  }

  /**
   * Start the requestAnimationFrame loop
   */
  private startRafLoop(): void {
    this.lastRafTime = performance.now()
    this.lastPrecisionCheck = this.lastRafTime
    this.rafId = requestAnimationFrame(this.rafTick)
  }

  /**
   * Stop the requestAnimationFrame loop
   */
  private stopRafLoop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = undefined
    }
  }

  /**
   * RequestAnimationFrame tick handler
   */
  private rafTick = (timestamp: number): void => {
    if (this.state.status !== 'running') return

    this.updateTimeCalculations(timestamp)
    this.checkPrecision(timestamp)

    // Check if timer finished
    if (this.state.remainingMs <= 0) {
      this.state = {
        ...this.state,
        status: 'finished',
        elapsedMs: this.state.durationMs,
        remainingMs: 0
      }
      
      this.callbacks.onStatusChange?.('finished', this.state)
      this.callbacks.onFinish?.(this.state)
      this.stopRafLoop()
      return
    }

    this.callbacks.onTick?.(this.state)
    
    // Continue RAF loop only if still running
    if (this.state.status === 'running') {
      this.rafId = requestAnimationFrame(this.rafTick)
    }
  }

  /**
   * Update time calculations based on current timestamp
   */
  private updateTimeCalculations(timestamp: number): void {
    if (this.state.startTime === undefined) return

    const sessionElapsed = timestamp - this.state.startTime
    const totalElapsed = this.state.pauseAccumulatedMs + sessionElapsed
    
    this.state = {
      ...this.state,
      elapsedMs: Math.min(totalElapsed, this.state.durationMs),
      remainingMs: Math.max(0, this.state.durationMs - totalElapsed),
      lastUpdateTime: timestamp
    }
  }

  /**
   * Check timing precision and calculate drift
   */
  private checkPrecision(timestamp: number): void {
    if (timestamp - this.lastPrecisionCheck < this.precisionCheckInterval) return

    const expectedElapsed = timestamp - this.lastRafTime
    const actualElapsed = this.state.elapsedMs
    const theoreticalElapsed = this.state.pauseAccumulatedMs + (this.state.startTime ? timestamp - this.state.startTime : 0)
    
    // Calculate drift as difference between theoretical and actual elapsed time
    this.state.precisionDriftMs = Math.abs(theoreticalElapsed - actualElapsed)
    
    this.lastPrecisionCheck = timestamp
  }
}