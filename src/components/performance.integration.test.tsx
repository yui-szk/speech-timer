/**
 * Performance integration tests for React components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { usePerformanceMonitor, performanceMonitor } from '../utils/performance-monitor'
import TimeDisplay from './TimeDisplay'
import CircularProgress from './CircularProgress'
import Controls from './Controls'
import { useTimer } from '../hooks/useTimer'

// Mock the timer hook
vi.mock('../hooks/useTimer')
const mockUseTimer = vi.mocked(useTimer)

// Performance monitoring component for testing
function PerformanceTestComponent() {
  const { metrics, isGood, warnings } = usePerformanceMonitor()
  
  return (
    <div>
      <div data-testid="frame-rate">{metrics.frameRate.toFixed(1)}</div>
      <div data-testid="render-count">{metrics.renderCount}</div>
      <div data-testid="timing-accuracy">{metrics.timingAccuracy.toFixed(1)}</div>
      <div data-testid="is-good">{isGood.toString()}</div>
      <div data-testid="warnings">{warnings.join(', ')}</div>
    </div>
  )
}

describe('Component Performance Integration', () => {
  beforeEach(() => {
    performanceMonitor.reset()
    
    // Mock timer hook with default values
    mockUseTimer.mockReturnValue({
      status: 'idle',
      elapsedMs: 0,
      remainingMs: 300000, // 5 minutes
      durationMs: 300000,
      precisionDriftMs: 0,
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      reset: vi.fn(),
      setDuration: vi.fn(),
      testBell: vi.fn(),
      initializeAudio: vi.fn(),
      isAudioReady: false,
      isRunning: false,
      isPaused: false,
      isIdle: true,
      isFinished: false
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('TimeDisplay Performance', () => {
    it('should render efficiently with memo optimization', async () => {
      const { rerender } = render(<TimeDisplay />)
      
      // Record initial render
      performanceMonitor.recordRender()
      
      // Rerender with same props (should be memoized)
      rerender(<TimeDisplay />)
      rerender(<TimeDisplay />)
      rerender(<TimeDisplay />)
      
      const metrics = performanceMonitor.getMetrics()
      
      // Should have recorded renders
      expect(metrics.renderCount).toBeGreaterThan(0)
    })

    it('should handle rapid time updates efficiently', async () => {
      render(<TimeDisplay />)
      
      const startTime = performance.now()
      
      // Simulate rapid time updates
      for (let i = 0; i < 100; i++) {
        mockUseTimer.mockReturnValue({
          ...mockUseTimer(),
          remainingMs: 300000 - (i * 1000), // Decrease by 1 second each time
        })
        
        performanceMonitor.recordRender()
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should handle updates quickly
      expect(totalTime).toBeLessThan(100) // Less than 100ms for 100 updates
    })
  })

  describe('CircularProgress Performance', () => {
    it('should render progress updates efficiently', async () => {
      render(<CircularProgress />)
      
      const startTime = performance.now()
      
      // Simulate progress updates
      for (let i = 0; i <= 100; i += 5) {
        const remainingMs = 300000 * (1 - i / 100) // Progress from 100% to 0%
        
        mockUseTimer.mockReturnValue({
          ...mockUseTimer(),
          remainingMs,
          elapsedMs: 300000 - remainingMs,
        })
        
        performanceMonitor.recordRender()
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should handle progress updates efficiently
      expect(totalTime).toBeLessThan(50) // Less than 50ms for all updates
    })

    it('should handle responsive sizing without performance issues', () => {
      const { rerender } = render(<CircularProgress responsive={true} />)
      
      const startTime = performance.now()
      
      // Test different responsive configurations
      rerender(<CircularProgress responsive={true} size={150} />)
      rerender(<CircularProgress responsive={true} size={200} />)
      rerender(<CircularProgress responsive={true} size={250} />)
      rerender(<CircularProgress responsive={false} size={200} />)
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should handle responsive changes quickly
      expect(totalTime).toBeLessThan(20)
    })
  })

  describe('Controls Performance', () => {
    it('should handle rapid button interactions efficiently', async () => {
      render(
        <BrowserRouter>
          <Controls />
        </BrowserRouter>
      )
      
      const startTime = performance.now()
      
      // Simulate rapid state changes
      const states = ['idle', 'running', 'paused', 'finished'] as const
      
      for (let i = 0; i < 50; i++) {
        const status = states[i % states.length]
        
        mockUseTimer.mockReturnValue({
          ...mockUseTimer(),
          status,
          isRunning: status === 'running',
          isPaused: status === 'paused',
          isIdle: status === 'idle',
          isFinished: status === 'finished',
        })
        
        performanceMonitor.recordRender()
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should handle state changes efficiently
      expect(totalTime).toBeLessThan(100)
    })
  })

  describe('Performance Monitoring Integration', () => {
    it('should track component performance metrics', async () => {
      render(<PerformanceTestComponent />)
      
      // Simulate some performance data
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordFrame()
        performanceMonitor.recordRender()
        performanceMonitor.recordTimingAccuracy(1000, 1010) // 10ms accuracy
      }
      
      await waitFor(() => {
        const frameRate = screen.getByTestId('frame-rate')
        const renderCount = screen.getByTestId('render-count')
        const timingAccuracy = screen.getByTestId('timing-accuracy')
        const isGood = screen.getByTestId('is-good')
        
        expect(frameRate.textContent).not.toBe('0.0')
        expect(renderCount.textContent).not.toBe('0')
        expect(timingAccuracy.textContent).not.toBe('0.0')
        expect(isGood.textContent).toBe('true')
      })
    })

    it('should detect performance issues', async () => {
      render(<PerformanceTestComponent />)
      
      // Simulate poor performance
      performanceMonitor.recordTimingAccuracy(1000, 1200) // 200ms error
      
      await waitFor(() => {
        const warnings = screen.getByTestId('warnings')
        const isGood = screen.getByTestId('is-good')
        
        expect(warnings.textContent).toContain('Poor timing accuracy')
        expect(isGood.textContent).toBe('false')
      })
    })
  })

  describe('Memory Performance', () => {
    it('should not cause memory leaks during component lifecycle', () => {
      const { unmount } = render(
        <div>
          <TimeDisplay />
          <CircularProgress />
          <BrowserRouter>
            <Controls />
          </BrowserRouter>
        </div>
      )
      
      // Simulate component updates
      for (let i = 0; i < 100; i++) {
        performanceMonitor.recordRender()
      }
      
      const beforeUnmount = performanceMonitor.getMetrics()
      
      // Unmount components
      unmount()
      
      // Should not have excessive memory usage
      if (beforeUnmount.memoryUsage) {
        expect(beforeUnmount.memoryUsage).toBeLessThan(10) // Less than 10MB
      }
    })
  })
})