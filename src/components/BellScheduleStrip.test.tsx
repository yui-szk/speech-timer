import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BellScheduleStrip from './BellScheduleStrip'
import { useSettings, useSettingsActions } from '../store'

// Zustandストアをモック
vi.mock('../store', () => ({
  useSettings: vi.fn(),
  useSettingsActions: vi.fn()
}))

const mockUseSettings = vi.mocked(useSettings)
const mockUseSettingsActions = vi.mocked(useSettingsActions)

describe('BellScheduleStrip', () => {
  const mockUpdateSettings = vi.fn()
  
  const defaultSettings = {
    theme: 'mint' as const,
    bellEnabled: {
      first: true,
      second: true,
      third: false
    },
    bellTimesMs: {
      first: 3 * 60 * 1000, // 3分
      second: 2 * 60 * 1000, // 2分
      third: 1 * 60 * 1000   // 1分
    },
    progressMode: 'remaining' as const,
    volume: 0.7
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSettings.mockReturnValue(defaultSettings)
    mockUseSettingsActions.mockReturnValue({
      updateSettings: mockUpdateSettings
    })
  })

  describe('基本表示', () => {
    it('ベル設定のタイトルとアイコンが表示される', () => {
      render(<BellScheduleStrip />)
      
      expect(screen.getByText('ベル設定')).toBeInTheDocument()
      expect(screen.getByText('残り時間がベル時間に到達すると音が鳴ります')).toBeInTheDocument()
    })

    it('3つのベル項目（1令、2令、3令）が表示される', () => {
      render(<BellScheduleStrip />)
      
      expect(screen.getByText('1令')).toBeInTheDocument()
      expect(screen.getByText('2令')).toBeInTheDocument()
      expect(screen.getByText('3令')).toBeInTheDocument()
    })

    it('ベル時間が正しい形式で表示される', () => {
      render(<BellScheduleStrip />)
      
      expect(screen.getByText('03:00')).toBeInTheDocument() // 1令: 3分
      expect(screen.getByText('02:00')).toBeInTheDocument() // 2令: 2分
      expect(screen.getByText('01:00')).toBeInTheDocument() // 3令: 1分
    })

    it('有効/無効状態が正しく表示される', () => {
      render(<BellScheduleStrip />)
      
      // 1令と2令は有効（スイッチがオン）
      const switches = screen.getAllByRole('switch')
      expect(switches[0]).toHaveAttribute('aria-checked', 'true') // 1令
      expect(switches[1]).toHaveAttribute('aria-checked', 'true') // 2令
      expect(switches[2]).toHaveAttribute('aria-checked', 'false') // 3令（無効）
    })
  })

  describe('トグルスイッチ機能', () => {
    it('トグルスイッチをクリックすると設定が更新される', async () => {
      const user = userEvent.setup()
      render(<BellScheduleStrip />)
      
      const firstBellSwitch = screen.getAllByRole('switch')[0]
      await user.click(firstBellSwitch)
      
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        bellEnabled: {
          first: false, // trueからfalseに変更
          second: true,
          third: false
        }
      })
    })

    it('無効なベルのトグルスイッチをクリックすると有効になる', async () => {
      const user = userEvent.setup()
      render(<BellScheduleStrip />)
      
      const thirdBellSwitch = screen.getAllByRole('switch')[2] // 3令（無効）
      await user.click(thirdBellSwitch)
      
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        bellEnabled: {
          first: true,
          second: true,
          third: true // falseからtrueに変更
        }
      })
    })

    it('適切なARIAラベルが設定されている', () => {
      render(<BellScheduleStrip />)
      
      const switches = screen.getAllByRole('switch')
      expect(switches[0]).toHaveAttribute('aria-label', '1令を無効にする') // 現在有効なので「無効にする」
      expect(switches[1]).toHaveAttribute('aria-label', '2令を無効にする')
      expect(switches[2]).toHaveAttribute('aria-label', '3令を有効にする') // 現在無効なので「有効にする」
    })
  })

  describe('時間編集機能', () => {
    it('有効なベルの時間をクリックすると編集モードに入る', async () => {
      const user = userEvent.setup()
      render(<BellScheduleStrip />)
      
      const firstBellTime = screen.getByLabelText('1令の時間 03:00。クリックして編集')
      await user.click(firstBellTime)
      
      // 編集用の入力フィールドが表示される
      expect(screen.getByDisplayValue('03:00')).toBeInTheDocument()
    })

    it('無効なベルの時間はクリックできない', async () => {
      const user = userEvent.setup()
      render(<BellScheduleStrip />)
      
      const thirdBellTime = screen.getByLabelText('3令の時間 01:00。無効')
      await user.click(thirdBellTime)
      
      // 編集モードに入らない（入力フィールドが表示されない）
      expect(screen.queryByDisplayValue('01:00')).not.toBeInTheDocument()
    })

    it('有効な時間を入力してEnterを押すと設定が更新される', async () => {
      const user = userEvent.setup()
      render(<BellScheduleStrip />)
      
      const firstBellTime = screen.getByLabelText('1令の時間 03:00。クリックして編集')
      await user.click(firstBellTime)
      
      const input = screen.getByDisplayValue('03:00')
      await user.clear(input)
      await user.type(input, '05:30')
      await user.keyboard('{Enter}')
      
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        bellTimesMs: {
          first: 5 * 60 * 1000 + 30 * 1000, // 5分30秒
          second: 2 * 60 * 1000,
          third: 1 * 60 * 1000
        }
      })
    })

    it('無効な時間形式を入力するとエラーが表示される', async () => {
      const user = userEvent.setup()
      render(<BellScheduleStrip />)
      
      const firstBellTime = screen.getByLabelText('1令の時間 03:00。クリックして編集')
      await user.click(firstBellTime)
      
      const input = screen.getByDisplayValue('03:00')
      await user.clear(input)
      await user.type(input, '99:99')
      
      await waitFor(() => {
        expect(screen.getByText('mm:ss形式で入力してください')).toBeInTheDocument()
      })
    })

    it('Escapeキーで編集をキャンセルできる', async () => {
      const user = userEvent.setup()
      render(<BellScheduleStrip />)
      
      const firstBellTime = screen.getByLabelText('1令の時間 03:00。クリックして編集')
      await user.click(firstBellTime)
      
      const input = screen.getByDisplayValue('03:00')
      await user.clear(input)
      await user.type(input, '05:30')
      await user.keyboard('{Escape}')
      
      // 編集がキャンセルされ、元の表示に戻る
      expect(screen.queryByDisplayValue('05:30')).not.toBeInTheDocument()
      expect(screen.getByText('03:00')).toBeInTheDocument()
      expect(mockUpdateSettings).not.toHaveBeenCalled()
    })

    it('フォーカスが外れると編集が確定される', async () => {
      const user = userEvent.setup()
      render(<BellScheduleStrip />)
      
      const firstBellTime = screen.getByLabelText('1令の時間 03:00。クリックして編集')
      await user.click(firstBellTime)
      
      const input = screen.getByDisplayValue('03:00')
      await user.clear(input)
      await user.type(input, '04:15')
      
      // 他の要素をクリックしてフォーカスを外す
      await user.click(screen.getByText('2令'))
      
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        bellTimesMs: {
          first: 4 * 60 * 1000 + 15 * 1000, // 4分15秒
          second: 2 * 60 * 1000,
          third: 1 * 60 * 1000
        }
      })
    })
  })

  describe('バリデーション', () => {
    it('60分以上の時間を入力するとエラーが表示される', async () => {
      const user = userEvent.setup()
      render(<BellScheduleStrip />)
      
      const firstBellTime = screen.getByLabelText('1令の時間 03:00。クリックして編集')
      await user.click(firstBellTime)
      
      const input = screen.getByDisplayValue('03:00')
      await user.clear(input)
      await user.type(input, '60:00')
      
      await waitFor(() => {
        expect(screen.getByText('59:59以下の時間を入力してください')).toBeInTheDocument()
      })
    })

    it('秒が60以上の時間を入力するとエラーが表示される', async () => {
      const user = userEvent.setup()
      render(<BellScheduleStrip />)
      
      const firstBellTime = screen.getByLabelText('1令の時間 03:00。クリックして編集')
      await user.click(firstBellTime)
      
      const input = screen.getByDisplayValue('03:00')
      await user.clear(input)
      await user.type(input, '05:60')
      
      await waitFor(() => {
        expect(screen.getByText('mm:ss形式で入力してください')).toBeInTheDocument()
      })
    })

    it('リアルタイムバリデーションが機能する', async () => {
      const user = userEvent.setup()
      render(<BellScheduleStrip />)
      
      const firstBellTime = screen.getByLabelText('1令の時間 03:00。クリックして編集')
      await user.click(firstBellTime)
      
      const input = screen.getByDisplayValue('03:00')
      await user.clear(input)
      
      // 無効な形式を入力
      await user.type(input, '5')
      await waitFor(() => {
        expect(screen.getByText('mm:ss形式で入力してください')).toBeInTheDocument()
      })
      
      // 有効な形式に修正
      await user.type(input, ':30')
      await waitFor(() => {
        expect(screen.queryByText('mm:ss形式で入力してください')).not.toBeInTheDocument()
      })
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なARIAラベルが設定されている', () => {
      render(<BellScheduleStrip />)
      
      // 時間ボタンのラベル
      expect(screen.getByLabelText('1令の時間 03:00。クリックして編集')).toBeInTheDocument()
      expect(screen.getByLabelText('2令の時間 02:00。クリックして編集')).toBeInTheDocument()
      expect(screen.getByLabelText('3令の時間 01:00。無効')).toBeInTheDocument()
    })

    it('エラーメッセージにrole="alert"が設定されている', async () => {
      const user = userEvent.setup()
      render(<BellScheduleStrip />)
      
      const firstBellTime = screen.getByLabelText('1令の時間 03:00。クリックして編集')
      await user.click(firstBellTime)
      
      const input = screen.getByDisplayValue('03:00')
      await user.clear(input)
      await user.type(input, 'invalid')
      
      await waitFor(() => {
        const errorMessage = screen.getByText('mm:ss形式で入力してください')
        expect(errorMessage).toHaveAttribute('role', 'alert')
      })
    })

    it('編集中の入力フィールドに適切なaria-describedbyが設定される', async () => {
      const user = userEvent.setup()
      render(<BellScheduleStrip />)
      
      const firstBellTime = screen.getByLabelText('1令の時間 03:00。クリックして編集')
      await user.click(firstBellTime)
      
      const input = screen.getByDisplayValue('03:00')
      await user.clear(input)
      await user.type(input, 'invalid')
      
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-describedby', 'first-error')
      })
    })
  })

  describe('視覚的インジケーター', () => {
    it('有効なベルは通常の色で表示される', () => {
      render(<BellScheduleStrip />)
      
      const firstBellLabel = screen.getByText('1令')
      expect(firstBellLabel).toHaveClass('text-gray-900')
      
      const firstBellTime = screen.getByText('03:00')
      expect(firstBellTime).toHaveClass('text-mint-600')
    })

    it('無効なベルはグレーアウトされる', () => {
      render(<BellScheduleStrip />)
      
      const thirdBellLabel = screen.getByText('3令')
      expect(thirdBellLabel).toHaveClass('text-gray-400')
      
      const thirdBellTime = screen.getByLabelText('3令の時間 01:00。無効')
      expect(thirdBellTime).toHaveClass('text-gray-400')
    })
  })
})