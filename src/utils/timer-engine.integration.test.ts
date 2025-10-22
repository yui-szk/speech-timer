import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { TimerEngine, type TimerEngineState, type TimerStatus } from './timer-engine'

// performance.nowをモック
const mockPerformanceNow = vi.fn()
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
})

// requestAnimationFrameをモック
const mockRaf = vi.fn()
Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRaf,
  writable: true
})

const mockCancelAnimationFrame = vi.fn()
Object.defineProperty(global, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame,
  writable: true
})

describe('TimerEngine Integration Tests', () => {
  let engine: TimerEngine
  let mockTime = 1000
  let onTickSpy: ReturnType<typeof vi.fn>
  let onStatusChangeSpy: ReturnType<typeof vi.fn>
  let onFinishSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // モック関数をリセット
    mockPerformanceNow.mockReset()
    mockRaf.mockReset()
    mockCancelAnimationFrame.mockReset()
    
    // 初期時刻を設定
    mockTime = 1000
    mockPerformanceNow.mockReturnValue(mockTime)
    
    // コールバック関数のスパイを作成
    onTickSpy = vi.fn()
    onStatusChangeSpy = vi.fn()
    onFinishSpy = vi.fn()
    
    // TimerEngineインスタンスを作成
    engine = new TimerEngine(10 * 60 * 1000, { // 10分
      onTick: onTickSpy,
      onStatusChange: onStatusChangeSpy,
      onFinish: onFinishSpy
    })
    
    // requestAnimationFrameのモック実装
    mockRaf.mockImplementation((callback) => {
      // 即座にコールバックを実行（テスト用）
      setTimeout(() => callback(mockTime), 0)
      return 1
    })
  })

  afterEach(() => {
    // エンジンをクリーンアップ
    engine.destroy()
  })

  describe('重複更新防止機能の統合テスト', () => {
    it('同じduration値でsetDurationを呼び出した場合、状態が更新されない', () => {
      const initialState = engine.getState()
      
      // 同じ値でsetDurationを呼び出し
      engine.setDuration(10 * 60 * 1000)
      
      const afterState = engine.getState()
      
      // 状態が変更されていないことを確認
      expect(afterState.durationMs).toBe(initialState.durationMs)
      expect(afterState.remainingMs).toBe(initialState.remainingMs)
      expect(afterState.lastUpdateTime).toBe(initialState.lastUpdateTime)
    })

    it('異なるduration値でsetDurationを呼び出した場合、状態が更新される', () => {
      const initialState = engine.getState()
      
      // 異なる値でsetDurationを呼び出し
      const newDuration = 5 * 60 * 1000
      engine.setDuration(newDuration)
      
      const afterState = engine.getState()
      
      // 状態が更新されていることを確認
      expect(afterState.durationMs).toBe(newDuration)
      expect(afterState.remainingMs).toBe(newDuration)
      expect(afterState.lastUpdateTime).toBeGreaterThanOrEqual(initialState.lastUpdateTime)
    })

    it('実行中にsetDurationを呼び出した場合、比率に応じて残り時間が調整される', async () => {
      // タイマーを開始
      engine.start()
      
      // 3秒経過をシミュレート
      mockTime += 3000
      mockPerformanceNow.mockReturnValue(mockTime)
      
      // RAF コールバックを手動実行して状態を更新
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // 一時停止して現在の状態を確認
      engine.pause()
      const stateBeforeChange = engine.getState()
      
      // 残り時間の比率を計算
      const remainingRatio = stateBeforeChange.remainingMs / stateBeforeChange.durationMs
      
      // 新しい時間（20分）に変更
      const newDuration = 20 * 60 * 1000
      engine.setDuration(newDuration)
      
      const stateAfterChange = engine.getState()
      
      // 比率に応じて残り時間が調整されることを確認
      const expectedRemaining = newDuration * remainingRatio
      expect(stateAfterChange.remainingMs).toBeCloseTo(expectedRemaining, -2)
      expect(stateAfterChange.durationMs).toBe(newDuration)
    })
  })

  describe('タイマー精度の統合テスト', () => {
    it('開始→一時停止→再開のサイクルで時間の精度が維持される', async () => {
      // タイマーを開始
      engine.start()
      expect(onStatusChangeSpy).toHaveBeenCalledWith('running', expect.any(Object))
      
      // 2秒経過
      mockTime += 2000
      mockPerformanceNow.mockReturnValue(mockTime)
      
      // RAF コールバックを実行
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // 一時停止
      engine.pause()
      expect(onStatusChangeSpy).toHaveBeenCalledWith('paused', expect.any(Object))
      
      const pausedState = engine.getState()
      const remainingAtPause = pausedState.remainingMs
      
      // 5秒待機（タイマーは停止中）
      mockTime += 5000
      mockPerformanceNow.mockReturnValue(mockTime)
      
      // 再開
      engine.resume()
      expect(onStatusChangeSpy).toHaveBeenCalledWith('running', expect.any(Object))
      
      // 再開直後の残り時間は一時停止時と同じであるべき
      const resumedState = engine.getState()
      expect(resumedState.remainingMs).toBeCloseTo(remainingAtPause, -2)
      
      // さらに1秒経過
      mockTime += 1000
      mockPerformanceNow.mockReturnValue(mockTime)
      
      // RAF コールバックを実行
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // 最終的に3秒分減っているはず（最初の2秒 + 再開後の1秒）
      const finalState = engine.getState()
      const expectedRemaining = 10 * 60 * 1000 - 3000
      expect(finalState.remainingMs).toBeCloseTo(expectedRemaining, -2)
    })

    it('複数回の一時停止と再開を繰り返しても精度が維持される', async () => {
      const totalDuration = 10 * 60 * 1000
      let totalElapsedTime = 0
      
      // 1回目: 開始→1秒経過→一時停止
      engine.start()
      mockTime += 1000
      totalElapsedTime += 1000
      mockPerformanceNow.mockReturnValue(mockTime)
      await new Promise(resolve => setTimeout(resolve, 10))
      engine.pause()
      
      // 2回目: 再開→2秒経過→一時停止
      engine.resume()
      mockTime += 2000
      totalElapsedTime += 2000
      mockPerformanceNow.mockReturnValue(mockTime)
      await new Promise(resolve => setTimeout(resolve, 10))
      engine.pause()
      
      // 3回目: 再開→1.5秒経過→一時停止
      engine.resume()
      mockTime += 1500
      totalElapsedTime += 1500
      mockPerformanceNow.mockReturnValue(mockTime)
      await new Promise(resolve => setTimeout(resolve, 10))
      engine.pause()
      
      // 最終的な残り時間を確認
      const finalState = engine.getState()
      const expectedRemaining = totalDuration - totalElapsedTime
      expect(finalState.remainingMs).toBeCloseTo(expectedRemaining, -2)
      expect(finalState.elapsedMs).toBeCloseTo(totalElapsedTime, -2)
    })

    it('タイマー完了時に正確に0になり、完了コールバックが呼ばれる', async () => {
      // 短い時間（3秒）のタイマーを作成
      engine.destroy()
      engine = new TimerEngine(3000, {
        onTick: onTickSpy,
        onStatusChange: onStatusChangeSpy,
        onFinish: onFinishSpy
      })
      
      // タイマーを開始
      engine.start()
      
      // 3秒経過
      mockTime += 3000
      mockPerformanceNow.mockReturnValue(mockTime)
      
      // RAF コールバックを実行してタイマー完了をシミュレート
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const finalState = engine.getState()
      
      // タイマーが完了状態になることを確認
      expect(finalState.status).toBe('finished')
      expect(finalState.remainingMs).toBe(0)
      expect(finalState.elapsedMs).toBe(3000)
      
      // 完了コールバックが呼ばれることを確認
      expect(onFinishSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'finished',
        remainingMs: 0,
        elapsedMs: 3000
      }))
    })
  })

  describe('状態遷移の統合テスト', () => {
    it('idle→running→paused→running→finished の完全なライフサイクル', async () => {
      // 短い時間（5秒）のタイマーを作成
      engine.destroy()
      engine = new TimerEngine(5000, {
        onTick: onTickSpy,
        onStatusChange: onStatusChangeSpy,
        onFinish: onFinishSpy
      })
      
      // 初期状態: idle
      expect(engine.getState().status).toBe('idle')
      
      // 開始: idle → running
      engine.start()
      expect(onStatusChangeSpy).toHaveBeenCalledWith('running', expect.any(Object))
      
      // 2秒経過
      mockTime += 2000
      mockPerformanceNow.mockReturnValue(mockTime)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // 一時停止: running → paused
      engine.pause()
      expect(onStatusChangeSpy).toHaveBeenCalledWith('paused', expect.any(Object))
      
      // 再開: paused → running
      engine.resume()
      expect(onStatusChangeSpy).toHaveBeenCalledWith('running', expect.any(Object))
      
      // 残り3秒経過（完了）
      mockTime += 3000
      mockPerformanceNow.mockReturnValue(mockTime)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // 完了: running → finished
      expect(onStatusChangeSpy).toHaveBeenCalledWith('finished', expect.any(Object))
      expect(onFinishSpy).toHaveBeenCalled()
    })

    it('リセット操作で任意の状態からidleに戻る', async () => {
      // 実行中にリセット
      engine.start()
      mockTime += 1000
      mockPerformanceNow.mockReturnValue(mockTime)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      engine.reset()
      expect(onStatusChangeSpy).toHaveBeenCalledWith('idle', expect.any(Object))
      
      const resetState = engine.getState()
      expect(resetState.status).toBe('idle')
      expect(resetState.elapsedMs).toBe(0)
      expect(resetState.remainingMs).toBe(resetState.durationMs)
      expect(resetState.pauseAccumulatedMs).toBe(0)
      
      // 一時停止中にリセット
      engine.start()
      mockTime += 2000
      mockPerformanceNow.mockReturnValue(mockTime)
      await new Promise(resolve => setTimeout(resolve, 10))
      engine.pause()
      
      engine.reset()
      expect(onStatusChangeSpy).toHaveBeenCalledWith('idle', expect.any(Object))
    })
  })

  describe('エラーハンドリングと境界値の統合テスト', () => {
    it('実行中でない状態でpauseを呼び出しても何も起こらない', () => {
      const initialState = engine.getState()
      
      // idle状態でpauseを呼び出し
      engine.pause()
      
      const afterState = engine.getState()
      expect(afterState.status).toBe('idle')
      expect(afterState).toEqual(initialState)
      
      // onStatusChangeが呼ばれないことを確認
      expect(onStatusChangeSpy).not.toHaveBeenCalled()
    })

    it('一時停止中でない状態でresumeを呼び出しても何も起こらない', () => {
      // idle状態でresumeを呼び出し
      engine.resume()
      expect(engine.getState().status).toBe('idle')
      
      // running状態でresumeを呼び出し
      engine.start()
      const runningState = engine.getState()
      engine.resume()
      const afterResumeState = engine.getState()
      
      expect(afterResumeState.status).toBe('running')
      // 状態に変化がないことを確認
    })

    it('既に実行中の状態でstartを呼び出しても何も起こらない', () => {
      engine.start()
      const runningState = engine.getState()
      
      // 再度startを呼び出し
      engine.start()
      const afterSecondStart = engine.getState()
      
      expect(afterSecondStart.status).toBe('running')
      expect(afterSecondStart.startTime).toBe(runningState.startTime)
    })

    it('非常に短い時間（1ms）でも正常に動作する', async () => {
      engine.destroy()
      engine = new TimerEngine(1, {
        onTick: onTickSpy,
        onStatusChange: onStatusChangeSpy,
        onFinish: onFinishSpy
      })
      
      engine.start()
      
      // 1ms経過
      mockTime += 1
      mockPerformanceNow.mockReturnValue(mockTime)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const finalState = engine.getState()
      expect(finalState.status).toBe('finished')
      expect(finalState.remainingMs).toBe(0)
    })

    it('非常に長い時間（24時間）でも正常に動作する', () => {
      const longDuration = 24 * 60 * 60 * 1000 // 24時間
      engine.destroy()
      engine = new TimerEngine(longDuration, {
        onTick: onTickSpy,
        onStatusChange: onStatusChangeSpy,
        onFinish: onFinishSpy
      })
      
      engine.start()
      
      // 1時間経過
      mockTime += 60 * 60 * 1000
      mockPerformanceNow.mockReturnValue(mockTime)
      
      const state = engine.getState()
      expect(state.status).toBe('running')
      expect(state.remainingMs).toBeCloseTo(23 * 60 * 60 * 1000, -2)
    })
  })

  describe('精度とパフォーマンスの統合テスト', () => {
    it('長時間実行しても精度の劣化が最小限に抑えられる', async () => {
      // 1時間のタイマーを作成
      const longDuration = 60 * 60 * 1000
      engine.destroy()
      engine = new TimerEngine(longDuration, {
        onTick: onTickSpy,
        onStatusChange: onStatusChangeSpy,
        onFinish: onFinishSpy
      })
      
      engine.start()
      
      // 30分経過をシミュレート
      const elapsedTime = 30 * 60 * 1000
      mockTime += elapsedTime
      mockPerformanceNow.mockReturnValue(mockTime)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const state = engine.getState()
      const expectedRemaining = longDuration - elapsedTime
      
      // 精度の劣化が1秒以内であることを確認
      expect(Math.abs(state.remainingMs - expectedRemaining)).toBeLessThan(1000)
      expect(state.precisionDriftMs).toBeLessThan(1000)
    })

    it('頻繁な一時停止と再開でも精度が維持される', async () => {
      const totalDuration = 60000 // 1分
      let totalElapsed = 0
      
      // 10回の短い実行サイクル
      for (let i = 0; i < 10; i++) {
        engine.start()
        
        const cycleTime = 1000 // 1秒ずつ
        mockTime += cycleTime
        totalElapsed += cycleTime
        mockPerformanceNow.mockReturnValue(mockTime)
        await new Promise(resolve => setTimeout(resolve, 5))
        
        engine.pause()
        
        // 一時停止中に時間を進める（タイマーには影響しない）
        mockTime += 500
        mockPerformanceNow.mockReturnValue(mockTime)
      }
      
      const finalState = engine.getState()
      const expectedRemaining = totalDuration - totalElapsed
      
      // 精度が100ms以内であることを確認
      expect(Math.abs(finalState.remainingMs - expectedRemaining)).toBeLessThan(100)
    })
  })
})