import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAppStore } from './index'
import type { TimerSettings } from '../types'

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn()
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
})

describe('AppStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAppStore.setState({
      timer: {
        status: 'idle',
        durationMs: 10 * 60 * 1000,
        startEpochMs: undefined,
        pauseAccumulatedMs: 0,
        nowEpochMs: Date.now()
      },
      settings: {
        theme: 'mint',
        bellEnabled: {
          first: true,
          second: true,
          third: true
        },
        bellTimesMs: {
          first: 3 * 60 * 1000,
          second: 2 * 60 * 1000,
          third: 1 * 60 * 1000
        },
        progressMode: 'remaining',
        volume: 0.7
      },
      bells: {
        triggered: {
          first: false,
          second: false,
          third: false
        },
        lastCheckMs: 0
      }
    })
    
    // Reset mocks
    mockPerformanceNow.mockReset()
  })

  describe('Timer Actions', () => {
    it('should start timer correctly', () => {
      const mockTime = 1000
      mockPerformanceNow.mockReturnValue(mockTime)
      
      const { startTimer } = useAppStore.getState()
      startTimer()
      
      const { timer } = useAppStore.getState()
      expect(timer.status).toBe('running')
      expect(timer.startEpochMs).toBe(mockTime)
      expect(timer.nowEpochMs).toBe(mockTime)
    })

    it('should pause timer correctly', () => {
      const startTime = 1000
      const pauseTime = 3000
      const expectedElapsed = pauseTime - startTime
      
      mockPerformanceNow.mockReturnValueOnce(startTime)
      const { startTimer, pauseTimer } = useAppStore.getState()
      startTimer()
      
      mockPerformanceNow.mockReturnValueOnce(pauseTime)
      pauseTimer()
      
      const { timer } = useAppStore.getState()
      expect(timer.status).toBe('paused')
      expect(timer.startEpochMs).toBeUndefined()
      expect(timer.pauseAccumulatedMs).toBe(expectedElapsed)
      expect(timer.nowEpochMs).toBe(pauseTime)
    })

    it('should not pause timer when not running', () => {
      const { pauseTimer } = useAppStore.getState()
      const initialState = useAppStore.getState().timer
      
      pauseTimer()
      
      const { timer } = useAppStore.getState()
      expect(timer).toEqual(initialState)
    })

    it('should reset timer correctly', () => {
      const mockTime = 1000
      mockPerformanceNow.mockReturnValue(mockTime)
      
      // Start and modify timer state
      const { startTimer, resetTimer, setDuration } = useAppStore.getState()
      setDuration(5 * 60 * 1000) // 5 minutes
      startTimer()
      
      resetTimer()
      
      const { timer, bells } = useAppStore.getState()
      expect(timer.status).toBe('idle')
      expect(timer.startEpochMs).toBeUndefined()
      expect(timer.pauseAccumulatedMs).toBe(0)
      expect(timer.durationMs).toBe(5 * 60 * 1000) // Duration should be preserved
      expect(timer.nowEpochMs).toBe(mockTime)
      
      // Bells should also be reset
      expect(bells.triggered.first).toBe(false)
      expect(bells.triggered.second).toBe(false)
      expect(bells.triggered.third).toBe(false)
    })

    it('should set duration correctly', () => {
      const newDuration = 15 * 60 * 1000 // 15 minutes
      const { setDuration } = useAppStore.getState()
      
      setDuration(newDuration)
      
      const { timer } = useAppStore.getState()
      expect(timer.durationMs).toBe(newDuration)
    })

    it('should update now time correctly', () => {
      const newTime = 5000
      const { updateNow } = useAppStore.getState()
      
      updateNow(newTime)
      
      const { timer } = useAppStore.getState()
      expect(timer.nowEpochMs).toBe(newTime)
    })
  })

  describe('Settings Actions', () => {
    it('should update settings partially', () => {
      const { updateSettings } = useAppStore.getState()
      const partialSettings: Partial<TimerSettings> = {
        theme: 'system',
        volume: 0.5
      }
      
      updateSettings(partialSettings)
      
      const { settings } = useAppStore.getState()
      expect(settings.theme).toBe('system')
      expect(settings.volume).toBe(0.5)
      // Other settings should remain unchanged
      expect(settings.progressMode).toBe('remaining')
      expect(settings.bellEnabled.first).toBe(true)
    })

    it('should update bell settings', () => {
      const { updateSettings } = useAppStore.getState()
      const bellSettings: Partial<TimerSettings> = {
        bellEnabled: {
          first: false,
          second: true,
          third: false
        },
        bellTimesMs: {
          first: 5 * 60 * 1000,
          second: 3 * 60 * 1000,
          third: 1 * 60 * 1000
        }
      }
      
      updateSettings(bellSettings)
      
      const { settings } = useAppStore.getState()
      expect(settings.bellEnabled.first).toBe(false)
      expect(settings.bellEnabled.second).toBe(true)
      expect(settings.bellEnabled.third).toBe(false)
      expect(settings.bellTimesMs.first).toBe(5 * 60 * 1000)
    })

    it('should update progress mode', () => {
      const { updateSettings } = useAppStore.getState()
      
      updateSettings({ progressMode: 'elapsed' })
      
      const { settings } = useAppStore.getState()
      expect(settings.progressMode).toBe('elapsed')
    })
  })

  describe('Bell Actions', () => {
    it('should trigger individual bells', () => {
      const { triggerBell } = useAppStore.getState()
      
      triggerBell('first')
      let { bells } = useAppStore.getState()
      expect(bells.triggered.first).toBe(true)
      expect(bells.triggered.second).toBe(false)
      expect(bells.triggered.third).toBe(false)
      
      triggerBell('second')
      bells = useAppStore.getState().bells
      expect(bells.triggered.first).toBe(true)
      expect(bells.triggered.second).toBe(true)
      expect(bells.triggered.third).toBe(false)
      
      triggerBell('third')
      bells = useAppStore.getState().bells
      expect(bells.triggered.first).toBe(true)
      expect(bells.triggered.second).toBe(true)
      expect(bells.triggered.third).toBe(true)
    })

    it('should reset all bells', () => {
      const { triggerBell, resetBells } = useAppStore.getState()
      
      // Trigger all bells
      triggerBell('first')
      triggerBell('second')
      triggerBell('third')
      
      // Verify they are triggered
      let { bells } = useAppStore.getState()
      expect(bells.triggered.first).toBe(true)
      expect(bells.triggered.second).toBe(true)
      expect(bells.triggered.third).toBe(true)
      
      // Reset bells
      resetBells()
      
      bells = useAppStore.getState().bells
      expect(bells.triggered.first).toBe(false)
      expect(bells.triggered.second).toBe(false)
      expect(bells.triggered.third).toBe(false)
      expect(bells.lastCheckMs).toBe(0)
    })
  })

  describe('Selector Hooks', () => {
    it('should provide timer state selector', () => {
      const timerState = useAppStore.getState().timer
      
      expect(timerState).toHaveProperty('status')
      expect(timerState).toHaveProperty('durationMs')
      expect(timerState).toHaveProperty('startEpochMs')
      expect(timerState).toHaveProperty('pauseAccumulatedMs')
      expect(timerState).toHaveProperty('nowEpochMs')
    })

    it('should provide settings selector', () => {
      const settings = useAppStore.getState().settings
      
      expect(settings).toHaveProperty('theme')
      expect(settings).toHaveProperty('bellEnabled')
      expect(settings).toHaveProperty('bellTimesMs')
      expect(settings).toHaveProperty('progressMode')
      expect(settings).toHaveProperty('volume')
    })

    it('should provide bell state selector', () => {
      const bellState = useAppStore.getState().bells
      
      expect(bellState).toHaveProperty('triggered')
      expect(bellState).toHaveProperty('lastCheckMs')
    })
  })

  describe('Action Hooks', () => {
    it('should provide timer action hooks', () => {
      const state = useAppStore.getState()
      
      expect(state).toHaveProperty('startTimer')
      expect(state).toHaveProperty('pauseTimer')
      expect(state).toHaveProperty('resetTimer')
      expect(state).toHaveProperty('setDuration')
      expect(state).toHaveProperty('updateNow')
      
      expect(typeof state.startTimer).toBe('function')
      expect(typeof state.pauseTimer).toBe('function')
      expect(typeof state.resetTimer).toBe('function')
      expect(typeof state.setDuration).toBe('function')
      expect(typeof state.updateNow).toBe('function')
    })

    it('should provide settings action hooks', () => {
      const state = useAppStore.getState()
      
      expect(state).toHaveProperty('updateSettings')
      expect(typeof state.updateSettings).toBe('function')
    })

    it('should provide bell action hooks', () => {
      const state = useAppStore.getState()
      
      expect(state).toHaveProperty('triggerBell')
      expect(state).toHaveProperty('resetBells')
      expect(typeof state.triggerBell).toBe('function')
      expect(typeof state.resetBells).toBe('function')
    })
  })

  describe('Complex Timer Scenarios', () => {
    it('should handle pause and resume correctly', () => {
      const startTime = 1000
      const pauseTime = 3000
      const resumeTime = 5000
      const finalPauseTime = 8000
      
      mockPerformanceNow
        .mockReturnValueOnce(startTime)   // start
        .mockReturnValueOnce(pauseTime)   // first pause
        .mockReturnValueOnce(resumeTime)  // resume
        .mockReturnValueOnce(finalPauseTime) // final pause
      
      const { startTimer, pauseTimer } = useAppStore.getState()
      
      // Start timer
      startTimer()
      
      // First pause after 2 seconds
      pauseTimer()
      let { timer } = useAppStore.getState()
      expect(timer.pauseAccumulatedMs).toBe(2000)
      expect(timer.status).toBe('paused')
      
      // Resume timer
      startTimer()
      timer = useAppStore.getState().timer
      expect(timer.status).toBe('running')
      expect(timer.startEpochMs).toBe(resumeTime)
      
      // Pause again after 3 more seconds
      pauseTimer()
      timer = useAppStore.getState().timer
      expect(timer.pauseAccumulatedMs).toBe(5000) // 2000 + 3000
      expect(timer.status).toBe('paused')
    })

    it('should maintain duration through timer operations', () => {
      const customDuration = 20 * 60 * 1000 // 20 minutes
      const { setDuration, startTimer, pauseTimer, resetTimer } = useAppStore.getState()
      
      setDuration(customDuration)
      startTimer()
      pauseTimer()
      resetTimer()
      
      const { timer } = useAppStore.getState()
      expect(timer.durationMs).toBe(customDuration)
      expect(timer.status).toBe('idle')
    })
  })
})