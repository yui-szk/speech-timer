import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CircularProgress } from './CircularProgress'
import type { TimerState, TimerSettings } from '../types'

// Mock the store
const mockStore = {
  timer: {
    status: 'idle' as const,
    durationMs: 10 * 60 * 1000, // 10 minutes
    startEpochMs: undefined,
    pauseAccumulatedMs: 0,
    nowEpochMs: 0
  } as TimerState,
  settings: {
    progressMode: 'remaining' as const,
    theme: 'mint' as const,
    bellEnabled: { first: true, second: true, third: true },
    bellTimesMs: { first: 180000, second: 120000, third: 60000 },
    volume: 0.7
  } as TimerSettings
}

// Mock zustand store
vi.mock('../store', () => ({
  useTimerState: () => mockStore.timer,
  useSettings: () => mockStore.settings
}))

describe('CircularProgress', () => {
  beforeEach(() => {
    // Reset mock store to default state
    mockStore.timer = {
      status: 'idle',
      durationMs: 10 * 60 * 1000, // 10 minutes
      startEpochMs: undefined,
      pauseAccumulatedMs: 0,
      nowEpochMs: 0
    }
    mockStore.settings = {
      progressMode: 'remaining',
      theme: 'mint',
      bellEnabled: { first: true, second: true, third: true },
      bellTimesMs: { first: 180000, second: 120000, third: 60000 },
      volume: 0.7
    }
  })

  it('renders circular progress bar with correct structure', () => {
    render(<CircularProgress />)
    
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('aria-label', 'Timer progress: 100%')
    
    // Should have two circles (background and progress)
    const circles = svg.querySelectorAll('circle')
    expect(circles).toHaveLength(2)
  })

  it('shows 100% progress in remaining mode when timer is idle', () => {
    mockStore.settings.progressMode = 'remaining'
    
    render(<CircularProgress />)
    
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label', 'Timer progress: 100%')
  })

  it('shows 0% progress in elapsed mode when timer is idle', () => {
    mockStore.settings.progressMode = 'elapsed'
    
    render(<CircularProgress />)
    
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label', 'Timer progress: 0%')
  })

  it('calculates correct progress in remaining mode when timer is running', () => {
    const now = performance.now()
    mockStore.timer = {
      status: 'running',
      durationMs: 10 * 60 * 1000, // 10 minutes
      startEpochMs: now - 5 * 60 * 1000, // Started 5 minutes ago
      pauseAccumulatedMs: 0,
      nowEpochMs: now
    }
    mockStore.settings.progressMode = 'remaining'
    
    render(<CircularProgress />)
    
    const svg = screen.getByRole('img')
    // 5 minutes elapsed out of 10 minutes = 50% remaining
    expect(svg).toHaveAttribute('aria-label', 'Timer progress: 50%')
  })

  it('calculates correct progress in elapsed mode when timer is running', () => {
    const now = performance.now()
    mockStore.timer = {
      status: 'running',
      durationMs: 10 * 60 * 1000, // 10 minutes
      startEpochMs: now - 3 * 60 * 1000, // Started 3 minutes ago
      pauseAccumulatedMs: 0,
      nowEpochMs: now
    }
    mockStore.settings.progressMode = 'elapsed'
    
    render(<CircularProgress />)
    
    const svg = screen.getByRole('img')
    // 3 minutes elapsed out of 10 minutes = 30% elapsed
    expect(svg).toHaveAttribute('aria-label', 'Timer progress: 30%')
  })

  it('handles paused timer correctly with accumulated pause time', () => {
    const now = performance.now()
    mockStore.timer = {
      status: 'paused',
      durationMs: 10 * 60 * 1000, // 10 minutes
      startEpochMs: undefined, // Not currently running
      pauseAccumulatedMs: 4 * 60 * 1000, // 4 minutes of accumulated time
      nowEpochMs: now
    }
    mockStore.settings.progressMode = 'remaining'
    
    render(<CircularProgress />)
    
    const svg = screen.getByRole('img')
    // 4 minutes elapsed out of 10 minutes = 60% remaining
    expect(svg).toHaveAttribute('aria-label', 'Timer progress: 60%')
  })

  it('shows 0% progress in remaining mode when timer is finished', () => {
    mockStore.timer = {
      status: 'finished',
      durationMs: 10 * 60 * 1000,
      startEpochMs: undefined,
      pauseAccumulatedMs: 10 * 60 * 1000, // Full duration elapsed
      nowEpochMs: performance.now()
    }
    mockStore.settings.progressMode = 'remaining'
    
    render(<CircularProgress />)
    
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label', 'Timer progress: 0%')
  })

  it('shows 100% progress in elapsed mode when timer is finished', () => {
    mockStore.timer = {
      status: 'finished',
      durationMs: 10 * 60 * 1000,
      startEpochMs: undefined,
      pauseAccumulatedMs: 10 * 60 * 1000, // Full duration elapsed
      nowEpochMs: performance.now()
    }
    mockStore.settings.progressMode = 'elapsed'
    
    render(<CircularProgress />)
    
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label', 'Timer progress: 100%')
  })

  it('applies correct CSS classes based on timer status', () => {
    // Test running state
    mockStore.timer.status = 'running'
    const { rerender } = render(<CircularProgress />)
    
    let progressCircle = document.querySelector('circle:last-child')
    expect(progressCircle).toHaveClass('stroke-mint-500')
    
    // Test paused state
    mockStore.timer.status = 'paused'
    rerender(<CircularProgress />)
    
    progressCircle = document.querySelector('circle:last-child')
    expect(progressCircle).toHaveClass('stroke-yellow-500')
    
    // Test finished state
    mockStore.timer.status = 'finished'
    rerender(<CircularProgress />)
    
    progressCircle = document.querySelector('circle:last-child')
    expect(progressCircle).toHaveClass('stroke-red-500')
  })

  it('accepts custom size and strokeWidth props', () => {
    render(<CircularProgress size={150} strokeWidth={10} />)
    
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('width', '150')
    expect(svg).toHaveAttribute('height', '150')
    
    const circles = svg.querySelectorAll('circle')
    circles.forEach(circle => {
      expect(circle).toHaveAttribute('stroke-width', '10')
    })
  })

  it('applies custom className', () => {
    render(<CircularProgress className="custom-class" />)
    
    const container = screen.getByRole('img').parentElement
    expect(container).toHaveClass('custom-class')
  })

  it('handles zero duration gracefully', () => {
    mockStore.timer.durationMs = 0
    
    render(<CircularProgress />)
    
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label', 'Timer progress: 0%')
  })

  it('switches progress mode correctly', () => {
    const now = performance.now()
    mockStore.timer = {
      status: 'running',
      durationMs: 10 * 60 * 1000, // 10 minutes
      startEpochMs: now - 2 * 60 * 1000, // Started 2 minutes ago
      pauseAccumulatedMs: 0,
      nowEpochMs: now
    }
    
    // Test remaining mode
    mockStore.settings.progressMode = 'remaining'
    const { rerender } = render(<CircularProgress />)
    
    let svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label', 'Timer progress: 80%') // 80% remaining
    
    // Switch to elapsed mode
    mockStore.settings.progressMode = 'elapsed'
    rerender(<CircularProgress />)
    
    svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label', 'Timer progress: 20%') // 20% elapsed
  })
})