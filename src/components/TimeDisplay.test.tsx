import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TimeDisplay from './TimeDisplay'
import { useTimerState, useTimerActions } from '../store'

// Zustandストアをモック
vi.mock('../store', () => ({
  useTimerState: vi.fn(),
  useTimerActions: vi.fn()
}))

const mockUseTimerState = vi.mocked(useTimerState)
const mockUseTimerActions = vi.mocked(useTimerActions)

describe('TimeDisplay', () => {
  const mockSetDuration = vi.fn()
  
  const defaultTimerState = {
    status: 'idle' as const,
    durationMs: 10 * 60 * 1000, // 10分
    startEpochMs: undefined,
    pauseAccumulatedMs: 0,
    nowEpochMs: Date.now()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTimerState.mockReturnValue(defaultTimerState)
    mockUseTimerActions.mockReturnValue({
      setDuration: mockSetDuration,
      startTimer: vi.fn(),
      pauseTimer: vi.fn(),
      resetTimer: vi.fn(),
      updateNow: vi.fn()
    })
  })

  describe('表示機能', () => {
    it('初期状態で正しい時間を表示する', () => {
      render(<TimeDisplay />)
      
      expect(screen.getByText('10:00')).toBeInTheDocument()
      expect(screen.getByText('クリックで時間を編集')).toBeInTheDocument()
    })

    it('残り時間を正確に計算して表示する', () => {
      // 5分経過した状態をシミュレート
      mockUseTimerState.mockReturnValue({
        ...defaultTimerState,
        status: 'paused',
        pauseAccumulatedMs: 5 * 60 * 1000 // 5分経過
      })

      render(<TimeDisplay />)
      
      expect(screen.getByText('05:00')).toBeInTheDocument()
    })

    it('実行中の状態で動的に時間を更新する', () => {
      const startTime = 1000
      mockUseTimerState.mockReturnValue({
        ...defaultTimerState,
        status: 'running',
        startEpochMs: startTime,
        nowEpochMs: startTime + 2 * 60 * 1000, // 2分経過
        pauseAccumulatedMs: 0
      })

      render(<TimeDisplay />)
      
      expect(screen.getByText('08:00')).toBeInTheDocument()
    })

    it('完了状態で0:00を表示し、赤色になる', () => {
      mockUseTimerState.mockReturnValue({
        ...defaultTimerState,
        status: 'finished'
      })

      render(<TimeDisplay />)
      
      const timeElement = screen.getByText('10:00')
      expect(timeElement).toHaveClass('text-red-500')
    })
  })

  describe('編集機能', () => {
    it('クリックで編集モードに入る', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      const timeDisplay = screen.getByRole('button')
      await user.click(timeDisplay)
      
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByDisplayValue('10:00')).toBeInTheDocument()
    })

    it('キーボードでも編集モードに入れる', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      const timeDisplay = screen.getByRole('button')
      timeDisplay.focus()
      await user.keyboard('{Enter}')
      
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('実行中は編集モードに入れない', async () => {
      mockUseTimerState.mockReturnValue({
        ...defaultTimerState,
        status: 'running'
      })

      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      const timeDisplay = screen.getByText('10:00')
      await user.click(timeDisplay)
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.getByText('実行中は編集できません')).toBeInTheDocument()
    })
  })

  describe('入力バリデーション', () => {
    it('有効な時間入力を受け入れる', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 編集モードに入る
      await user.click(screen.getByRole('button'))
      
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '05:30')
      await user.keyboard('{Enter}')
      
      expect(mockSetDuration).toHaveBeenCalledWith(5.5 * 60 * 1000)
    })

    it('無効な形式でエラーを表示する', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      await user.click(screen.getByRole('button'))
      
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '5:3') // 秒が1桁
      
      expect(screen.getByText('mm:ss形式で入力してください（例：05:30）')).toBeInTheDocument()
    })

    it('0の時間でエラーを表示する', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      await user.click(screen.getByRole('button'))
      
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '00:00')
      await user.keyboard('{Enter}')
      
      expect(screen.getByText('0より大きい時間を入力してください')).toBeInTheDocument()
      expect(mockSetDuration).not.toHaveBeenCalled()
    })

    it('59:59を超える時間でエラーを表示する', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      await user.click(screen.getByRole('button'))
      
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '60:00')
      
      // 60:00は形式エラーとして扱われる
      expect(screen.getByText('mm:ss形式で入力してください（例：05:30）')).toBeInTheDocument()
      
      await user.keyboard('{Enter}')
      expect(mockSetDuration).not.toHaveBeenCalled()
    })

    it('Escapeキーで編集をキャンセルする', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      await user.click(screen.getByRole('button'))
      
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '05:30')
      await user.keyboard('{Escape}')
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.getByText('10:00')).toBeInTheDocument()
      expect(mockSetDuration).not.toHaveBeenCalled()
    })

    it('フォーカスを失うと編集を確定する', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      await user.click(screen.getByRole('button'))
      
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '07:15')
      
      // 他の要素をクリックしてフォーカスを失う
      fireEvent.blur(input)
      
      await waitFor(() => {
        expect(mockSetDuration).toHaveBeenCalledWith(7.25 * 60 * 1000)
      })
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なARIAラベルを持つ', () => {
      render(<TimeDisplay />)
      
      const timeDisplay = screen.getByRole('button')
      expect(timeDisplay).toHaveAttribute('aria-label', '残り時間 10:00。クリックして編集')
    })

    it('編集モードで適切なラベルを持つ', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      await user.click(screen.getByRole('button'))
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-label', '時間を編集')
    })

    it('エラー時に適切なaria-describedbyを設定する', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      await user.click(screen.getByRole('button'))
      
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'invalid')
      
      expect(input).toHaveAttribute('aria-describedby', 'time-error time-format-help')
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  describe('レスポンシブデザイン', () => {
    it('適切なレスポンシブクラスを持つ', () => {
      render(<TimeDisplay />)
      
      const timeDisplay = screen.getByText('10:00')
      expect(timeDisplay).toHaveClass('text-4xl', 'sm:text-5xl', 'md:text-6xl', 'lg:text-7xl')
    })

    it('カスタムクラス名を受け入れる', () => {
      render(<TimeDisplay className="custom-class" />)
      
      const timeDisplay = screen.getByText('10:00')
      expect(timeDisplay).toHaveClass('custom-class')
    })
  })
})