import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LiveAnnouncer from './LiveAnnouncer'
import { useTimerState } from '../store'

// Mock the store
vi.mock('../store', () => ({
  useTimerState: vi.fn()
}))

const mockUseTimerState = vi.mocked(useTimerState)

describe('LiveAnnouncer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders aria-live regions', () => {
    mockUseTimerState.mockReturnValue({
      status: 'idle',
      durationMs: 600000, // 10 minutes
      startEpochMs: undefined,
      pauseAccumulatedMs: 0,
      nowEpochMs: Date.now()
    })

    render(<LiveAnnouncer />)
    
    // Check for aria-live regions
    const politeRegion = screen.getByRole('status')
    const assertiveRegion = screen.getByRole('alert')
    
    expect(politeRegion).toHaveAttribute('aria-live', 'polite')
    expect(politeRegion).toHaveAttribute('aria-atomic', 'true')
    expect(assertiveRegion).toHaveAttribute('aria-live', 'assertive')
    expect(assertiveRegion).toHaveAttribute('aria-atomic', 'true')
  })

  it('announces timer start', async () => {
    // Start with idle state
    mockUseTimerState.mockReturnValue({
      status: 'idle',
      durationMs: 600000, // 10 minutes
      startEpochMs: undefined,
      pauseAccumulatedMs: 0,
      nowEpochMs: Date.now()
    })

    const { rerender } = render(<LiveAnnouncer />)
    
    // Change to running state
    mockUseTimerState.mockReturnValue({
      status: 'running',
      durationMs: 600000, // 10 minutes
      startEpochMs: Date.now(),
      pauseAccumulatedMs: 0,
      nowEpochMs: Date.now()
    })

    rerender(<LiveAnnouncer />)

    await waitFor(() => {
      const politeRegion = screen.getByRole('status')
      expect(politeRegion.textContent).toContain('タイマーを開始しました')
      expect(politeRegion.textContent).toContain('10:00')
    }, { timeout: 1000 })
  })

  it('announces timer pause', async () => {
    // Start with running state
    mockUseTimerState.mockReturnValue({
      status: 'running',
      durationMs: 600000,
      startEpochMs: Date.now(),
      pauseAccumulatedMs: 0,
      nowEpochMs: Date.now()
    })

    const { rerender } = render(<LiveAnnouncer />)
    
    // Change to paused state
    mockUseTimerState.mockReturnValue({
      status: 'paused',
      durationMs: 600000,
      startEpochMs: Date.now(),
      pauseAccumulatedMs: 0,
      nowEpochMs: Date.now()
    })

    rerender(<LiveAnnouncer />)

    await waitFor(() => {
      const politeRegion = screen.getByRole('status')
      expect(politeRegion.textContent).toContain('タイマーを一時停止しました')
    }, { timeout: 1000 })
  })

  it('announces timer completion with assertive alert', async () => {
    // Start with running state
    mockUseTimerState.mockReturnValue({
      status: 'running',
      durationMs: 600000,
      startEpochMs: Date.now(),
      pauseAccumulatedMs: 0,
      nowEpochMs: Date.now()
    })

    const { rerender } = render(<LiveAnnouncer />)
    
    // Change to finished state
    mockUseTimerState.mockReturnValue({
      status: 'finished',
      durationMs: 600000,
      startEpochMs: Date.now(),
      pauseAccumulatedMs: 0,
      nowEpochMs: Date.now()
    })

    rerender(<LiveAnnouncer />)

    await waitFor(() => {
      const politeRegion = screen.getByRole('status')
      const assertiveRegion = screen.getByRole('alert')
      
      expect(politeRegion.textContent).toContain('タイマーが終了しました')
      expect(assertiveRegion.textContent).toContain('時間終了！タイマーが完了しました')
    }, { timeout: 1000 })
  })

  it('announces timer reset', async () => {
    // Start with finished state
    mockUseTimerState.mockReturnValue({
      status: 'finished',
      durationMs: 600000,
      startEpochMs: Date.now(),
      pauseAccumulatedMs: 0,
      nowEpochMs: Date.now()
    })

    const { rerender } = render(<LiveAnnouncer />)
    
    // Change to idle state (reset)
    mockUseTimerState.mockReturnValue({
      status: 'idle',
      durationMs: 600000,
      startEpochMs: undefined,
      pauseAccumulatedMs: 0,
      nowEpochMs: Date.now()
    })

    rerender(<LiveAnnouncer />)

    await waitFor(() => {
      const politeRegion = screen.getByRole('status')
      expect(politeRegion.textContent).toContain('タイマーをリセットしました')
    }, { timeout: 1000 })
  })

  it('has screen reader only styling', () => {
    mockUseTimerState.mockReturnValue({
      status: 'idle',
      durationMs: 600000,
      startEpochMs: undefined,
      pauseAccumulatedMs: 0,
      nowEpochMs: Date.now()
    })

    render(<LiveAnnouncer />)
    
    const politeRegion = screen.getByRole('status')
    const assertiveRegion = screen.getByRole('alert')
    
    expect(politeRegion).toHaveClass('sr-only')
    expect(assertiveRegion).toHaveClass('sr-only')
  })
})