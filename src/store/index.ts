import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { TimerState, TimerSettings, BellState, Millis } from '../types'

// Default values
const DEFAULT_SETTINGS: TimerSettings = {
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

const DEFAULT_TIMER_STATE: TimerState = {
  status: 'idle',
  durationMs: 10 * 60 * 1000, // 10 minutes default
  startEpochMs: undefined,
  pauseAccumulatedMs: 0,
  nowEpochMs: Date.now()
}

const DEFAULT_BELL_STATE: BellState = {
  triggered: {
    first: false,
    second: false,
    third: false
  },
  lastCheckMs: 0
}

interface AppStore {
  // State
  timer: TimerState
  settings: TimerSettings
  bells: BellState
  
  // Timer actions
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  setDuration: (ms: Millis) => void
  updateNow: (ms: Millis) => void
  
  // Settings actions
  updateSettings: (partial: Partial<TimerSettings>) => void
  
  // Bell actions
  triggerBell: (type: 'first' | 'second' | 'third') => void
  resetBells: () => void
}

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      timer: DEFAULT_TIMER_STATE,
      settings: DEFAULT_SETTINGS,
      bells: DEFAULT_BELL_STATE,
      
      // Timer actions
      startTimer: () => {
        const now = performance.now()
        set((state) => ({
          timer: {
            ...state.timer,
            status: 'running',
            startEpochMs: now,
            nowEpochMs: now
          }
        }), false, 'timer/start')
      },
      
      pauseTimer: () => {
        const { timer } = get()
        if (timer.status !== 'running') return
        
        const now = performance.now()
        const elapsed = timer.startEpochMs ? now - timer.startEpochMs : 0
        
        set((state) => ({
          timer: {
            ...state.timer,
            status: 'paused',
            pauseAccumulatedMs: state.timer.pauseAccumulatedMs + elapsed,
            startEpochMs: undefined,
            nowEpochMs: now
          }
        }), false, 'timer/pause')
      },
      
      resetTimer: () => {
        set((state) => ({
          timer: {
            ...DEFAULT_TIMER_STATE,
            durationMs: state.timer.durationMs, // Keep the duration
            nowEpochMs: performance.now()
          },
          bells: DEFAULT_BELL_STATE
        }), false, 'timer/reset')
      },
      
      setDuration: (ms: Millis) => {
        set((state) => ({
          timer: {
            ...state.timer,
            durationMs: ms
          }
        }), false, 'timer/setDuration')
      },
      
      updateNow: (ms: Millis) => {
        set((state) => ({
          timer: {
            ...state.timer,
            nowEpochMs: ms
          }
        }), false, 'timer/updateNow')
      },
      
      // Settings actions
      updateSettings: (partial: Partial<TimerSettings>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...partial
          }
        }), false, 'settings/update')
      },
      
      // Bell actions
      triggerBell: (type: 'first' | 'second' | 'third') => {
        set((state) => ({
          bells: {
            ...state.bells,
            triggered: {
              ...state.bells.triggered,
              [type]: true
            }
          }
        }), false, 'bells/trigger')
      },
      
      resetBells: () => {
        set(() => ({
          bells: DEFAULT_BELL_STATE
        }), false, 'bells/reset')
      }
    }),
    {
      name: 'speech-timer-store'
    }
  )
)

// Selector hooks for better performance
export const useTimerState = () => useAppStore((state) => state.timer)
export const useSettings = () => useAppStore((state) => state.settings)
export const useBellState = () => useAppStore((state) => state.bells)

// Action hooks
export const useTimerActions = () => useAppStore((state) => ({
  startTimer: state.startTimer,
  pauseTimer: state.pauseTimer,
  resetTimer: state.resetTimer,
  setDuration: state.setDuration,
  updateNow: state.updateNow
}))

export const useSettingsActions = () => useAppStore((state) => ({
  updateSettings: state.updateSettings
}))

export const useBellActions = () => useAppStore((state) => ({
  triggerBell: state.triggerBell,
  resetBells: state.resetBells
}))