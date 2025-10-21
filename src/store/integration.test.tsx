import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useAppStore, useTimerState, useTimerActions } from './index'

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn()
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
})

// Test component that uses the store
function TestTimerComponent() {
  const timer = useTimerState()
  const { startTimer, pauseTimer, resetTimer, setDuration } = useTimerActions()

  return (
    <div>
      <div data-testid="status">{timer.status}</div>
      <div data-testid="duration">{timer.durationMs}</div>
      <div data-testid="accumulated">{timer.pauseAccumulatedMs}</div>
      <button onClick={startTimer} data-testid="start">Start</button>
      <button onClick={pauseTimer} data-testid="pause">Pause</button>
      <button onClick={resetTimer} data-testid="reset">Reset</button>
      <button onClick={() => setDuration(5 * 60 * 1000)} data-testid="set-duration">
        Set 5min
      </button>
    </div>
  )
}

describe('Store Integration with React', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAppStore.setState({
      timer: {
        status: 'idle',
        durationMs: 10 * 60 * 1000,
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
    
    mockPerformanceNow.mockReset()
  })

  it('should render initial timer state correctly', () => {
    render(<TestTimerComponent />)
    
    expect(screen.getByTestId('status')).toHaveTextContent('idle')
    expect(screen.getByTestId('duration')).toHaveTextContent('600000') // 10 minutes in ms
    expect(screen.getByTestId('accumulated')).toHaveTextContent('0')
  })

  it('should update UI when timer actions are triggered', () => {
    const mockTime = 1000
    mockPerformanceNow.mockReturnValue(mockTime)
    
    render(<TestTimerComponent />)
    
    // Start timer
    fireEvent.click(screen.getByTestId('start'))
    expect(screen.getByTestId('status')).toHaveTextContent('running')
    
    // Pause timer
    const pauseTime = 3000
    mockPerformanceNow.mockReturnValue(pauseTime)
    fireEvent.click(screen.getByTestId('pause'))
    expect(screen.getByTestId('status')).toHaveTextContent('paused')
    expect(screen.getByTestId('accumulated')).toHaveTextContent('2000')
    
    // Reset timer
    fireEvent.click(screen.getByTestId('reset'))
    expect(screen.getByTestId('status')).toHaveTextContent('idle')
    expect(screen.getByTestId('accumulated')).toHaveTextContent('0')
  })

  it('should update duration when set duration is clicked', () => {
    render(<TestTimerComponent />)
    
    fireEvent.click(screen.getByTestId('set-duration'))
    expect(screen.getByTestId('duration')).toHaveTextContent('300000') // 5 minutes in ms
  })

  it('should maintain state across component re-renders', () => {
    const mockTime = 1000
    mockPerformanceNow.mockReturnValue(mockTime)
    
    const { rerender } = render(<TestTimerComponent />)
    
    // Start timer and set duration
    fireEvent.click(screen.getByTestId('start'))
    fireEvent.click(screen.getByTestId('set-duration'))
    
    // Re-render component
    rerender(<TestTimerComponent />)
    
    // State should be preserved
    expect(screen.getByTestId('status')).toHaveTextContent('running')
    expect(screen.getByTestId('duration')).toHaveTextContent('300000')
  })
})