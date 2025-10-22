/**
 * React hook for integrating TimerEngine with the app store
 * Provides high-precision timer functionality with state synchronization and bell scheduling
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { type TimerEngineState, type TimerStatus } from '../utils/timer-engine'
import { BellScheduler, type BellTriggerEvent } from '../utils/bell-scheduler'
import { timerSingleton } from '../utils/timer-singleton'
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

  // Local state to track engine state and trigger re-renders
  const [engineState, setEngineState] = useState<TimerEngineState>(() => {
    const currentState = timerSingleton.getState()
    return currentState || {
      status: 'idle' as TimerStatus,
      durationMs: timer.durationMs,
      elapsedMs: 0,
      remainingMs: timer.durationMs,
      pauseAccumulatedMs: 0,
      lastUpdateTime: performance.now(),
      precisionDriftMs: 0
    }
  })

  // Use refs to store current values for callbacks
  const callbacksRef = useRef({
    updateNow,
    triggerBell,
    resetBells,
    settings,
    bells
  })

  // Update callback refs when values change
  useEffect(() => {
    callbacksRef.current = {
      updateNow,
      triggerBell,
      resetBells,
      settings,
      bells
    }
  }, [updateNow, triggerBell, resetBells, settings, bells])

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

  // Initialize timer singleton (only once globally)
  useEffect(() => {
    // Initialize the singleton if not already done
    if (!timerSingleton.getState()) {
      timerSingleton.initialize(timer.durationMs)
    }

    // Subscribe to timer state changes
    const unsubscribe = timerSingleton.subscribe((state: TimerEngineState) => {
      setEngineState({ ...state })
      
      // Update store with current time for other components
      callbacksRef.current.updateNow(state.lastUpdateTime)
      
      // Check bells during timer tick
      if (bellSchedulerRef.current && state.status === 'running') {
        bellSchedulerRef.current.checkBells(
          state.remainingMs,
          callbacksRef.current.settings,
          callbacksRef.current.bells
        )
      }
      
      // Reset bells when timer resets
      if (state.status === 'idle') {
        callbacksRef.current.resetBells()
        bellSchedulerRef.current?.reset()
      }
    })

    return unsubscribe
  }, [])

  // Sync duration changes from store to engine
  useEffect(() => {
    const currentState = timerSingleton.getState()
    if (currentState && currentState.durationMs !== timer.durationMs) {
      timerSingleton.setDuration(timer.durationMs)
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
    timerSingleton.start()
  }, [])

  const pause = useCallback(() => {
    timerSingleton.pause()
  }, [])

  const resume = useCallback(() => {
    timerSingleton.resume()
  }, [])

  const reset = useCallback(() => {
    timerSingleton.reset()
    bellSchedulerRef.current?.reset()
    resetBells()
  }, [resetBells])

  const setDuration = useCallback((ms: Millis) => {
    // 現在の値と同じ場合は更新をスキップ
    const currentState = timerSingleton.getState()
    if (currentState && currentState.durationMs === ms) {
      return
    }
    
    // 値が異なる場合のみ更新
    setStoreDuration(ms)
    timerSingleton.setDuration(ms)
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

  // engineState is now managed as React state above

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