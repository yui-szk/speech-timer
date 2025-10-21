/**
 * React hook for integrating TimerEngine with the app store
 * Provides high-precision timer functionality with state synchronization and bell scheduling
 */

import { useEffect, useRef, useCallback } from 'react'
import { TimerEngine, type TimerEngineState, type TimerStatus } from '../utils/timer-engine'
import { BellScheduler, type BellTriggerEvent } from '../utils/bell-scheduler'
import { useAppStore } from '../store'
import type { Millis } from '../types'

export interface UseTimerReturn {
  // Current timer state
  status: TimerStatus
  elapsedMs: Millis
  remainingMs: Millis
  durationMs: Millis
  precisionDriftMs: number
  
  // Timer controls
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  setDuration: (ms: Millis) => void
  
  // Bell controls
  testBell: () => Promise<void>
  initializeAudio: () => Promise<void>
  isAudioReady: boolean
  
  // Utility functions
  isRunning: boolean
  isPaused: boolean
  isIdle: boolean
  isFinished: boolean
}

export function useTimer(): UseTimerReturn {
  const engineRef = useRef<TimerEngine | null>(null)
  const bellSchedulerRef = useRef<BellScheduler | null>(null)
  
  // Store state and actions
  const timer = useAppStore((state) => state.timer)
  const settings = useAppStore((state) => state.settings)
  const bells = useAppStore((state) => state.bells)
  const { updateNow, setDuration: setStoreDuration, triggerBell, resetBells } = useAppStore((state) => ({
    updateNow: state.updateNow,
    setDuration: state.setDuration,
    triggerBell: state.triggerBell,
    resetBells: state.resetBells
  }))

  // Initialize bell scheduler
  useEffect(() => {
    const bellScheduler = new BellScheduler({
      onBellTriggered: (event: BellTriggerEvent) => {
        // Update bell state in store
        triggerBell(event.type)
      },
      onError: (error: Error) => {
        console.error('Bell scheduler error:', error)
      }
    })

    bellSchedulerRef.current = bellScheduler

    return () => {
      // No cleanup needed for bell scheduler
    }
  }, [triggerBell])

  // Initialize timer engine
  useEffect(() => {
    const engine = new TimerEngine(timer.durationMs, {
      onTick: (state: TimerEngineState) => {
        // Update store with current time for other components
        updateNow(state.lastUpdateTime)
        
        // Check bells during timer tick
        if (bellSchedulerRef.current && state.status === 'running') {
          const triggeredBells = bellSchedulerRef.current.checkBells(
            state.remainingMs,
            settings,
            bells
          )
          // Bell state updates are handled by the scheduler callback
        }
      },
      
      onStatusChange: (status: TimerStatus, state: TimerEngineState) => {
        // Sync status changes with store
        updateNow(state.lastUpdateTime)
        
        // Reset bells when timer resets
        if (status === 'idle') {
          resetBells()
          bellSchedulerRef.current?.reset()
        }
      },
      
      onFinish: (state: TimerEngineState) => {
        // Timer finished
        updateNow(state.lastUpdateTime)
      }
    })

    engineRef.current = engine

    return () => {
      engine.destroy()
    }
  }, [updateNow, triggerBell, resetBells, settings, bells])

  // Sync duration changes from store to engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setDuration(timer.durationMs)
    }
  }, [timer.durationMs])

  // Sync volume changes to bell scheduler
  useEffect(() => {
    if (bellSchedulerRef.current) {
      bellSchedulerRef.current.setVolume(settings.volume)
    }
  }, [settings.volume])

  // Timer control functions
  const start = useCallback(() => {
    engineRef.current?.start()
  }, [])

  const pause = useCallback(() => {
    engineRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    engineRef.current?.resume()
  }, [])

  const reset = useCallback(() => {
    engineRef.current?.reset()
    bellSchedulerRef.current?.reset()
    resetBells()
  }, [resetBells])

  const setDuration = useCallback((ms: Millis) => {
    // Update both store and engine
    setStoreDuration(ms)
    engineRef.current?.setDuration(ms)
  }, [setStoreDuration])

  // Bell control functions
  const testBell = useCallback(async () => {
    if (bellSchedulerRef.current) {
      await bellSchedulerRef.current.testBell()
    }
  }, [])

  const initializeAudio = useCallback(async () => {
    if (bellSchedulerRef.current) {
      await bellSchedulerRef.current.initializeAudio()
    }
  }, [])

  const isAudioReady = bellSchedulerRef.current?.isAudioReady() ?? false

  // Get current engine state
  const engineState = engineRef.current?.getState() || {
    status: 'idle' as TimerStatus,
    durationMs: timer.durationMs,
    elapsedMs: 0,
    remainingMs: timer.durationMs,
    pauseAccumulatedMs: 0,
    lastUpdateTime: performance.now(),
    precisionDriftMs: 0
  }

  return {
    // Current state - prefer engine state for real-time values, store for duration
    status: engineState.status,
    elapsedMs: engineState.elapsedMs,
    remainingMs: engineState.remainingMs,
    durationMs: timer.durationMs, // Use store value for consistency
    precisionDriftMs: engineState.precisionDriftMs,
    
    // Controls
    start,
    pause,
    resume,
    reset,
    setDuration,
    
    // Bell controls
    testBell,
    initializeAudio,
    isAudioReady,
    
    // Utility flags
    isRunning: engineState.status === 'running',
    isPaused: engineState.status === 'paused',
    isIdle: engineState.status === 'idle',
    isFinished: engineState.status === 'finished'
  }
}