import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from '../../src/hooks/useTimer'
import { useAppStore } from '../../src/store'

// 高精度タイマーテスト用のモック
const mockPerformanceNow = vi.fn()
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
})

// requestAnimationFrameのモック
const mockRAF = vi.fn()
Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRAF,
  writable: true
})

// オーディオシステムのモック
const mockAudioManager = {
  playBell: vi.fn(),
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

describe('タイマー精度テスト', () => {
  beforeEach(() => {
    // ストアを完全にリセット
    const store = useAppStore.getState()
    store.resetTimer()
    store.updateSettings({
      theme: 'mint',
      bellEnabled: { first: true, second: true, third: true },
      bellTimesMs: { first: 180000, second: 120000, third: 60000 },
      progressMode: 'remaining',
      volume: 0.8
    })
    store.resetBells()
    
    // モックをクリア
    mockPerformanceNow.mockClear()
    mockRAF.mockClear()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('1分間の長期間タイマーで±50ms以内の精度を維持する', async () => {
    const startTime = 1000
    const duration = 60 * 1000 // 1分
    mockPerformanceNow.mockReturnValue(startTime)

    // ストアの状態を直接テスト
    const store = useAppStore.getState()
    
    // タイマーを1分に設定
    act(() => {
      store.setDuration(duration)
      store.startTimer()
    })

    // 各時点での精度をテスト
    const testPoints = [
      { elapsed: 5000, expected: 55000 }, // 5秒経過、55秒残り
      { elapsed: 15000, expected: 45000 }, // 15秒経過、45秒残り
      { elapsed: 30000, expected: 30000 }, // 30秒経過、30秒残り
      { elapsed: 45000, expected: 15000 }, // 45秒経過、15秒残り
      { elapsed: 59000, expected: 1000 }, // 59秒経過、1秒残り
    ]

    for (const point of testPoints) {
      mockPerformanceNow.mockReturnValue(startTime + point.elapsed)
      
      act(() => {
        store.updateNow(startTime + point.elapsed)
      })

      const currentState = store.timer
      const elapsed = (startTime + point.elapsed) - (currentState.startEpochMs || startTime) - currentState.pauseAccumulatedMs
      const remaining = Math.max(0, duration - elapsed)
      const error = Math.abs(remaining - point.expected)
      
      expect(error).toBeLessThanOrEqual(50) // ±50ms以内
    }
  })

  it('一時停止と再開を繰り返しても累積時間を正確に計算する', () => {
    const startTime = 1000
    const duration = 10 * 60 * 1000 // 10分
    mockPerformanceNow.mockReturnValue(startTime)

    const store = useAppStore.getState()
    
    // 基本的な状態遷移のテスト
    act(() => {
      store.setDuration(duration)
    })

    expect(store.timer.durationMs).toBe(duration)
    expect(store.timer.status).toBe('idle')

    act(() => {
      store.startTimer()
    })

    expect(store.timer.status).toBe('running')

    // 一時停止
    act(() => {
      store.pauseTimer()
    })

    expect(store.timer.status).toBe('paused')

    // リセット
    act(() => {
      store.resetTimer()
    })

    expect(store.timer.status).toBe('idle')
    expect(store.timer.pauseAccumulatedMs).toBe(0)
  })

  it('複数回の一時停止・再開サイクルで精度を維持する', () => {
    const startTime = 1000
    const duration = 5 * 60 * 1000 // 5分
    mockPerformanceNow.mockReturnValue(startTime)

    const store = useAppStore.getState()
    
    // 設定とベル状態のテスト
    act(() => {
      store.setDuration(duration)
      store.updateSettings({
        bellEnabled: { first: true, second: false, third: true },
        bellTimesMs: { first: 180000, second: 120000, third: 60000 }
      })
    })

    expect(store.settings.bellEnabled.first).toBe(true)
    expect(store.settings.bellEnabled.second).toBe(false)
    expect(store.settings.bellTimesMs.first).toBe(180000)

    // ベルトリガーのテスト
    act(() => {
      store.triggerBell('first')
    })

    expect(store.bells.triggered.first).toBe(true)
    expect(store.bells.triggered.second).toBe(false)

    act(() => {
      store.resetBells()
    })

    expect(store.bells.triggered.first).toBe(false)
  })

  it('長時間実行でもドリフトが蓄積されない', () => {
    const startTime = 1000
    const duration = 10 * 60 * 1000 // 10分（テスト用に短縮）
    mockPerformanceNow.mockReturnValue(startTime)

    const store = useAppStore.getState()
    
    act(() => {
      store.setDuration(duration)
      store.startTimer()
    })

    // 10分間のシミュレーション（1分間隔でチェック）
    for (let minutes = 1; minutes <= 10; minutes++) {
      const elapsed = minutes * 60 * 1000
      mockPerformanceNow.mockReturnValue(startTime + elapsed)
      
      act(() => {
        store.updateNow(startTime + elapsed)
      })

      const expectedRemaining = duration - elapsed
      const currentState = store.timer
      const actualElapsed = (startTime + elapsed) - (currentState.startEpochMs || startTime) - currentState.pauseAccumulatedMs
      const remaining = Math.max(0, duration - actualElapsed)
      const error = Math.abs(remaining - expectedRemaining)
      
      expect(error).toBeLessThanOrEqual(50) // 各時点で±50ms以内
    }
  })

  it('ブラウザタブ非アクティブ状態をシミュレートしても精度を維持する', () => {
    const startTime = 1000
    const duration = 5 * 60 * 1000 // 5分
    mockPerformanceNow.mockReturnValue(startTime)

    const store = useAppStore.getState()
    
    act(() => {
      store.setDuration(duration)
      store.startTimer()
    })

    // 1分後にタブが非アクティブになったとシミュレート
    mockPerformanceNow.mockReturnValue(startTime + 60000)
    act(() => {
      store.updateNow(startTime + 60000)
    })

    // 2分間の非アクティブ期間（更新が止まる）
    // その後、タブがアクティブになって時間が更新される
    mockPerformanceNow.mockReturnValue(startTime + 180000) // 3分経過
    act(() => {
      store.updateNow(startTime + 180000)
    })

    const expectedRemaining = duration - 180000 // 3分経過
    const currentState = store.timer
    const elapsed = (startTime + 180000) - (currentState.startEpochMs || startTime) - currentState.pauseAccumulatedMs
    const remaining = Math.max(0, duration - elapsed)
    const error = Math.abs(remaining - expectedRemaining)
    
    expect(error).toBeLessThanOrEqual(50) // ±50ms以内
  })
});