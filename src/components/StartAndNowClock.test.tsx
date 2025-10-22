import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import StartAndNowClock from './StartAndNowClock'
import { timerSingleton } from '../utils/timer-singleton'

// Mock the timer singleton
vi.mock('../utils/timer-singleton', () => ({
  timerSingleton: {
    getState: vi.fn(),
    subscribe: vi.fn(() => vi.fn()) // Return unsubscribe function
  }
}))

const mockTimerSingleton = vi.mocked(timerSingleton)

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

    // Set default mock for timerSingleton
    mockTimerSingleton.getState.mockReturnValue({
      status: 'idle',
      durationMs: 600000,
      elapsedMs: 0,
      remainingMs: 600000,
      startTime: undefined,
      pauseAccumulatedMs: 0,
      lastUpdateTime: 1000,
      precisionDriftMs: 0
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('displays placeholder when timer is not started', () => {
    render(<StartAndNowClock />)
    
    expect(screen.getByText('開始時刻・現在時刻')).toBeInTheDocument()
    expect(screen.getByText('--:-- - 23:30')).toBeInTheDocument() // JST time
  })

  it('displays start time and current time when timer is running', () => {
    mockTimerSingleton.getState.mockReturnValue({
      status: 'running',
      durationMs: 600000,
      elapsedMs: 500,
      remainingMs: 599500,
      startTime: 500, // Started 500ms after navigation
      pauseAccumulatedMs: 0,
      lastUpdateTime: 1000,
      precisionDriftMs: 0
    })

    render(<StartAndNowClock />)
    
    // Start time should be timeOrigin + startTime = 14:29:59 + 500ms = 14:29:59 (rounded to minute)
    // Current time should be 14:30:00 (JST)
    expect(screen.getByText('23:29 - 23:30')).toBeInTheDocument()
  })

  it('handles paused timer state correctly', () => {
    mockTimerSingleton.getState.mockReturnValue({
      status: 'paused',
      durationMs: 600000,
      elapsedMs: 30000,
      remainingMs: 570000,
      startTime: undefined, // No start time when paused
      pauseAccumulatedMs: 30000,
      lastUpdateTime: 1000,
      precisionDriftMs: 0
    })

    render(<StartAndNowClock />)
    
    // Should show placeholder for start time when paused (no startTime in engine state)
    expect(screen.getByText('--:-- - 23:30')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<StartAndNowClock className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('updates when timer state changes via subscription', () => {
    let subscribeCallback: ((state: any) => void) | null = null
    
    // Mock subscribe to capture the callback
    mockTimerSingleton.subscribe.mockImplementation((callback) => {
      subscribeCallback = callback
      return vi.fn() // unsubscribe function
    })

    render(<StartAndNowClock />)
    expect(screen.getByText('--:-- - 23:30')).toBeInTheDocument()
    
    // Simulate state change via callback
    const runningState = {
      status: 'running' as const,
      durationMs: 600000,
      elapsedMs: 0,
      remainingMs: 600000,
      startTime: 1000, // Timer started at 23:30
      pauseAccumulatedMs: 0,
      lastUpdateTime: 1000,
      precisionDriftMs: 0
    }

    mockTimerSingleton.getState.mockReturnValue(runningState)
    
    // Trigger the subscription callback to simulate state change
    act(() => {
      if (subscribeCallback) {
        subscribeCallback(runningState)
      }
    })
    
    expect(screen.getByText('23:30 - 23:30')).toBeInTheDocument()
  })

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    
    const { unmount } = render(<StartAndNowClock />)
    
    unmount()
    
    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})