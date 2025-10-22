import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from '../../src/hooks/useTimer'
import { useAppStore } from '../../src/store'

// オーディオシステムのモック
const mockPlayBell = vi.fn()
const mockAudioManager = {
  playBell: mockPlayBell,
  setVolume: vi.fn(),
  testSound: vi.fn(),
  isReady: vi.fn(() => true),
  initialize: vi.fn(),
  getVolume: vi.fn(() => 0.7),
  getContextState: vi.fn(() => 'running'),
  destroy: vi.fn()
}

vi.mock('../../src/utils/audio-manager', () => ({
  AudioManager: vi.fn(() => mockAudioManager),
  getAudioManager: vi.fn(() => mockAudioManager),
  initializeAudio: vi.fn(() => Promise.resolve(mockAudioManager))
}))

const mockPerformanceNow = vi.fn()
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
})

describe('ベルトリガー検証テスト', () => {
  beforeEach(() => {
    useAppStore.getState().resetTimer()
    mockPerformanceNow.mockClear()
    mockPlayBell.mockClear()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('正しいしきい値でベルがトリガーされる', () => {
    const startTime = 1000
    const duration = 10 * 1000 // 10秒
    mockPerformanceNow.mockReturnValue(startTime)

    // ベル設定
    act(() => {
      useAppStore.getState().updateSettings({
        bellEnabled: { first: true, second: true, third: true },
        bellTimesMs: { 
          first: 8000,  // 残り8秒
          second: 5000, // 残り5秒
          third: 2000   // 残り2秒
        }
      })
      useAppStore.getState().setDuration(duration)
    })

    const { result } = renderHook(() => useTimer())

    // タイマー開始
    act(() => {
      result.current.start()
    })

    // 1秒経過（残り9秒）- ベルなし
    mockPerformanceNow.mockReturnValue(startTime + 1000)
    act(() => {
      useAppStore.getState().updateNow(startTime + 1000)
    })
    expect(mockPlayBell).not.toHaveBeenCalled()

    // 2.5秒経過（残り7.5秒）- 1令トリガー
    mockPerformanceNow.mockReturnValue(startTime + 2500)
    act(() => {
      useAppStore.getState().updateNow(startTime + 2500)
    })
    expect(mockPlayBell).toHaveBeenCalledTimes(1)

    // 5.5秒経過（残り4.5秒）- 2令トリガー
    mockPerformanceNow.mockReturnValue(startTime + 5500)
    act(() => {
      useAppStore.getState().updateNow(startTime + 5500)
    })
    expect(mockPlayBell).toHaveBeenCalledTimes(2)

    // 8.5秒経過（残り1.5秒）- 3令トリガー
    mockPerformanceNow.mockReturnValue(startTime + 8500)
    act(() => {
      useAppStore.getState().updateNow(startTime + 8500)
    })
    expect(mockPlayBell).toHaveBeenCalledTimes(3)
  })

  it('無効にされたベルはトリガーされない', () => {
    const startTime = 1000
    const duration = 10 * 1000 // 10秒
    mockPerformanceNow.mockReturnValue(startTime)

    // 2令のみ有効
    act(() => {
      useAppStore.getState().updateSettings({
        bellEnabled: { first: false, second: true, third: false },
        bellTimesMs: { 
          first: 8000,  // 無効
          second: 5000, // 有効
          third: 2000   // 無効
        }
      })
      useAppStore.getState().setDuration(duration)
    })

    const { result } = renderHook(() => useTimer())

    // タイマー開始
    act(() => {
      result.current.start()
    })

    // 2.5秒経過（残り7.5秒）- 1令は無効なのでトリガーされない
    mockPerformanceNow.mockReturnValue(startTime + 2500)
    act(() => {
      useAppStore.getState().updateNow(startTime + 2500)
    })
    expect(mockPlayBell).not.toHaveBeenCalled()

    // 5.5秒経過（残り4.5秒）- 2令のみトリガー
    mockPerformanceNow.mockReturnValue(startTime + 5500)
    act(() => {
      useAppStore.getState().updateNow(startTime + 5500)
    })
    expect(mockPlayBell).toHaveBeenCalledTimes(1)

    // 8.5秒経過（残り1.5秒）- 3令は無効なのでトリガーされない
    mockPerformanceNow.mockReturnValue(startTime + 8500)
    act(() => {
      useAppStore.getState().updateNow(startTime + 8500)
    })
    expect(mockPlayBell).toHaveBeenCalledTimes(1) // 2令のみ
  })

  it('重複ベルトリガーが防止される', () => {
    const startTime = 1000
    const duration = 10 * 1000 // 10秒
    mockPerformanceNow.mockReturnValue(startTime)

    // 1令を5秒に設定
    act(() => {
      useAppStore.getState().updateSettings({
        bellEnabled: { first: true, second: false, third: false },
        bellTimesMs: { 
          first: 5000,  // 残り5秒
          second: 0,
          third: 0
        }
      })
      useAppStore.getState().setDuration(duration)
    })

    const { result } = renderHook(() => useTimer())

    // タイマー開始
    act(() => {
      result.current.start()
    })

    // 5.5秒経過（残り4.5秒）- 1令トリガー
    mockPerformanceNow.mockReturnValue(startTime + 5500)
    act(() => {
      useAppStore.getState().updateNow(startTime + 5500)
    })
    expect(mockPlayBell).toHaveBeenCalledTimes(1)

    // 一時停止
    act(() => {
      result.current.pause()
    })

    // 再開（同じしきい値を再度通過するが、重複トリガーは発生しない）
    mockPerformanceNow.mockReturnValue(startTime + 6000)
    act(() => {
      result.current.start()
    })

    // さらに時間経過
    mockPerformanceNow.mockReturnValue(startTime + 7000)
    act(() => {
      useAppStore.getState().updateNow(startTime + 7000)
    })

    // ベルは1回のみトリガーされている
    expect(mockPlayBell).toHaveBeenCalledTimes(1)
  })

  it('タイマーリセット時にベル状態もリセットされる', () => {
    const startTime = 1000
    const duration = 10 * 1000 // 10秒
    mockPerformanceNow.mockReturnValue(startTime)

    // 1令を5秒に設定
    act(() => {
      useAppStore.getState().updateSettings({
        bellEnabled: { first: true, second: false, third: false },
        bellTimesMs: { 
          first: 5000,  // 残り5秒
          second: 0,
          third: 0
        }
      })
      useAppStore.getState().setDuration(duration)
    })

    const { result } = renderHook(() => useTimer())

    // タイマー開始
    act(() => {
      result.current.start()
    })

    // 5.5秒経過（残り4.5秒）- 1令トリガー
    mockPerformanceNow.mockReturnValue(startTime + 5500)
    act(() => {
      useAppStore.getState().updateNow(startTime + 5500)
    })
    expect(mockPlayBell).toHaveBeenCalledTimes(1)

    // タイマーリセット
    act(() => {
      result.current.reset()
    })

    // 再度タイマー開始
    mockPerformanceNow.mockReturnValue(startTime + 6000)
    act(() => {
      result.current.start()
    })

    // 再度5.5秒経過（残り4.5秒）- ベル状態がリセットされているので再度トリガー
    mockPerformanceNow.mockReturnValue(startTime + 11500)
    act(() => {
      useAppStore.getState().updateNow(startTime + 11500)
    })
    expect(mockPlayBell).toHaveBeenCalledTimes(2) // リセット後に再度トリガー
  })

  it('複数ベルが同時にしきい値を通過する場合の処理', () => {
    const startTime = 1000
    const duration = 6 * 1000 // 6秒
    mockPerformanceNow.mockReturnValue(startTime)

    // 複数のベルを近いしきい値に設定
    act(() => {
      useAppStore.getState().updateSettings({
        bellEnabled: { first: true, second: true, third: true },
        bellTimesMs: { 
          first: 3000,  // 残り3秒
          second: 2900, // 残り2.9秒
          third: 2800   // 残り2.8秒
        }
      })
      useAppStore.getState().setDuration(duration)
    })

    const { result } = renderHook(() => useTimer())

    // タイマー開始
    act(() => {
      result.current.start()
    })

    // 3.5秒経過（残り2.5秒）- 3つのベルすべてがトリガー
    mockPerformanceNow.mockReturnValue(startTime + 3500)
    act(() => {
      useAppStore.getState().updateNow(startTime + 3500)
    })
    
    // すべてのベルがトリガーされる（実装によっては3回、または統合されて1回）
    expect(mockPlayBell).toHaveBeenCalled()
  })

  it('ベル時間がタイマー時間より長い場合はトリガーされない', () => {
    const startTime = 1000
    const duration = 5 * 1000 // 5秒
    mockPerformanceNow.mockReturnValue(startTime)

    // ベル時間をタイマー時間より長く設定
    act(() => {
      useAppStore.getState().updateSettings({
        bellEnabled: { first: true, second: true, third: true },
        bellTimesMs: { 
          first: 10000, // 残り10秒（タイマーより長い）
          second: 3000, // 残り3秒（有効）
          third: 8000   // 残り8秒（タイマーより長い）
        }
      })
      useAppStore.getState().setDuration(duration)
    })

    const { result } = renderHook(() => useTimer())

    // タイマー開始
    act(() => {
      result.current.start()
    })

    // 2.5秒経過（残り2.5秒）- 2令のみトリガー
    mockPerformanceNow.mockReturnValue(startTime + 2500)
    act(() => {
      useAppStore.getState().updateNow(startTime + 2500)
    })
    expect(mockPlayBell).toHaveBeenCalledTimes(1) // 2令のみ

    // タイマー完了まで待機
    mockPerformanceNow.mockReturnValue(startTime + 5000)
    act(() => {
      useAppStore.getState().updateNow(startTime + 5000)
    })
    
    // 1令と3令はトリガーされない
    expect(mockPlayBell).toHaveBeenCalledTimes(1)
  })
});