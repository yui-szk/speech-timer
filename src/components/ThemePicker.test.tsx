import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import ThemePicker from './ThemePicker'

// Mock the store
const mockUpdateSettings = vi.fn()

vi.mock('../store', () => ({
  useSettings: () => ({
    theme: 'mint'
  }),
  useSettingsActions: () => ({
    updateSettings: mockUpdateSettings
  })
}))

describe('ThemePicker', () => {
  beforeEach(() => {
    mockUpdateSettings.mockClear()
  })

  it('renders theme options correctly', () => {
    render(<ThemePicker />)
    
    expect(screen.getByText('テーマ設定')).toBeInTheDocument()
    expect(screen.getByLabelText('ミントテーマを選択')).toBeInTheDocument()
    expect(screen.getByLabelText('システムテーマを選択')).toBeInTheDocument()
  })

  it('shows current theme as selected', () => {
    render(<ThemePicker />)
    
    const mintButton = screen.getByLabelText('ミントテーマを選択')
    const systemButton = screen.getByLabelText('システムテーマを選択')
    
    expect(mintButton).toHaveAttribute('aria-pressed', 'true')
    expect(systemButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls updateSettings when theme is changed', () => {
    render(<ThemePicker />)
    
    const systemButton = screen.getByLabelText('システムテーマを選択')
    fireEvent.click(systemButton)
    
    expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: 'system' })
  })

  it('applies correct styling for selected theme', () => {
    render(<ThemePicker />)
    
    const mintButton = screen.getByLabelText('ミントテーマを選択')
    expect(mintButton).toHaveClass('bg-mint-100', 'border-mint-500')
  })

  it('has proper accessibility attributes', () => {
    render(<ThemePicker />)
    
    const mintButton = screen.getByLabelText('ミントテーマを選択')
    const systemButton = screen.getByLabelText('システムテーマを選択')
    
    expect(mintButton).toHaveAttribute('aria-pressed')
    expect(systemButton).toHaveAttribute('aria-pressed')
  })

  it('handles keyboard navigation', () => {
    render(<ThemePicker />)
    
    const mintButton = screen.getByLabelText('ミントテーマを選択')
    
    mintButton.focus()
    expect(mintButton).toHaveFocus()
    
    // Test that the button can be clicked after focusing
    fireEvent.click(mintButton)
    expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: 'mint' })
  })
})