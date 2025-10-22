import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Controls from './Controls'
import { useTimer } from '../hooks/useTimer'

// useTimerフックをモック
vi.mock('../hooks/useTimer', () => ({
  useTimer: vi.fn()
}))

const mockUseTimer = vi.mocked(useTimer)

describe('Controls', () => {
  const mockStart = vi.fn()
  const mockPause = vi.fn()
  const mockReset = vi.fn()
  const mockTestBell = vi.fn()
  const mockInitializeAudio = vi.fn()

  beforeEach(() => {
    mockUseTimer.mockReturnValue({
      status: 'idle',
      elapsedMs: 0,
      remainingMs: 10 * 60 * 1000,
      durationMs: 10 * 60 * 1000,
      precisionDriftMs: 0,
      start: mockStart,
      pause: mockPause,
      resume: vi.fn(),
      reset: mockReset,
      setDuration: vi.fn(),
      testBell: mockTestBell,
      initializeAudio: mockInitializeAudio,
      isAudioReady: true,
      isRunning: false,
      isPaused: false,
      isIdle: true,
      isFinished: false
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('ボタンレンダリング', () => {
    it('3つのコントロールボタンが表示される', () => {
      render(<Controls />)

      expect(screen.getByLabelText(/タイマーをリセット/)).toBeInTheDocument()
      expect(screen.getByLabelText(/ベル音をテスト/)).toBeInTheDocument()
      expect(screen.getByLabelText(/タイマーを開始/)).toBeInTheDocument()
    })

    it('適切なARIAラベルが設定されている', () => {
      render(<Controls />)

      const resetButton = screen.getByLabelText('タイマーをリセット (R)')
      const bellButton = screen.getByLabelText('ベル音をテスト (B)')
      const playButton = screen.getByLabelText('タイマーを開始 (Space)')

      expect(resetButton).toHaveAttribute('aria-label', 'タイマーをリセット (R)')
      expect(bellButton).toHaveAttribute('aria-label', 'ベル音をテスト (B)')
      expect(playButton).toHaveAttribute('aria-label', 'タイマーを開始 (Space)')
    })

    it('グループロールが設定されている', () => {
      render(<Controls />)

      const controlGroup = screen.getByRole('group', { name: 'タイマーコントロール' })
      expect(controlGroup).toBeInTheDocument()
    })
  })

  describe('ボタンクリック動作', () => {
    it('リセットボタンクリックでresetが呼ばれる', () => {
      render(<Controls />)

      const resetButton = screen.getByLabelText(/タイマーをリセット/)
      fireEvent.click(resetButton)

      expect(mockReset).toHaveBeenCalledTimes(1)
    })

    it('ベルテストボタンクリックでtestBellが呼ばれる', async () => {
      render(<Controls />)

      const bellButton = screen.getByLabelText(/ベル音をテスト/)
      fireEvent.click(bellButton)

      await waitFor(() => {
        expect(mockTestBell).toHaveBeenCalledTimes(1)
      })
    })

    it('idle状態で再生ボタンクリックでstartが呼ばれる', async () => {
      render(<Controls />)

      const playButton = screen.getByLabelText(/タイマーを開始/)
      fireEvent.click(playButton)

      await waitFor(() => {
        expect(mockStart).toHaveBeenCalledTimes(1)
      })
    })

    it('running状態で再生ボタンクリックでpauseが呼ばれる', async () => {
      mockUseTimer.mockReturnValue({
        ...mockUseTimer(),
        status: 'running',
        isRunning: true,
        isIdle: false
      })

      render(<Controls />)

      const pauseButton = screen.getByLabelText(/タイマーを一時停止/)
      fireEvent.click(pauseButton)

      await waitFor(() => {
        expect(mockPause).toHaveBeenCalledTimes(1)
      })
    })

    it('paused状態で再生ボタンクリックでstartが呼ばれる', async () => {
      mockUseTimer.mockReturnValue({
        ...mockUseTimer(),
        status: 'paused',
        isPaused: true,
        isIdle: false
      })

      render(<Controls />)

      const playButton = screen.getByLabelText(/タイマーを開始/)
      fireEvent.click(playButton)

      await waitFor(() => {
        expect(mockStart).toHaveBeenCalledTimes(1)
      })
    })

    it('オーディオ初期化が必要な場合は自動的に初期化される', async () => {
      mockUseTimer.mockReturnValue({
        ...mockUseTimer(),
        isAudioReady: false
      })

      render(<Controls />)

      const bellButton = screen.getByLabelText(/ベル音をテスト/)
      fireEvent.click(bellButton)

      await waitFor(() => {
        expect(mockInitializeAudio).toHaveBeenCalled()
        expect(mockTestBell).toHaveBeenCalled()
      })
    })
  })

  describe('タイマー状態に基づくボタン表示', () => {
    it('idle状態では再生アイコンが表示される', () => {
      render(<Controls />)

      const playButton = screen.getByLabelText(/タイマーを開始/)
      expect(playButton).toBeInTheDocument()
    })

    it('running状態では一時停止アイコンが表示される', () => {
      mockUseTimer.mockReturnValue({
        ...mockUseTimer(),
        status: 'running',
        isRunning: true,
        isIdle: false
      })

      render(<Controls />)

      const pauseButton = screen.getByLabelText(/タイマーを一時停止/)
      expect(pauseButton).toBeInTheDocument()
    })

    it('finished状態では再生ボタンが無効化される', () => {
      mockUseTimer.mockReturnValue({
        ...mockUseTimer(),
        status: 'finished',
        isFinished: true,
        isIdle: false
      })

      render(<Controls />)

      const finishedButton = screen.getByLabelText(/タイマー完了/)
      expect(finishedButton).toBeDisabled()
    })
  })

  describe('キーボードショートカット', () => {
    it('Spaceキーで再生/一時停止が切り替わる', async () => {
      render(<Controls />)

      fireEvent.keyDown(document, { code: 'Space' })

      await waitFor(() => {
        expect(mockStart).toHaveBeenCalledTimes(1)
      })
    })

    it('Rキーでリセットが実行される', async () => {
      render(<Controls />)

      fireEvent.keyDown(document, { code: 'KeyR' })

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalledTimes(1)
      })
    })

    it('Bキーでベルテストが実行される', async () => {
      render(<Controls />)

      fireEvent.keyDown(document, { code: 'KeyB' })

      await waitFor(() => {
        expect(mockTestBell).toHaveBeenCalled()
      })
    })

    it('入力フィールドにフォーカスがある時はショートカットが無効化される', async () => {
      render(
        <div>
          <input data-testid="test-input" />
          <Controls />
        </div>
      )

      const input = screen.getByTestId('test-input')
      input.focus()

      fireEvent.keyDown(input, { code: 'Space' })

      await waitFor(() => {
        expect(mockStart).not.toHaveBeenCalled()
      })
    })

    it('オーディオ初期化がキーボードショートカットでも実行される', async () => {
      mockUseTimer.mockReturnValue({
        ...mockUseTimer(),
        isAudioReady: false
      })

      render(<Controls />)

      fireEvent.keyDown(document, { code: 'Space' })

      await waitFor(() => {
        expect(mockInitializeAudio).toHaveBeenCalled()
      })
    })
  })

  describe('アクセシビリティ', () => {
    it('すべてのボタンにtype="button"が設定されている', () => {
      render(<Controls />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button')
      })
    })

    it('フォーカスリングのスタイルが適用されている', () => {
      render(<Controls />)

      const resetButton = screen.getByLabelText(/タイマーをリセット/)
      expect(resetButton).toHaveClass('focus-ring')
    })

    it('ボタンサイズが44x44px以上である', () => {
      render(<Controls />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('w-tap', 'h-tap')
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('ベルテストでエラーが発生してもクラッシュしない', async () => {
      mockTestBell.mockRejectedValueOnce(new Error('Audio failed'))

      render(<Controls />)

      const bellButton = screen.getByLabelText(/ベル音をテスト/)
      
      expect(() => {
        fireEvent.click(bellButton)
      }).not.toThrow()
    })

    it('オーディオ初期化でエラーが発生してもクラッシュしない', async () => {
      mockInitializeAudio.mockRejectedValueOnce(new Error('Audio init failed'))

      render(<Controls />)

      const playButton = screen.getByLabelText(/タイマーを開始/)
      
      expect(() => {
        fireEvent.click(playButton)
      }).not.toThrow()
    })
  })
})