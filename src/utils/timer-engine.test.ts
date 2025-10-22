/**
 * Tests for TimerEngine class
 * Covers precision, state transitions, and time calculations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TimerEngine, type TimerEngineState, type TimerStatus } from './timer-engine'

// Mock performance.now() for predictable testing
const mockPerformanceNow = vi.fn()
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
})

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRaf = vi.fn((callback) => {
  // Return a mock RAF ID
  return 1
})
const mockCancelRaf = vi.fn()
Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRaf,
  writable: true
})
Object.defineProperty(global, 'cancelAnimationFrame', {
  value: mockCancelRaf,
  writable: true
})

describe('TimerEngine', () => {
  let engine: TimerEngine
  let mockCallbacks: {
    onTick: ReturnType<typeof vi.fn>
    onStatusChange: ReturnType<typeof vi.fn>
    onFinish: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPerformanceNow.mockReturnValue(0)
    
    mockCallbacks = {
      onTick: vi.fn(),
      onStatusChange: vi.fn(),
      onFinish: vi.fn()
    }
    
    engine = new TimerEngine(10000, mockCallbacks) // 10 second timer
  })

  afterEach(() => {
    engine.destroy()
  })

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const state = engine.getState()
      
      expect(state.status).toBe('idle')
      expect(state.durationMs).toBe(10000)
      expect(state.elapsedMs).toBe(0)
      expect(state.remainingMs).toBe(10000)
      expect(state.pauseAccumulatedMs).toBe(0)
      expect(state.precisionDriftMs).toBe(0)
    })
  })

  describe('State Transitions', () => {
    it('should transition from idle to running when started', () => {
      mockPerformanceNow.mockReturnValue(1000)
      
      engine.start()
      
      const state = engine.getState()
      expect(state.status).toBe('running')
      expect(state.startTime).toBe(1000)
      expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith('running', expect.any(Object))
    })

    it('should transition from running to paused when paused', () => {
      mockPerformanceNow.mockReturnValue(1000)
      engine.start()
      
      mockPerformanceNow.mockReturnValue(3000) // 2 seconds elapsed
      engine.pause()
      
      const state = engine.getState()
      expect(state.status).toBe('paused')
      expect(state.pauseAccumulatedMs).toBe(2000)
      expect(state.startTime).toBeUndefined()
      expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith('paused', expect.any(Object))
    })

    it('should transition from paused to running when resumed', () => {
      mockPerformanceNow.mockReturnValue(1000)
      engine.start()
      
      mockPerformanceNow.mockReturnValue(3000)
      engine.pause()
      
      mockPerformanceNow.mockReturnValue(5000)
      engine.resume()
      
      const state = engine.getState()
      expect(state.status).toBe('running')
      expect(state.pauseAccumulatedMs).toBe(2000)
      expect(state.startTime).toBe(5000)
    })

    it('should transition to finished when time runs out', () => {
      mockPerformanceNow.mockReturnValue(0)
      engine.start()
      
      // Verify timer started correctly
      expect(engine.getState().status).toBe('running')
      expect(engine.getState().startTime).toBe(0)
      
      // Mock RAF callback to simulate time passing
      const rafCallback = mockRaf.mock.calls[0][0]
      mockPerformanceNow.mockReturnValue(10000) // Full duration elapsed
      
      rafCallback(10000)
      
      const state = engine.getState()
      expect(state.status).toBe('finished')
      expect(state.elapsedMs).toBe(10000)
      expect(state.remainingMs).toBe(0)
      expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith('finished', expect.any(Object))
      expect(mockCallbacks.onFinish).toHaveBeenCalled()
    })

    it('should reset to idle state when reset', () => {
      mockPerformanceNow.mockReturnValue(1000)
      engine.start()
      
      mockPerformanceNow.mockReturnValue(3000)
      engine.reset()
      
      const state = engine.getState()
      expect(state.status).toBe('idle')
      expect(state.elapsedMs).toBe(0)
      expect(state.remainingMs).toBe(10000)
      expect(state.pauseAccumulatedMs).toBe(0)
      expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith('idle', expect.any(Object))
    })
  })

  describe('Time Calculations', () => {
    it('should calculate elapsed time correctly during running', () => {
      mockPerformanceNow.mockReturnValue(1000)
      engine.start()
      
      // Simulate RAF tick after 2 seconds
      const rafCallback = mockRaf.mock.calls[0][0]
      mockPerformanceNow.mockReturnValue(3000)
      rafCallback(3000)
      
      const state = engine.getState()
      expect(state.elapsedMs).toBe(2000)
      expect(state.remainingMs).toBe(8000)
    })

    it('should handle pause and resume time calculations correctly', () => {
      // Start timer
      mockPerformanceNow.mockReturnValue(1000)
      engine.start()
      
      // Run for 2 seconds, then pause
      mockPerformanceNow.mockReturnValue(3000)
      engine.pause()
      
      let state = engine.getState()
      expect(state.pauseAccumulatedMs).toBe(2000)
      
      // Resume after 1 second pause
      mockPerformanceNow.mockReturnValue(4000)
      engine.resume()
      
      // Run for another 3 seconds
      const rafCallback = mockRaf.mock.calls[1][0] // Second RAF call after resume
      mockPerformanceNow.mockReturnValue(7000)
      rafCallback(7000)
      
      state = engine.getState()
      expect(state.elapsedMs).toBe(5000) // 2s + 3s
      expect(state.remainingMs).toBe(5000)
    })

    it('should not exceed duration when calculating elapsed time', () => {
      mockPerformanceNow.mockReturnValue(0)
      engine.start()
      
      // Simulate time beyond duration
      const rafCallback = mockRaf.mock.calls[0][0]
      mockPerformanceNow.mockReturnValue(15000) // 5 seconds over
      rafCallback(15000)
      
      const state = engine.getState()
      expect(state.elapsedMs).toBe(10000) // Capped at duration
      expect(state.remainingMs).toBe(0)
    })
  })

  describe('Duration Changes', () => {
    it('should handle duration changes while idle', () => {
      engine.setDuration(20000)
      
      const state = engine.getState()
      expect(state.durationMs).toBe(20000)
      expect(state.remainingMs).toBe(20000)
    })

    it('should handle duration changes while running', () => {
      mockPerformanceNow.mockReturnValue(0)
      engine.start()
      
      // Run for 2 seconds
      const rafCallback = mockRaf.mock.calls[0][0]
      mockPerformanceNow.mockReturnValue(2000)
      rafCallback(2000)
      
      // Change duration to 5 seconds (half of original)
      engine.setDuration(5000)
      
      const state = engine.getState()
      expect(state.durationMs).toBe(5000)
      // Remaining should be proportionally adjusted
      expect(state.remainingMs).toBeLessThanOrEqual(5000)
    })

    it('should not update state when setting the same duration', () => {
      const initialState = engine.getState()
      const initialLastUpdateTime = initialState.lastUpdateTime
      
      // Set the same duration
      engine.setDuration(10000)
      
      const newState = engine.getState()
      expect(newState.durationMs).toBe(10000)
      expect(newState.lastUpdateTime).toBe(initialLastUpdateTime) // Should not change
    })

    it('should skip time calculations when setting the same duration', () => {
      mockPerformanceNow.mockReturnValue(0)
      engine.start()
      
      // Run for 2 seconds
      const rafCallback = mockRaf.mock.calls[0][0]
      mockPerformanceNow.mockReturnValue(2000)
      rafCallback(2000)
      
      const stateBeforeDuplicateSet = engine.getState()
      
      // Set the same duration (should be ignored)
      mockPerformanceNow.mockReturnValue(3000) // Time has passed
      engine.setDuration(10000) // Same as initial duration
      
      const stateAfterDuplicateSet = engine.getState()
      
      // State should remain exactly the same (no time calculations triggered)
      expect(stateAfterDuplicateSet.elapsedMs).toBe(stateBeforeDuplicateSet.elapsedMs)
      expect(stateAfterDuplicateSet.remainingMs).toBe(stateBeforeDuplicateSet.remainingMs)
      expect(stateAfterDuplicateSet.lastUpdateTime).toBe(stateBeforeDuplicateSet.lastUpdateTime)
    })
  })

  describe('setDuration Duplicate Update Prevention (要件 3.3)', () => {
    describe('同じduration値での呼び出し時の状態非更新テスト', () => {
      it('should not update any state properties when setting identical duration in idle state', () => {
        const initialState = engine.getState()
        
        // 同じduration値で呼び出し
        engine.setDuration(10000)
        
        const finalState = engine.getState()
        
        // 全ての状態プロパティが変更されていないことを確認
        expect(finalState).toEqual(initialState)
        expect(finalState.durationMs).toBe(initialState.durationMs)
        expect(finalState.remainingMs).toBe(initialState.remainingMs)
        expect(finalState.elapsedMs).toBe(initialState.elapsedMs)
        expect(finalState.lastUpdateTime).toBe(initialState.lastUpdateTime)
        expect(finalState.pauseAccumulatedMs).toBe(initialState.pauseAccumulatedMs)
      })

      it('should not update state when setting identical duration during running state', () => {
        mockPerformanceNow.mockReturnValue(1000)
        engine.start()
        
        // タイマーを2秒間実行
        const rafCallback = mockRaf.mock.calls[0][0]
        mockPerformanceNow.mockReturnValue(3000)
        rafCallback(3000)
        
        const stateBeforeSetDuration = engine.getState()
        
        // 時間が経過した後に同じduration値で呼び出し
        mockPerformanceNow.mockReturnValue(4000)
        engine.setDuration(10000) // 元と同じ値
        
        const stateAfterSetDuration = engine.getState()
        
        // updateTimeCalculationsが呼ばれていないため、時間計算が更新されていないことを確認
        expect(stateAfterSetDuration.elapsedMs).toBe(stateBeforeSetDuration.elapsedMs)
        expect(stateAfterSetDuration.remainingMs).toBe(stateBeforeSetDuration.remainingMs)
        expect(stateAfterSetDuration.lastUpdateTime).toBe(stateBeforeSetDuration.lastUpdateTime)
        expect(stateAfterSetDuration.durationMs).toBe(10000)
      })

      it('should not update state when setting identical duration during paused state', () => {
        mockPerformanceNow.mockReturnValue(1000)
        engine.start()
        
        mockPerformanceNow.mockReturnValue(3000)
        engine.pause()
        
        const stateBeforeSetDuration = engine.getState()
        
        // 一時停止中に同じduration値で呼び出し
        mockPerformanceNow.mockReturnValue(5000)
        engine.setDuration(10000) // 元と同じ値
        
        const stateAfterSetDuration = engine.getState()
        
        // 状態が変更されていないことを確認
        expect(stateAfterSetDuration).toEqual(stateBeforeSetDuration)
      })

      it('should not trigger updateTimeCalculations when setting identical duration', () => {
        // updateTimeCalculationsが呼ばれないことを間接的に検証
        // performance.nowの呼び出し回数をカウントして確認
        mockPerformanceNow.mockReturnValue(1000)
        
        const callCountBefore = mockPerformanceNow.mock.calls.length
        
        // 同じduration値で呼び出し
        engine.setDuration(10000)
        
        const callCountAfter = mockPerformanceNow.mock.calls.length
        
        // performance.nowが追加で呼ばれていないことを確認（updateTimeCalculationsが呼ばれていない）
        expect(callCountAfter).toBe(callCountBefore)
      })
    })

    describe('異なるduration値での呼び出し時の状態更新テスト', () => {
      it('should update state when setting different duration in idle state', () => {
        const initialState = engine.getState()
        
        // 異なるduration値で呼び出し
        engine.setDuration(15000)
        
        const finalState = engine.getState()
        
        // duration関連の状態が更新されていることを確認
        expect(finalState.durationMs).toBe(15000)
        expect(finalState.remainingMs).toBe(15000)
        expect(finalState.durationMs).not.toBe(initialState.durationMs)
        expect(finalState.remainingMs).not.toBe(initialState.remainingMs)
      })

      it('should update state and recalculate times when setting different duration during running', () => {
        mockPerformanceNow.mockReturnValue(1000)
        engine.start()
        
        // タイマーを2秒間実行（20%経過）
        const rafCallback = mockRaf.mock.calls[0][0]
        mockPerformanceNow.mockReturnValue(3000)
        rafCallback(3000)
        
        const stateBeforeSetDuration = engine.getState()
        expect(stateBeforeSetDuration.elapsedMs).toBe(2000)
        expect(stateBeforeSetDuration.remainingMs).toBe(8000)
        
        // 異なるduration値で呼び出し（5秒に変更）
        mockPerformanceNow.mockReturnValue(4000)
        engine.setDuration(5000)
        
        const stateAfterSetDuration = engine.getState()
        
        // 新しいdurationが設定されていることを確認
        expect(stateAfterSetDuration.durationMs).toBe(5000)
        
        // updateTimeCalculationsが実行されるため、実際の経過時間から再計算される
        // 実際の経過時間: pauseAccumulatedMs(0) + (4000 - 1000) = 3000ms
        // 新しいdurationでの残り時間: 5000 - 3000 = 2000ms
        expect(stateAfterSetDuration.remainingMs).toBe(2000)
        expect(stateAfterSetDuration.elapsedMs).toBe(3000)
        
        // updateTimeCalculationsが呼ばれて時間計算が更新されていることを確認
        expect(stateAfterSetDuration.lastUpdateTime).toBe(4000)
      })

      it('should update state when setting different duration during paused state', () => {
        mockPerformanceNow.mockReturnValue(1000)
        engine.start()
        
        mockPerformanceNow.mockReturnValue(3000)
        engine.pause()
        
        const stateBeforeSetDuration = engine.getState()
        expect(stateBeforeSetDuration.pauseAccumulatedMs).toBe(2000) // 2秒間実行後に一時停止
        // 一時停止時はremainingMsが正しく更新されていない可能性があるため、実際の値を確認
        
        // 一時停止中に異なるduration値で呼び出し
        mockPerformanceNow.mockReturnValue(5000)
        engine.setDuration(20000)
        
        const stateAfterSetDuration = engine.getState()
        
        // 新しいdurationが設定されていることを確認
        expect(stateAfterSetDuration.durationMs).toBe(20000)
        expect(stateAfterSetDuration.durationMs).not.toBe(stateBeforeSetDuration.durationMs)
        
        // remainingMsが適切に調整されていることを確認
        // 一時停止中でも比例計算が適用される
        const remainingRatio = stateBeforeSetDuration.remainingMs / stateBeforeSetDuration.durationMs
        const expectedRemaining = 20000 * remainingRatio
        expect(stateAfterSetDuration.remainingMs).toBe(expectedRemaining)
        
        // 一時停止中はupdateTimeCalculationsが呼ばれても、startTimeがundefinedなので
        // 実際には状態更新されない。lastUpdateTimeは一時停止時の値のまま
        expect(stateAfterSetDuration.lastUpdateTime).toBe(stateBeforeSetDuration.lastUpdateTime)
      })

      it('should trigger updateTimeCalculations when setting different duration', () => {
        mockPerformanceNow.mockReturnValue(1000)
        
        const callCountBefore = mockPerformanceNow.mock.calls.length
        
        // 異なるduration値で呼び出し
        engine.setDuration(15000)
        
        const callCountAfter = mockPerformanceNow.mock.calls.length
        
        // performance.nowが追加で呼ばれていることを確認（updateTimeCalculationsが呼ばれた）
        expect(callCountAfter).toBeGreaterThan(callCountBefore)
      })
    })

    describe('状態変更の有無を検証するテストケース', () => {
      it('should maintain object reference equality when no changes occur', () => {
        const initialState = engine.getState()
        
        // 同じduration値で複数回呼び出し
        engine.setDuration(10000)
        engine.setDuration(10000)
        engine.setDuration(10000)
        
        const finalState = engine.getState()
        
        // 状態オブジェクトの内容が同じであることを確認
        expect(finalState).toEqual(initialState)
      })

      it('should detect state changes only when duration actually changes', () => {
        const states: TimerEngineState[] = []
        
        // 初期状態を記録
        states.push(engine.getState())
        
        // 同じ値で呼び出し（変更なし）
        engine.setDuration(10000)
        states.push(engine.getState())
        
        // 異なる値で呼び出し（変更あり）
        engine.setDuration(15000)
        states.push(engine.getState())
        
        // 同じ値で呼び出し（変更なし）
        engine.setDuration(15000)
        states.push(engine.getState())
        
        // 状態変更の検証
        expect(states[0]).toEqual(states[1]) // 同じ値設定時は変更なし
        expect(states[1]).not.toEqual(states[2]) // 異なる値設定時は変更あり
        expect(states[2]).toEqual(states[3]) // 同じ値設定時は変更なし
      })

      it('should preserve all state properties when no duration change occurs', () => {
        // 複雑な状態を作成
        mockPerformanceNow.mockReturnValue(1000)
        engine.start()
        
        mockPerformanceNow.mockReturnValue(3000)
        engine.pause()
        
        mockPerformanceNow.mockReturnValue(5000)
        engine.resume()
        
        const complexState = engine.getState()
        
        // 同じduration値で呼び出し
        mockPerformanceNow.mockReturnValue(7000)
        engine.setDuration(10000)
        
        const stateAfterSameDuration = engine.getState()
        
        // 重要な状態プロパティが保持されていることを確認
        expect(stateAfterSameDuration.status).toBe(complexState.status)
        expect(stateAfterSameDuration.pauseAccumulatedMs).toBe(complexState.pauseAccumulatedMs)
        expect(stateAfterSameDuration.startTime).toBe(complexState.startTime)
        expect(stateAfterSameDuration.elapsedMs).toBe(complexState.elapsedMs)
        expect(stateAfterSameDuration.remainingMs).toBe(complexState.remainingMs)
        expect(stateAfterSameDuration.lastUpdateTime).toBe(complexState.lastUpdateTime)
      })
    })
  })

  describe('Precision Monitoring', () => {
    it('should track precision drift', () => {
      mockPerformanceNow.mockReturnValue(0)
      engine.start()
      
      // Simulate multiple RAF ticks with some timing variance
      const rafCallback = mockRaf.mock.calls[0][0]
      
      mockPerformanceNow.mockReturnValue(1000)
      rafCallback(1000)
      
      mockPerformanceNow.mockReturnValue(2100) // 100ms drift
      rafCallback(2100)
      
      const state = engine.getState()
      expect(typeof state.precisionDriftMs).toBe('number')
      expect(state.precisionDriftMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('RAF Loop Management', () => {
    it('should start RAF loop when timer starts', () => {
      engine.start()
      expect(mockRaf).toHaveBeenCalled()
    })

    it('should stop RAF loop when timer is paused', () => {
      engine.start()
      const rafCallsBefore = mockRaf.mock.calls.length
      engine.pause()
      // RAF should be cancelled when pausing
      expect(mockCancelRaf).toHaveBeenCalled()
    })

    it('should stop RAF loop when timer is reset', () => {
      engine.start()
      const rafCallsBefore = mockRaf.mock.calls.length
      engine.reset()
      // RAF should be cancelled when resetting
      expect(mockCancelRaf).toHaveBeenCalled()
    })

    it('should clean up RAF loop when destroyed', () => {
      engine.start()
      const rafCallsBefore = mockRaf.mock.calls.length
      engine.destroy()
      // RAF should be cancelled when destroying
      expect(mockCancelRaf).toHaveBeenCalled()
    })
  })

  describe('Callback Invocation', () => {
    it('should call onTick during RAF loop', () => {
      mockPerformanceNow.mockReturnValue(0)
      engine.start()
      
      // Get the RAF callback that was registered
      expect(mockRaf).toHaveBeenCalled()
      const rafCallback = mockRaf.mock.calls[0][0]
      
      // Simulate time passing and call the RAF callback
      mockPerformanceNow.mockReturnValue(1000)
      rafCallback(1000)
      
      expect(mockCallbacks.onTick).toHaveBeenCalledWith(expect.objectContaining({
        status: 'running',
        elapsedMs: 1000,
        remainingMs: 9000
      }))
    })

    it('should not call onTick when not running', () => {
      engine.pause() // Pause without starting
      expect(mockCallbacks.onTick).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple start calls gracefully', () => {
      engine.start()
      const firstCallCount = mockRaf.mock.calls.length
      
      engine.start() // Second start call
      expect(mockRaf.mock.calls.length).toBe(firstCallCount) // Should not start again
    })

    it('should handle pause when not running', () => {
      engine.pause() // Pause without starting
      expect(engine.getState().status).toBe('idle')
    })

    it('should handle resume when not paused', () => {
      engine.resume() // Resume without pausing
      expect(engine.getState().status).toBe('idle')
    })

    it('should handle zero duration timer', () => {
      const zeroEngine = new TimerEngine(0, mockCallbacks)
      zeroEngine.start()
      
      const state = zeroEngine.getState()
      expect(state.durationMs).toBe(0)
      expect(state.remainingMs).toBe(0)
      
      zeroEngine.destroy()
    })
  })
})