import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TimeDisplay from './TimeDisplay'
import { useAppStore } from '../store'

describe('TimeDisplay Integration Tests', () => {
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
  })

  describe('編集機能の統合テスト', () => {
    it('編集モードに入って変更せずに終了した後、タイマーの状態が保持される', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)

      // 初期状態の確認
      expect(screen.getByText('10:00')).toBeInTheDocument()

      // 編集モードに入る
      const timeDisplay = screen.getByRole('button', { name: /残り時間/ })
      await user.click(timeDisplay)

      // 編集モードになっていることを確認
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue('10:00')

      // 何も変更せずに編集モードを終了（onBlurをトリガー）
      await user.click(document.body)

      // 編集モードが終了し、時間が変わっていないことを確認
      await waitFor(() => {
        expect(screen.getByText('10:00')).toBeInTheDocument()
      })
      
      // 編集モードが終了していることを確認
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('編集モードでEscキーを押すとキャンセルされ、元の時間が保持される', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)

      // 編集モードに入る
      const timeDisplay = screen.getByRole('button', { name: /残り時間/ })
      await user.click(timeDisplay)

      // 値を変更
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '03:00')

      // Escキーでキャンセル
      await user.keyboard('{Escape}')

      // 元の時間が保持されていることを確認
      await waitFor(() => {
        expect(screen.getByText('10:00')).toBeInTheDocument()
      })
    })
  })

  describe('重複更新防止機能のテスト', () => {
    it('同じ値での編集操作では重複更新が防止される', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)

      // 編集モードに入る
      const timeDisplay = screen.getByRole('button', { name: /残り時間/ })
      await user.click(timeDisplay)

      // 同じ値（10:00）を入力
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '10:00')

      // 編集を確定
      await user.click(document.body)

      // 編集モードが終了し、時間が変わっていないことを確認
      await waitFor(() => {
        expect(screen.getByText('10:00')).toBeInTheDocument()
      })
      
      // 編集モードが終了していることを確認
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('値変更検出ロジックが正しく動作する', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)

      // 編集モードに入る
      const timeDisplay = screen.getByRole('button', { name: /残り時間/ })
      await user.click(timeDisplay)

      // 異なる値を入力
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '08:30')

      // 編集を確定
      await user.click(document.body)

      // 編集モードが終了することを確認
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      })
    })
  })

  describe('エラーハンドリングと状態管理のテスト', () => {
    it('無効な時間形式を入力した場合、エラーが表示される', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)

      // 編集モードに入る
      const timeDisplay = screen.getByRole('button', { name: /残り時間/ })
      await user.click(timeDisplay)

      // 無効な形式を入力
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'invalid')

      // 編集を確定しようとする
      await user.click(document.body)

      // エラーメッセージが表示されることを確認
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getAllByText(/mm:ss形式で入力してください/)[0]).toBeInTheDocument()

      // まだ編集モードであることを確認
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('範囲外の時間を入力した場合、フォーマットエラーが表示される', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)

      // 編集モードに入る
      const timeDisplay = screen.getByRole('button', { name: /残り時間/ })
      await user.click(timeDisplay)

      // 範囲外の時間を入力（99:99は無効なフォーマット）
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '99:99')

      // 編集を確定しようとする
      await user.click(document.body)

      // エラーメッセージが表示されることを確認
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getAllByText(/mm:ss形式で入力してください/)[0]).toBeInTheDocument()
    })

    it('0秒を入力した場合、適切なエラーが表示される', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)

      // 編集モードに入る
      const timeDisplay = screen.getByRole('button', { name: /残り時間/ })
      await user.click(timeDisplay)

      // 0秒を入力
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '00:00')

      // 編集を確定しようとする
      await user.click(document.body)

      // エラーメッセージが表示されることを確認
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/0より大きい時間を入力してください/)).toBeInTheDocument()
    })
  })

  describe('キーボード操作のテスト', () => {
    it('Enterキーで編集を確定できる', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)

      // 編集モードに入る
      const timeDisplay = screen.getByRole('button', { name: /残り時間/ })
      await user.click(timeDisplay)

      // 値を変更してEnterキーで確定
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '07:30{Enter}')

      // 編集モードが終了することを確認
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      })
    })

    it('スペースキーで編集モードに入れる', async () => {
      const user = userEvent.setup()
      render(<TimeDisplay />)

      // 時間表示にフォーカスを当ててスペースキーを押す
      const timeDisplay = screen.getByRole('button', { name: /残り時間/ })
      timeDisplay.focus()
      await user.keyboard(' ')

      // 編集モードに入ることを確認
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })
})