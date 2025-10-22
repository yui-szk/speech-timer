import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Settings from './Settings'

// Mock the store
const mockUpdateSettings = vi.fn()
const mockSettings = {
  theme: 'mint',
  volume: 0.7,
  progressMode: 'remaining'
}

vi.mock('../store', () => ({
  useSettings: () => mockSettings,
  useSettingsActions: () => ({
    updateSettings: mockUpdateSettings
  })
}))

// Mock audio manager
const mockAudioManager = {
  setVolume: vi.fn(),
  isReady: vi.fn(() => true),
  initialize: vi.fn(),
  testSound: vi.fn()
}

vi.mock('../utils/audio-manager', () => ({
  getAudioManager: () => mockAudioManager
}))

describe('Settings Page', () => {
  beforeEach(() => {
    mockUpdateSettings.mockClear()
    mockAudioManager.setVolume.mockClear()
    mockAudioManager.initialize.mockClear()
    mockAudioManager.testSound.mockClear()
  })

  it('renders all settings components', () => {
    render(<Settings />)
    
    // Theme picker
    expect(screen.getByText('テーマ設定')).toBeInTheDocument()
    expect(screen.getByLabelText('ミントテーマを選択')).toBeInTheDocument()
    
    // Bell sound picker
    expect(screen.getByText('ベル音設定')).toBeInTheDocument()
    expect(screen.getByText('音量')).toBeInTheDocument()
    expect(screen.getByLabelText('ベル音をテスト再生')).toBeInTheDocument()
    
    // Progress mode toggle
    expect(screen.getByText('プログレス表示')).toBeInTheDocument()
    expect(screen.getByText('残り時間')).toBeInTheDocument()
    expect(screen.getByText('経過時間')).toBeInTheDocument()
  })

  it('allows changing theme settings', () => {
    render(<Settings />)
    
    const systemThemeButton = screen.getByLabelText('システムテーマを選択')
    fireEvent.click(systemThemeButton)
    
    expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: 'system' })
  })

  it('allows adjusting volume settings', () => {
    render(<Settings />)
    
    const volumeSlider = screen.getByLabelText('音量を70%に設定')
    fireEvent.change(volumeSlider, { target: { value: '50' } })
    
    expect(mockUpdateSettings).toHaveBeenCalledWith({ volume: 0.5 })
    expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0.5)
  })

  it('allows testing bell sound', async () => {
    render(<Settings />)
    
    const testButton = screen.getByLabelText('ベル音をテスト再生')
    fireEvent.click(testButton)
    
    expect(mockAudioManager.testSound).toHaveBeenCalled()
  })

  it('allows changing progress mode', () => {
    render(<Settings />)
    
    const elapsedModeButton = screen.getByLabelText('開始からの経過時間を表示')
    fireEvent.click(elapsedModeButton)
    
    expect(mockUpdateSettings).toHaveBeenCalledWith({ progressMode: 'elapsed' })
  })

  it('reflects current settings state', () => {
    render(<Settings />)
    
    // Theme selection
    const mintButton = screen.getByLabelText('ミントテーマを選択')
    expect(mintButton).toHaveAttribute('aria-pressed', 'true')
    
    // Volume display
    expect(screen.getByText('70%')).toBeInTheDocument()
    
    // Progress mode selection
    const remainingButton = screen.getByLabelText('タイマーの残り時間を表示')
    expect(remainingButton).toHaveAttribute('aria-checked', 'true')
  })

  it('handles multiple setting changes in sequence', async () => {
    render(<Settings />)
    
    // Change theme
    const systemThemeButton = screen.getByLabelText('システムテーマを選択')
    fireEvent.click(systemThemeButton)
    
    // Change volume
    const volumeSlider = screen.getByLabelText('音量を70%に設定')
    fireEvent.change(volumeSlider, { target: { value: '80' } })
    
    // Change progress mode
    const elapsedModeButton = screen.getByLabelText('開始からの経過時間を表示')
    fireEvent.click(elapsedModeButton)
    
    expect(mockUpdateSettings).toHaveBeenCalledTimes(3)
    expect(mockUpdateSettings).toHaveBeenNthCalledWith(1, { theme: 'system' })
    expect(mockUpdateSettings).toHaveBeenNthCalledWith(2, { volume: 0.8 })
    expect(mockUpdateSettings).toHaveBeenNthCalledWith(3, { progressMode: 'elapsed' })
  })

  it('maintains accessibility throughout interactions', () => {
    render(<Settings />)
    
    // All interactive elements should be focusable
    const interactiveElements = screen.getAllByRole('button')
    interactiveElements.forEach(element => {
      element.focus()
      expect(element).toHaveFocus()
    })
    
    // Slider should be accessible
    const slider = screen.getByRole('slider')
    slider.focus()
    expect(slider).toHaveFocus()
  })
})