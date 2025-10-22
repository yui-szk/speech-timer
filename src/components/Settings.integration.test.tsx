import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Settings from '../pages/Settings'
import { useAppStore } from '../store'

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

// Helper to render Settings with router
const renderSettings = () => {
  return render(
    <BrowserRouter>
      <Settings />
    </BrowserRouter>
  )
}

describe('Settings Integration', () => {
  beforeEach(() => {
    // Reset store to default state
    useAppStore.setState({
      settings: {
        theme: 'mint',
        bellEnabled: { first: true, second: true, third: true },
        bellTimesMs: { first: 180000, second: 120000, third: 60000 },
        progressMode: 'remaining',
        volume: 0.7
      }
    })
    
    mockAudioManager.setVolume.mockClear()
    mockAudioManager.initialize.mockClear()
    mockAudioManager.testSound.mockClear()
  })

  it('reflects current store state correctly', () => {
    renderSettings()
    
    // Theme selection
    const mintButton = screen.getByLabelText('ミントテーマを選択')
    expect(mintButton).toHaveAttribute('aria-pressed', 'true')
    
    // Volume display
    expect(screen.getByText('70%')).toBeInTheDocument()
    
    // Progress mode selection
    const remainingButton = screen.getByLabelText('タイマーの残り時間を表示')
    expect(remainingButton).toHaveAttribute('aria-checked', 'true')
  })

  it('updates store when settings are changed', () => {
    renderSettings()
    
    // Change theme
    const systemThemeButton = screen.getByLabelText('システムテーマを選択')
    fireEvent.click(systemThemeButton)
    
    // Change volume
    const volumeSlider = screen.getByLabelText('音量を70%に設定')
    fireEvent.change(volumeSlider, { target: { value: '50' } })
    
    // Change progress mode
    const elapsedModeButton = screen.getByLabelText('開始からの経過時間を表示')
    fireEvent.click(elapsedModeButton)
    
    // Verify store updates
    const state = useAppStore.getState()
    expect(state.settings.theme).toBe('system')
    expect(state.settings.volume).toBe(0.5)
    expect(state.settings.progressMode).toBe('elapsed')
  })

  it('updates audio manager volume when volume changes', () => {
    renderSettings()
    
    const volumeSlider = screen.getByLabelText('音量を70%に設定')
    fireEvent.change(volumeSlider, { target: { value: '80' } })
    
    expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0.8)
  })

  it('allows testing bell sound', async () => {
    renderSettings()
    
    const testButton = screen.getByLabelText('ベル音をテスト再生')
    fireEvent.click(testButton)
    
    await waitFor(() => {
      expect(mockAudioManager.testSound).toHaveBeenCalled()
    })
  })

  it('shows loading state during bell test', async () => {
    mockAudioManager.testSound.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )
    
    renderSettings()
    
    const testButton = screen.getByLabelText('ベル音をテスト再生')
    fireEvent.click(testButton)
    
    expect(screen.getByText('テスト中...')).toBeInTheDocument()
    expect(testButton).toBeDisabled()
    
    await waitFor(() => {
      expect(screen.getByText('ベル音をテスト')).toBeInTheDocument()
    })
  })

  it('handles audio errors gracefully', async () => {
    mockAudioManager.testSound.mockRejectedValue(new Error('Audio context suspended'))
    
    renderSettings()
    
    const testButton = screen.getByLabelText('ベル音をテスト再生')
    fireEvent.click(testButton)
    
    await waitFor(() => {
      expect(screen.getByText('Audio context suspended')).toBeInTheDocument()
    })
  })

  it('maintains settings state across multiple changes', () => {
    renderSettings()
    
    // Make multiple changes
    const systemThemeButton = screen.getByLabelText('システムテーマを選択')
    fireEvent.click(systemThemeButton)
    
    const volumeSlider = screen.getByLabelText('音量を70%に設定')
    fireEvent.change(volumeSlider, { target: { value: '25' } })
    
    const elapsedModeButton = screen.getByLabelText('開始からの経過時間を表示')
    fireEvent.click(elapsedModeButton)
    
    // Verify all changes are reflected
    const state = useAppStore.getState()
    expect(state.settings).toEqual({
      theme: 'system',
      bellEnabled: { first: true, second: true, third: true },
      bellTimesMs: { first: 180000, second: 120000, third: 60000 },
      progressMode: 'elapsed',
      volume: 0.25
    })
  })

  it('updates UI immediately when settings change', () => {
    renderSettings()
    
    // Change theme and verify UI updates
    const systemThemeButton = screen.getByLabelText('システムテーマを選択')
    fireEvent.click(systemThemeButton)
    
    expect(systemThemeButton).toHaveAttribute('aria-pressed', 'true')
    const mintButton = screen.getByLabelText('ミントテーマを選択')
    expect(mintButton).toHaveAttribute('aria-pressed', 'false')
    
    // Change progress mode and verify description updates
    const elapsedModeButton = screen.getByLabelText('開始からの経過時間を表示')
    fireEvent.click(elapsedModeButton)
    
    expect(screen.getByText('プログレスバーと表示が経過時間ベースになります')).toBeInTheDocument()
  })
})