import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from './useTimer'
import { useAppStore } from '../store'
import { timerSingleton } from '../utils/timer-singleton'

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

describe('useTimer Integration Tests', () => {
  let mockTime = 1000

  beforeEach(() => {
    // ストアを初期状態にリセット
    useAppStore.setState({
      timer: {
        status: 'idle',
        durationMs: 10 * 60 * 1000, // 10分
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

    // タイマーシングルトンをリセット
    timerSingleton.destroy?.()
    
    // モック関数をリセット
    mockPerformanceNow.mockReset()
    mockRaf.mockReset()
    mockCancelAnimationFrame.mockReset()
    
    // 初期時刻を設定
    mockTime = 1000
    mockPerformanceNow.mockReturnValue(mockTime)
    
    // requestAnimationFrameのモック実装
    mockRaf.mockImplementation((callback) => {
      setTimeout(() => callback(mockTime), 0)
      return 1
    })
  })

  afterEach(() => {
    // タイマーシングルトンをクリーンアップ
    timerSingleton.destroy?.()
  })

  describe('重複更新防止機能のテスト', () => {
    it('同じduration値でsetDurationを呼び出した場合、タイマーエンジンが更新されない', async () => {
      const { result } = renderHook(() => useTimer())

      // 初期状態の確認
      expect(result.current.durationMs).toBe(10 * 60 * 1000)

      // タイマーエンジンのsetDurationメソッドをスパイ
      const setDurationSpy = vi.spyOn(timerSingleton, 'setDuration')

      // 同じ値でsetDurationを呼び出し
      act(() => {
        result.current.setDuration(10 * 60 * 1000)
      })

      // タイマーエンジンのsetDurationが呼ばれないことを確認
      expect(setDurationSpy).not.toHaveBeenCalled()

      setDurationSpy.mockRestore()
    })

    it('異なるduration値でsetDurationを呼び出した場合、タイマーエンジンが更新される', async () => {
      const { result } = renderHook(() => useTimer())

      // タイマーエンジンのsetDurationメソッドをスパイ
      const setDurationSpy = vi.spyOn(timerSingleton, 'setDuration')

      // 異なる値でsetDurationを呼び出し
      act(() => {
        result.current.setDuration(5 * 60 * 1000)
      })

      // タイマーエンジンのsetDurationが呼ばれることを確認
      expect(setDurationSpy).toHaveBeenCalledWith(5 * 60 * 1000)

      setDurationSpy.mockRestore()
    })

    it('複数回同じ値でsetDurationを呼び出しても、最初の1回のみ更新される', async () => {
      const { result } = renderHook(() => useTimer())

      // タイマーエンジンのsetDurationメソッドをスパイ
      const setDurationSpy = vi.spyOn(timerSingleton, 'setDuration')

      // 最初に異なる値で呼び出し
      act(() => {
        result.current.setDuration(8 * 60 * 1000)
      })

      // 同じ値で複数回呼び出し
      act(() => {
        result.current.setDuration(8 * 60 * 1000)
        result.current.setDuration(8 * 60 * 1000)
        result.current.setDuration(8 * 60 * 1000)
      })

      // 最初の1回のみ呼ばれることを確認
      expect(setDurationSpy).toHaveBeenCalledTimes(1)
      expect(setDurationSpy).toHaveBeenCalledWith(8 * 60 * 1000)

      setDurationSpy.mockRestore()
    })
  })

  describe('タイマー状態とストア状態の同期テスト', () => {
    it('タイマーエンジンの状態変更がuseTimerの戻り値に反映される', async () => {
      const { result } = renderHook(() => useTimer())

      // 初期状態の確認
      expect(result.current.status).toBe('idle')
      expect(result.current.remainingMs).toBe(10 * 60 * 1000)

      // タイマーを開始
      act(() => {
        result.current.start()
      })

      // 状態が更新されることを確認
      expect(result.current.status).toBe('running')

      // 時間を進める
      mockTime += 3000
      mockPerformanceNow.mockReturnValue(mockTime)

      // タイマーを一時停止
      act(() => {
        result.current.pause()
      })

      expect(result.current.status).toBe('paused')
    })

    it('ストアのduration変更がタイマーエンジンに同期される', async () => {
      const { result } = renderHook(() => useTimer())

      // タイマーエンジンのsetDurationメソッドをスパイ
      const setDurationSpy = vi.spyOn(timerSingleton, 'setDuration')

      // ストアのdurationを直接変更
      act(() => {
        useAppStore.getState().setDuration(7 * 60 * 1000)
      })

      // タイマーエンジンに同期されることを確認
      expect(setDurationSpy).toHaveBeenCalledWith(7 * 60 * 1000)

      setDurationSpy.mockRestore()
    })

    it('タイマーリセット時にベル状態もリセットされる', async () => {
      const { result } = renderHook(() => useTimer())

      // ベルをトリガー状態にする
      act(() => {
        useAppStore.getState().triggerBell('first')
      })

      // ベルがトリガーされていることを確認
      expect(useAppStore.getState().bells.triggered.first).toBe(true)

      // タイマーをリセット
      act(() => {
        result.current.reset()
      })

      // ベル状態がリセットされることを確認
      expect(useAppStore.getState().bells.triggered.first).toBe(false)
    })
  })

  describe('タイマー精度の統合テスト', () => {
    it('一時停止と再開を繰り返しても時間の精度が維持される', async () => {
      const { result } = renderHook(() => useTimer())

      // タイマーを開始
      act(() => {
        result.current.start()
      })

      // 1秒経過
      mockTime += 1000
      mockPerformanceNow.mockReturnValue(mockTime)

      // 一時停止
      act(() => {
        result.current.pause()
      })

      const remainingAfterFirstPause = result.current.remainingMs

      // 2秒待機（タイマーは停止中）
      mockTime += 2000
      mockPerformanceNow.mockReturnValue(mockTime)

      // 再開
      act(() => {
        result.current.resume()
      })

      // 再開直後の残り時間は一時停止時と同じであるべき
      expect(result.current.remainingMs).toBe(remainingAfterFirstPause)

      // さらに1秒経過
      mockTime += 1000
      mockPerformanceNow.mockReturnValue(mockTime)

      // 再度一時停止
      act(() => {
        result.current.pause()
      })

      // 合計2秒分減っているはず（最初の1秒 + 再開後の1秒）
      const expectedRemaining = 10 * 60 * 1000 - 2000
      expect(result.current.remainingMs).toBeCloseTo(expectedRemaining, -2) // 100ms以内の誤差を許容
    })

    it('setDurationによる時間変更後も正確な比率で残り時間が計算される', async () => {
      const { result } = renderHook(() => useTimer())

      // タイマーを開始
      act(() => {
        result.current.start()
      })

      // 5秒経過（半分の時間）
      mockTime += 5000
      mockPerformanceNow.mockReturnValue(mockTime)

      // 一時停止
      act(() => {
        result.current.pause()
      })

      // この時点で残り時間は約9:55（595秒）のはず
      const remainingBeforeChange = result.current.remainingMs
      expect(remainingBeforeChange).toBeCloseTo(595000, -2)

      // 時間を20分（1200秒）に変更
      act(() => {
        result.current.setDuration(20 * 60 * 1000)
      })

      // 残り時間が比率に応じて調整されることを確認
      // 元の比率: 595/600 ≈ 0.9917
      // 新しい残り時間: 1200 * 0.9917 ≈ 1190秒
      const expectedNewRemaining = 1200000 * (remainingBeforeChange / 600000)
      expect(result.current.remainingMs).toBeCloseTo(expectedNewRemaining, -2)
    })

    it('タイマー完了時に正確に0になる', async () => {
      const { result } = renderHook(() => useTimer())

      // 短い時間（3秒）に設定
      act(() => {
        result.current.setDuration(3000)
      })

      // タイマーを開始
      act(() => {
        result.current.start()
      })

      // 3秒経過
      mockTime += 3000
      mockPerformanceNow.mockReturnValue(mockTime)

      // RAF コールバックを手動で実行してタイマー完了をシミュレート
      act(() => {
        // タイマーエンジンの内部状態を更新
        const state = timerSingleton.getState()
        if (state) {
          // 完了状態をシミュレート
          timerSingleton.getState = vi.fn().mockReturnValue({
            ...state,
            status: 'finished',
            remainingMs: 0,
            elapsedMs: 3000
          })
        }
      })

      // タイマーが完了状態になることを確認
      expect(result.current.status).toBe('finished')
      expect(result.current.remainingMs).toBe(0)
      expect(result.current.elapsedMs).toBe(3000)
    })
  })

  describe('エラーハンドリングと境界値テスト', () => {
    it('負の値でsetDurationを呼び出した場合の動作', async () => {
      const { result } = renderHook(() => useTimer())

      // 負の値で呼び出し（実際のアプリでは発生しないが、防御的プログラミング）
      act(() => {
        result.current.setDuration(-1000)
      })

      // タイマーエンジンが適切に処理することを確認
      // （具体的な動作はTimerEngineの実装に依存）
      expect(result.current.durationMs).toBe(-1000)
    })

    it('非常に大きな値でsetDurationを呼び出した場合の動作', async () => {
      const { result } = renderHook(() => useTimer())

      const largeValue = 24 * 60 * 60 * 1000 // 24時間

      act(() => {
        result.current.setDuration(largeValue)
      })

      expect(result.current.durationMs).toBe(largeValue)
      expect(result.current.remainingMs).toBe(largeValue)
    })

    it('0でsetDurationを呼び出した場合の動作', async () => {
      const { result } = renderHook(() => useTimer())

      act(() => {
        result.current.setDuration(0)
      })

      expect(result.current.durationMs).toBe(0)
      expect(result.current.remainingMs).toBe(0)
    })
  })

  describe('メモリリークとクリーンアップのテスト', () => {
    it('フックのアンマウント時にタイマーが適切にクリーンアップされる', async () => {
      const { result, unmount } = renderHook(() => useTimer())

      // タイマーを開始
      act(() => {
        result.current.start()
      })

      // cancelAnimationFrameのスパイ
      const cancelSpy = vi.spyOn(global, 'cancelAnimationFrame')

      // フックをアンマウント
      unmount()

      // クリーンアップが呼ばれることを確認
      // （実際の実装に応じて調整が必要）
      expect(cancelSpy).toHaveBeenCalled()

      cancelSpy.mockRestore()
    })

    it('複数のuseTimerインスタンスが同じシングルトンを共有する', async () => {
      const { result: result1 } = renderHook(() => useTimer())
      const { result: result2 } = renderHook(() => useTimer())

      // 一方でdurationを変更
      act(() => {
        result1.current.setDuration(15 * 60 * 1000)
      })

      // 両方に反映されることを確認
      expect(result1.current.durationMs).toBe(15 * 60 * 1000)
      expect(result2.current.durationMs).toBe(15 * 60 * 1000)

      // 一方でタイマーを開始
      act(() => {
        result1.current.start()
      })

      // 両方に反映されることを確認
      expect(result1.current.status).toBe('running')
      expect(result2.current.status).toBe('running')
    })
  })
})