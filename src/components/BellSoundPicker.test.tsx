import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BellSoundPicker from './BellSoundPicker'

// Mock the store
const mockUpdateSettings = vi.fn()
let mockVolume = 0.7

vi.mock('../store', () => ({
  useSettings: () => ({
    volume: mockVolume
  }),
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

describe('BellSoundPicker', () => {
  beforeEach(() => {
    mockUpdateSettings.mockClear()
    mockAudioManager.setVolume.mockClear()
    mockAudioManager.initialize.mockClear()
    mockAudioManager.testSound.mockClear()
    mockAudioManager.isReady.mockReturnValue(true)
    mockVolume = 0.7 // Reset to default
  })

  it('renders volume control correctly', () => {
    render(<BellSoundPicker />)
    
    expect(screen.getByText('ベル音設定')).toBeInTheDocument()
    expect(screen.getByText('音量')).toBeInTheDocument()
    expect(screen.getByText('70%')).toBeInTheDocument()
    expect(screen.getByLabelText('音量を70%に設定')).toBeInTheDocument()
  })

  it('renders test sound button', () => {
    render(<BellSoundPicker />)
    
    expect(screen.getByLabelText('ベル音をテスト再生')).toBeInTheDocument()
    expect(screen.getByText('ベル音をテスト')).toBeInTheDocument()
  })

  it('updates volume when slider changes', () => {
    render(<BellSoundPicker />)
    
    const slider = screen.getByLabelText('音量を70%に設定')
    fireEvent.change(slider, { target: { value: '50' } })
    
    expect(mockUpdateSettings).toHaveBeenCalledWith({ volume: 0.5 })
    expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0.5)
  })

  it('plays test sound when button is clicked', async () => {
    render(<BellSoundPicker />)
    
    const testButton = screen.getByLabelText('ベル音をテスト再生')
    fireEvent.click(testButton)
    
    expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0.7)
    expect(mockAudioManager.testSound).toHaveBeenCalled()
  })

  it('shows loading state during test sound', async () => {
    mockAudioManager.testSound.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<BellSoundPicker />)
    
    const testButton = screen.getByLabelText('ベル音をテスト再生')
    fireEvent.click(testButton)
    
    expect(screen.getByText('テスト中...')).toBeInTheDocument()
    expect(testButton).toBeDisabled()
    
    await waitFor(() => {
      expect(screen.getByText('ベル音をテスト')).toBeInTheDocument()
    })
  })

  it('initializes audio manager if not ready', async () => {
    mockAudioManager.isReady.mockReturnValue(false)
    
    render(<BellSoundPicker />)
    
    const testButton = screen.getByLabelText('ベル音をテスト再生')
    fireEvent.click(testButton)
    
    await waitFor(() => {
      expect(mockAudioManager.initialize).toHaveBeenCalled()
    })
  })

  it('handles audio errors gracefully', async () => {
    mockAudioManager.testSound.mockRejectedValue(new Error('Audio context error'))
    
    render(<BellSoundPicker />)
    
    const testButton = screen.getByLabelText('ベル音をテスト再生')
    fireEvent.click(testButton)
    
    await waitFor(() => {
      expect(screen.getByText('Audio context error')).toBeInTheDocument()
    })
  })

  it('has proper accessibility attributes', () => {
    render(<BellSoundPicker />)
    
    const slider = screen.getByLabelText('音量を70%に設定')
    const volumeDisplay = screen.getByText('70%')
    
    expect(slider).toHaveAttribute('type', 'range')
    expect(slider).toHaveAttribute('min', '0')
    expect(slider).toHaveAttribute('max', '100')
    expect(volumeDisplay).toHaveAttribute('aria-live', 'polite')
  })

  it('updates volume display when slider moves', () => {
    // Update mock volume for this test
    mockVolume = 0.25
    
    render(<BellSoundPicker />)
    
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByLabelText('音量を25%に設定')).toBeInTheDocument()
  })
})