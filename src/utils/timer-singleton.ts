/**
 * Singleton timer engine to ensure only one timer instance exists
 */

import { TimerEngine, type TimerEngineState, type TimerStatus } from './timer-engine'
import type { Millis } from '../types'

class TimerSingleton {
  private static instance: TimerSingleton | null = null
  private engine: TimerEngine | null = null
  private subscribers: Set<(state: TimerEngineState) => void> = new Set()

  private constructor() {}

  static getInstance(): TimerSingleton {
    if (!TimerSingleton.instance) {
      TimerSingleton.instance = new TimerSingleton()
    }
    return TimerSingleton.instance
  }

  initialize(durationMs: Millis): void {
    if (this.engine) {
      this.engine.destroy()
    }

    this.engine = new TimerEngine(durationMs, {
      onTick: (state: TimerEngineState) => {
        this.notifySubscribers(state)
      },
      
      onStatusChange: (status: TimerStatus, state: TimerEngineState) => {
        this.notifySubscribers(state)
      },
      
      onFinish: (state: TimerEngineState) => {
        this.notifySubscribers(state)
      }
    })
  }

  subscribe(callback: (state: TimerEngineState) => void): () => void {
    this.subscribers.add(callback)
    
    // Immediately notify with current state
    if (this.engine) {
      callback(this.engine.getState())
    }
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback)
    }
  }

  private notifySubscribers(state: TimerEngineState): void {
    this.subscribers.forEach(callback => callback(state))
  }

  getEngine(): TimerEngine | null {
    return this.engine
  }

  getState(): TimerEngineState | null {
    return this.engine?.getState() || null
  }

  start(): void {
    this.engine?.start()
  }

  pause(): void {
    this.engine?.pause()
  }

  resume(): void {
    this.engine?.resume()
  }

  reset(): void {
    this.engine?.reset()
  }

  setDuration(ms: Millis): void {
    this.engine?.setDuration(ms)
  }

  destroy(): void {
    if (this.engine) {
      this.engine.destroy()
      this.engine = null
    }
    this.subscribers.clear()
  }
}

export const timerSingleton = TimerSingleton.getInstance()