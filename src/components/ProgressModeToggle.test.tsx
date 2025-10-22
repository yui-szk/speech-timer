import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProgressModeToggle from './ProgressModeToggle'

// Mock the store
const mockUpdateSettings = vi.fn()

vi.mock('../store', () => ({
  useSettings: () => ({
    progressMode: 'remaining'
  }),
  useSettingsActions: () => ({
    updateSettings: mockUpdateSettings
  })
}))

describe('ProgressModeToggle', () => {
  beforeEach(() => {
    mockUpdateSettings.mockClear()
  })

  it('renders progress mode options correctly', () => {
    render(<ProgressModeToggle />)
    
    expect(screen.getByText('プログレス表示')).toBeInTheDocument()
    expect(screen.getByText('残り時間')).toBeInTheDocument()
    expect(screen.getByText('経過時間')).toBeInTheDocument()
  })

  it('shows current mode as selected', () => {
    render(<ProgressModeToggle />)
    
    const remainingButton = screen.getByLabelText('タイマーの残り時間を表示')
    const elapsedButton = screen.getByLabelText('開始からの経過時間を表示')
    
    expect(remainingButton).toHaveAttribute('aria-checked', 'true')
    expect(elapsedButton).toHaveAttribute('aria-checked', 'false')
  })

  it('calls updateSettings when mode is changed', () => {
    render(<ProgressModeToggle />)
    
    const elapsedButton = screen.getByLabelText('開始からの経過時間を表示')
    fireEvent.click(elapsedButton)
    
    expect(mockUpdateSettings).toHaveBeenCalledWith({ progressMode: 'elapsed' })
  })

  it('applies correct styling for selected mode', () => {
    render(<ProgressModeToggle />)
    
    const remainingButton = screen.getByLabelText('タイマーの残り時間を表示')
    expect(remainingButton).toHaveClass('bg-mint-500', 'text-white')
  })

  it('shows appropriate description text', () => {
    render(<ProgressModeToggle />)
    
    expect(screen.getByText('プログレスバーと表示が残り時間ベースになります')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<ProgressModeToggle />)
    
    const radioGroup = screen.getByRole('radiogroup')
    const remainingButton = screen.getByRole('radio', { name: 'タイマーの残り時間を表示' })
    const elapsedButton = screen.getByRole('radio', { name: '開始からの経過時間を表示' })
    
    expect(radioGroup).toHaveAttribute('aria-label', 'プログレス表示モード')
    expect(remainingButton).toHaveAttribute('aria-checked', 'true')
    expect(elapsedButton).toHaveAttribute('aria-checked', 'false')
  })

  it('handles keyboard navigation', () => {
    render(<ProgressModeToggle />)
    
    const elapsedButton = screen.getByLabelText('開始からの経過時間を表示')
    
    elapsedButton.focus()
    expect(elapsedButton).toHaveFocus()
    
    // Test that the button can be clicked after focusing
    fireEvent.click(elapsedButton)
    expect(mockUpdateSettings).toHaveBeenCalledWith({ progressMode: 'elapsed' })
  })
})