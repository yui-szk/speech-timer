import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TimeDisplay from './TimeDisplay'

// useTimerフックをモック
vi.mock('../hooks/useTimer', () => ({
  useTimer: vi.fn()
}))

// timer-singletonをモック
vi.mock('../utils/timer-singleton', () => ({
  timerSingleton: {
    getState: vi.fn(),
    setDuration: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    initialize: vi.fn(),
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    reset: vi.fn()
  }
}))

import { useTimer } from '../hooks/useTimer'
const mockUseTimer = vi.mocked(useTimer)

describe('TimeDisplay', () => {
  const mockSetDuration = vi.fn()
  
  const defaultTimerReturn = {
    status: 'idle' as const,
    elapsedMs: 0,
    remainingMs: 10 * 60 * 1000, // 10分
    durationMs: 10 * 60 * 1000,
    precisionDriftMs: 0,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    reset: vi.fn(),
    setDuration: mockSetDuration,
    testBell: vi.fn(),
    initializeAudio: vi.fn(),
    isAudioReady: false,
    isRunning: false,
    isPaused: false,
    isIdle: true,
    isFinished: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTimer.mockReturnValue(defaultTimerReturn)
  })

  describe('表示機能', () => {
    it('初期状態で正しい時間を表示する', () => {
      render(<TimeDisplay />)
      
      expect(screen.getByText('10:00')).toBeInTheDocument()
      expect(screen.getByText('クリックで時間を編集')).toBeInTheDocument()
    })

    it('残り時間を正確に計算して表示する', () => {
      // 5分経過した状態をシミュレート
      mockUseTimer.mockReturnValue({
        ...defaultTimerReturn,
        status: 'paused',
        remainingMs: 5 * 60 * 1000, // 5分残り
        isPaused: true,
        isIdle: false
      })

      render(<TimeDisplay />)
      
      expect(screen.getByText('05:00')).toBeInTheDocument()
    })

    it('実行中の状態で動的に時間を更新する', () => {
      mockUseTimer.mockReturnValue({
        ...defaultTimerReturn,
        status: 'running',
        remainingMs: 8 * 60 * 1000, // 8分残り
        isRunning: true,
        isIdle: false
      })

      render(<TimeDisplay />)
      
      expect(screen.getByText('08:00')).toBeInTheDocument()
    })

    it('完了状態で0:00を表示し、赤色になる', () => {
      mockUseTimer.mockReturnValue({
        ...defaultTimerReturn,
        status: 'finished',
        remainingMs: 0,
        isFinished: true,
        isIdle: false
      })

      render(<TimeDisplay />)
      
      const timeElement = screen.getByText('00:00')
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
      mockUseTimer.mockReturnValue({
        ...defaultTimerReturn,
        status: 'running',
        isRunning: true,
        isIdle: false
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

  describe('値変更検出ロジック', () => {
    it('編集開始時に元の値を正しく保存する', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 編集モードに入る
      await user.click(screen.getByRole('button'))
      
      // 入力フィールドに元の値が設定されていることを確認
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('10:00')
    })

    it('値が変更されていない場合はsetDurationを呼び出さない', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 編集モードに入る
      await user.click(screen.getByRole('button'))
      
      // 値を変更せずにEnterで確定
      const input = screen.getByRole('textbox')
      await user.keyboard('{Enter}')
      
      // setDurationが呼ばれていないことを確認
      expect(mockSetDuration).not.toHaveBeenCalled()
    })

    it('値が変更されていない場合はblurでもsetDurationを呼び出さない', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 編集モードに入る
      await user.click(screen.getByRole('button'))
      
      // 値を変更せずにblur
      const input = screen.getByRole('textbox')
      fireEvent.blur(input)
      
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      })
      
      // setDurationが呼ばれていないことを確認
      expect(mockSetDuration).not.toHaveBeenCalled()
    })

    it('値が変更された場合のみsetDurationを呼び出す', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 編集モードに入る
      await user.click(screen.getByRole('button'))
      
      // 値を変更
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '05:30')
      await user.keyboard('{Enter}')
      
      // setDurationが正しい値で呼ばれることを確認
      expect(mockSetDuration).toHaveBeenCalledWith(5.5 * 60 * 1000)
    })

    it('同じ値を再入力した場合はsetDurationを呼び出さない', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 編集モードに入る
      await user.click(screen.getByRole('button'))
      
      // 同じ値を再入力
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '10:00')
      await user.keyboard('{Enter}')
      
      // setDurationが呼ばれていないことを確認
      expect(mockSetDuration).not.toHaveBeenCalled()
    })

    it('空白を含む同じ値でもsetDurationを呼び出さない', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 編集モードに入る
      await user.click(screen.getByRole('button'))
      
      // 空白を含む同じ値を入力
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, ' 10:00 ')
      await user.keyboard('{Enter}')
      
      // setDurationが呼ばれていないことを確認
      expect(mockSetDuration).not.toHaveBeenCalled()
    })
  })

  describe('編集状態管理', () => {
    it('編集開始時に正しい状態を設定する', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 編集モードに入る前の状態を確認
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      
      // 編集モードに入る
      await user.click(screen.getByRole('button'))
      
      // 編集モードの状態を確認
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.getByDisplayValue('10:00')).toBeInTheDocument()
    })

    it('編集終了時に正しい状態にリセットする', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 編集モードに入る
      await user.click(screen.getByRole('button'))
      
      // 値を変更して確定
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '07:30')
      await user.keyboard('{Enter}')
      
      // 編集モードが終了していることを確認
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('キャンセル時に状態を正しくリセットする', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 編集モードに入る
      await user.click(screen.getByRole('button'))
      
      // 値を変更してからキャンセル
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '07:30')
      await user.keyboard('{Escape}')
      
      // 編集モードが終了し、元の値が表示されることを確認
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('10:00')).toBeInTheDocument()
      expect(mockSetDuration).not.toHaveBeenCalled()
    })

    it('エラー状態から正常に回復する', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 編集モードに入る
      await user.click(screen.getByRole('button'))
      
      // 無効な値を入力してエラー状態にする
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'invalid')
      
      // エラーが表示されることを確認
      expect(screen.getByText('mm:ss形式で入力してください（例：05:30）')).toBeInTheDocument()
      
      // 有効な値に修正
      await user.clear(input)
      await user.type(input, '05:30')
      
      // エラーが消えることを確認
      expect(screen.queryByText('mm:ss形式で入力してください（例：05:30）')).not.toBeInTheDocument()
      
      // 確定
      await user.keyboard('{Enter}')
      
      // 正常に編集が完了することを確認
      expect(mockSetDuration).toHaveBeenCalledWith(5.5 * 60 * 1000)
    })

    it('編集モード中にフォーカスが正しく設定される', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 編集モードに入る
      await user.click(screen.getByRole('button'))
      
      // 入力フィールドにフォーカスが当たることを確認
      const input = screen.getByRole('textbox')
      expect(input).toHaveFocus()
    })
  })

  describe('setDurationの呼び出し条件', () => {
    it('有効な新しい値の場合のみsetDurationを呼び出す', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 編集モードに入って有効な新しい値を入力
      await user.click(screen.getByRole('button'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '03:45')
      await user.keyboard('{Enter}')
      
      // setDurationが正しい値で1回だけ呼ばれることを確認
      expect(mockSetDuration).toHaveBeenCalledTimes(1)
      expect(mockSetDuration).toHaveBeenCalledWith(3.75 * 60 * 1000)
    })

    it('無効な値の場合はsetDurationを呼び出さない', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 編集モードに入って無効な値を入力
      await user.click(screen.getByRole('button'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '99:99')
      await user.keyboard('{Enter}')
      
      // setDurationが呼ばれないことを確認
      expect(mockSetDuration).not.toHaveBeenCalled()
      
      // エラーが表示され、編集モードが継続することを確認
      expect(screen.getByText('mm:ss形式で入力してください（例：05:30）')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('0の値の場合はsetDurationを呼び出さない', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 編集モードに入って0の値を入力
      await user.click(screen.getByRole('button'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '00:00')
      await user.keyboard('{Enter}')
      
      // setDurationが呼ばれないことを確認
      expect(mockSetDuration).not.toHaveBeenCalled()
      
      // エラーが表示されることを確認
      expect(screen.getByText('0より大きい時間を入力してください')).toBeInTheDocument()
    })

    it('複数回の編集で値が変更された場合のみsetDurationを呼び出す', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 1回目の編集：値を変更
      await user.click(screen.getByRole('button'))
      let input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '05:00')
      await user.keyboard('{Enter}')
      
      expect(mockSetDuration).toHaveBeenCalledTimes(1)
      expect(mockSetDuration).toHaveBeenCalledWith(5 * 60 * 1000)
      
      // 2回目の編集：値を変更しない（現在の表示時間と同じ値を入力）
      await user.click(screen.getByRole('button'))
      input = screen.getByRole('textbox')
      await user.keyboard('{Enter}') // 値を変更せずに確定
      
      // setDurationが追加で呼ばれないことを確認
      expect(mockSetDuration).toHaveBeenCalledTimes(1)
      
      // 3回目の編集：再度値を変更
      await user.click(screen.getByRole('button'))
      input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '08:30')
      await user.keyboard('{Enter}')
      
      // setDurationが再度呼ばれることを確認
      expect(mockSetDuration).toHaveBeenCalledTimes(2)
      expect(mockSetDuration).toHaveBeenLastCalledWith(8.5 * 60 * 1000)
    })

    it('blurイベントでも値変更検出が正しく動作する', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)
      
      // 編集モードに入って値を変更
      await user.click(screen.getByRole('button'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '12:15')
      
      // blurで確定
      fireEvent.blur(input)
      
      await waitFor(() => {
        expect(mockSetDuration).toHaveBeenCalledWith(12.25 * 60 * 1000)
      })
    })
  })
})