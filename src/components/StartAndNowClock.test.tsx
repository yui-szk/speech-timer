import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import StartAndNowClock from './StartAndNowClock'
import { useTimerState } from '../store'

// Mock the store
vi.mock('../store', () => ({
  useTimerState: vi.fn()
}))

const mockUseTimerState = vi.mocked(useTimerState)

describe('StartAndNowClock', () => {
  beforeEach(() => {
    // Mock Date.now() to return a consistent time
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T14:30:00.000Z'))
    
    // Mock performance.now() and performance.timeOrigin
    Object.defineProperty(performance, 'now', {
      writable: true,
      value: vi.fn(() => 1000) // 1 second after navigation start
    })
    Object.defineProperty(performance, 'timeOrigin', {
      writable: true,
      value: new Date('2024-01-15T14:29:59.000Z').getTime() // Navigation started 1 second ago
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('displays placeholder when timer is not started', () => {
    mockUseTimerState.mockReturnValue({
      status: 'idle',
      durationMs: 600000,
      startEpochMs: undefined,
      pauseAccumulatedMs: 0,
      nowEpochMs: 1000
    })

    render(<StartAndNowClock />)
    
    expect(screen.getByText('開始時刻・現在時刻')).toBeInTheDocument()
    expect(screen.getByText('--:-- - 23:30')).toBeInTheDocument() // JST time
  })

  it('displays start time and current time when timer is running', () => {
    mockUseTimerState.mockReturnValue({
      status: 'running',
      durationMs: 600000,
      startEpochMs: 500, // Started 500ms after navigation
      pauseAccumulatedMs: 0,
      nowEpochMs: 1000
    })

    render(<StartAndNowClock />)
    
    // Start time should be 14:29:59 + 500ms = 14:29:59 (rounded to minute)
    // Current time should be 14:30:00 (JST)
    expect(screen.getByText('23:29 - 23:30')).toBeInTheDocument()
  })

  it('updates current time every second', async () => {
    mockUseTimerState.mockReturnValue({
      status: 'running',
      durationMs: 600000,
      startEpochMs: 500,
      pauseAccumulatedMs: 0,
      nowEpochMs: 1000
    })

    render(<StartAndNowClock />)
    
    // Initial time
    expect(screen.getByText('23:29 - 23:30')).toBeInTheDocument()
    
    // Advance time by 1 minute
    act(() => {
      vi.advanceTimersByTime(60000)
    })
    
    // Current time should update
    expect(screen.getByText('23:29 - 23:31')).toBeInTheDocument()
  })

  it('formats time using Japanese locale', () => {
    mockUseTimerState.mockReturnValue({
      status: 'running',
      durationMs: 600000,
      startEpochMs: 500,
      pauseAccumulatedMs: 0,
      nowEpochMs: 1000
    })

    render(<StartAndNowClock />)
    
    // Should use 24-hour format (Japanese locale)
    const timeDisplay = screen.getByText(/\d{2}:\d{2} - \d{2}:\d{2}/)
    expect(timeDisplay).toBeInTheDocument()
    
    // Should not contain AM/PM indicators
    expect(screen.queryByText(/AM|PM/)).not.toBeInTheDocument()
  })

  it('handles paused timer state correctly', () => {
    mockUseTimerState.mockReturnValue({
      status: 'paused',
      durationMs: 600000,
      startEpochMs: undefined, // No start time when paused
      pauseAccumulatedMs: 30000,
      nowEpochMs: 1000
    })

    render(<StartAndNowClock />)
    
    // Should show placeholder for start time when paused
    expect(screen.getByText('--:-- - 23:30')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    mockUseTimerState.mockReturnValue({
      status: 'idle',
      durationMs: 600000,
      startEpochMs: undefined,
      pauseAccumulatedMs: 0,
      nowEpochMs: 1000
    })

    const { container } = render(<StartAndNowClock className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('calculates start time correctly with different performance timestamps', () => {
    // Mock different performance values
    vi.mocked(performance.now).mockReturnValue(2500) // 2.5 seconds after navigation
    
    mockUseTimerState.mockReturnValue({
      status: 'running',
      durationMs: 600000,
      startEpochMs: 1500, // Started 1.5 seconds after navigation
      pauseAccumulatedMs: 0,
      nowEpochMs: 2500
    })

    render(<StartAndNowClock />)
    
    // Start time should be timeOrigin + startEpochMs
    // = 2024-01-15T14:29:59.000Z + 1500ms = 2024-01-15T14:30:00.500Z
    // Formatted as 23:30 in JST
    expect(screen.getByText('23:30 - 23:30')).toBeInTheDocument()
  })

  it('handles missing performance.timeOrigin gracefully', () => {
    // Remove timeOrigin to test fallback
    Object.defineProperty(performance, 'timeOrigin', {
      writable: true,
      value: undefined
    })
    
    mockUseTimerState.mockReturnValue({
      status: 'running',
      durationMs: 600000,
      startEpochMs: 1000,
      pauseAccumulatedMs: 0,
      nowEpochMs: 1000
    })

    render(<StartAndNowClock />)
    
    // Should still render without crashing
    expect(screen.getByText('開始時刻・現在時刻')).toBeInTheDocument()
    expect(screen.getByText(/\d{2}:\d{2} - \d{2}:\d{2}/)).toBeInTheDocument()
  })

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    
    mockUseTimerState.mockReturnValue({
      status: 'idle',
      durationMs: 600000,
      startEpochMs: undefined,
      pauseAccumulatedMs: 0,
      nowEpochMs: 1000
    })

    const { unmount } = render(<StartAndNowClock />)
    
    unmount()
    
    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})