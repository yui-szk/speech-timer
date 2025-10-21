// Core type definitions for the Speech Timer application

export type Millis = number
export type ProgressMode = 'remaining' | 'elapsed'

export interface TimerSettings {
  theme: 'mint' | 'system'
  bellEnabled: {
    first: boolean
    second: boolean
    third: boolean
  }
  bellTimesMs: {
    first: Millis
    second: Millis
    third: Millis
  }
  progressMode: ProgressMode
  volume: number // 0..1
}

export interface TimerState {
  status: 'idle' | 'running' | 'paused' | 'finished'
  durationMs: Millis
  startEpochMs?: number
  pauseAccumulatedMs: Millis
  nowEpochMs: number
}

export interface BellState {
  triggered: {
    first: boolean
    second: boolean
    third: boolean
  }
  lastCheckMs: Millis
}
