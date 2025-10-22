/**
 * Performance monitor tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PerformanceMonitor } from './performance-monitor'

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    monitor = new PerformanceMonitor()
    vi.clearAllMocks()
  })

  describe('Frame Rate Monitoring', () => {
    it('should record frame data', () => {
      // Record some frames
      for (let i = 0; i < 5; i++) {
        monitor.recordFrame()
      }

      const metrics = monitor.getMetrics()
      expect(metrics.frameRate).toBeGreaterThanOrEqual(0)
      expect(metrics.averageFrameTime).toBeGreaterThanOrEqual(0)
    })

    it('should detect performance issues', () => {
      // Simulate poor timing accuracy
      monitor.recordTimingAccuracy(1000, 1200) // 200ms error
      
      const isGood = monitor.isPerformanceGood()
      expect(isGood).toBe(false)
    })
  })

  describe('Timing Accuracy', () => {
    it('should track timing accuracy', () => {
      monitor.recordTimingAccuracy(1000, 1010) // 10ms error
      monitor.recordTimingAccuracy(1000, 990)  // 10ms error
      monitor.recordTimingAccuracy(1000, 1005) // 5ms error

      const metrics = monitor.getMetrics()
      expect(metrics.timingAccuracy).toBeCloseTo(8.33, 1)
    })

    it('should detect poor timing accuracy', () => {
      monitor.recordTimingAccuracy(1000, 1100) // 100ms error
      
      const metrics = monitor.getMetrics()
      expect(metrics.timingAccuracy).toBe(100)
      expect(monitor.isPerformanceGood()).toBe(false)
    })
  })

  describe('Performance Warnings', () => {
    it('should generate warnings for poor performance', () => {
      // Simulate poor timing
      monitor.recordTimingAccuracy(1000, 1100) // 100ms error

      const warnings = monitor.getWarnings()
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings[0]).toContain('timing accuracy')
    })

    it('should not generate warnings for good performance', () => {
      // Simulate good frame rate (60fps)
      const frameTime = 16.67
      for (let i = 0; i < 10; i++) {
        vi.spyOn(performance, 'now').mockReturnValue(i * frameTime)
        monitor.recordFrame()
      }

      // Simulate good timing
      monitor.recordTimingAccuracy(1000, 1010)

      const warnings = monitor.getWarnings()
      expect(warnings).toHaveLength(0)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset all metrics', () => {
      // Record some data
      let currentTime = 0
      vi.spyOn(performance, 'now').mockImplementation(() => {
        currentTime += 16.67
        return currentTime
      })
      
      monitor.recordFrame()
      monitor.recordRender()
      monitor.recordTimingAccuracy(1000, 1050)

      // Reset
      monitor.reset()

      const metrics = monitor.getMetrics()
      expect(metrics.frameRate).toBe(0)
      expect(metrics.renderCount).toBe(0)
      expect(metrics.timingAccuracy).toBe(0)
    })
  })
})