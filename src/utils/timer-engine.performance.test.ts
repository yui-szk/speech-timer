/**
 * Timer engine performance tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TimerEngine } from './timer-engine'
import { performanceMonitor } from './performance-monitor'

describe('TimerEngine Performance', () => {
  let engine: TimerEngine
  let mockRaf: vi.SpyInstance

  beforeEach(() => {
    performanceMonitor.reset()
    
    // Mock requestAnimationFrame
    mockRaf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      setTimeout(() => callback(performance.now()), 16) // Simulate 60fps
      return 1
    })
    
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    engine?.destroy()
    mockRaf?.mockRestore()
  })

  describe('Frame Rate Performance', () => {
    it('should maintain 60fps during timer operation', async () => {
      engine = new TimerEngine(5000) // 5 second timer
      
      let frameCount = 0
      const startTime = performance.now()
      
      engine = new TimerEngine(5000, {
        onTick: () => {
          frameCount++
          performanceMonitor.recordFrame()
        }
      })

      engine.start()
      
      // Wait for 1 second of operation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      engine.pause()
      
      const metrics = performanceMonitor.getMetrics()
      
      // Should be close to 60fps (allow some variance)
      expect(metrics.frameRate).toBeGreaterThan(50)
      expect(frameCount).toBeGreaterThan(50) // At least 50 frames in 1 second
    })

    it('should handle rapid start/pause cycles without performance degradation', async () => {
      engine = new TimerEngine(10000)
      
      const startTime = performance.now()
      
      // Rapid start/pause cycles
      for (let i = 0; i < 10; i++) {
        engine.start()
        await new Promise(resolve => setTimeout(resolve, 50))
        engine.pause()
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should complete cycles quickly (less than 2 seconds)
      expect(totalTime).toBeLessThan(2000)
    })
  })

  describe('Memory Performance', () => {
    it('should not leak memory during long operation', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      engine = new TimerEngine(60000) // 1 minute timer
      
      let tickCount = 0
      engine = new TimerEngine(60000, {
        onTick: () => {
          tickCount++
          performanceMonitor.recordFrame()
        }
      })

      engine.start()
      
      // Run for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      engine.destroy()
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be minimal (less than 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024)
      expect(tickCount).toBeGreaterThan(100) // Should have processed many ticks
    })
  })

  describe('Timing Precision Performance', () => {
    it('should maintain ±50ms precision over extended periods', async () => {
      const duration = 10000 // 10 seconds
      engine = new TimerEngine(duration)
      
      const precisionChecks: number[] = []
      
      engine = new TimerEngine(duration, {
        onTick: (state) => {
          if (state.precisionDriftMs !== undefined) {
            precisionChecks.push(state.precisionDriftMs)
          }
        }
      })

      engine.start()
      
      // Run for 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      engine.pause()
      
      // Check precision measurements
      const averageDrift = precisionChecks.reduce((sum, drift) => sum + drift, 0) / precisionChecks.length
      const maxDrift = Math.max(...precisionChecks)
      
      expect(averageDrift).toBeLessThan(50) // Average drift should be less than 50ms
      expect(maxDrift).toBeLessThan(100) // Max drift should be reasonable
      expect(precisionChecks.length).toBeGreaterThan(0) // Should have precision data
    })

    it('should handle high-frequency duration changes efficiently', () => {
      engine = new TimerEngine(5000)
      
      const startTime = performance.now()
      
      // Rapidly change duration
      for (let i = 0; i < 1000; i++) {
        engine.setDuration(5000 + (i % 100))
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should handle 1000 duration changes quickly (less than 100ms)
      expect(totalTime).toBeLessThan(100)
    })
  })

  describe('Display Update Throttling', () => {
    it('should throttle display updates to 250ms intervals', async () => {
      let displayUpdateCount = 0
      let tickCount = 0
      
      engine = new TimerEngine(5000, {
        onTick: () => {
          tickCount++
        },
        onDisplayUpdate: () => {
          displayUpdateCount++
        }
      })

      engine.start()
      
      // Run for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      engine.pause()
      
      // Should have many ticks but fewer display updates
      expect(tickCount).toBeGreaterThan(50) // ~60 ticks per second
      expect(displayUpdateCount).toBeLessThan(10) // ~4 display updates per second (250ms throttle)
      expect(displayUpdateCount).toBeGreaterThan(2) // Should have some display updates
    })
  })

  describe('Performance Monitoring Integration', () => {
    it('should provide accurate performance metrics', async () => {
      engine = new TimerEngine(5000)
      
      let tickCount = 0
      engine = new TimerEngine(5000, {
        onTick: () => {
          tickCount++
          performanceMonitor.recordFrame()
          performanceMonitor.recordRender()
        }
      })

      engine.start()
      
      // Run for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      engine.pause()
      
      const metrics = performanceMonitor.getMetrics()
      const isGood = performanceMonitor.isPerformanceGood()
      const warnings = performanceMonitor.getWarnings()
      
      expect(metrics.frameRate).toBeGreaterThanOrEqual(0)
      expect(metrics.renderCount).toBeGreaterThan(0)
      expect(typeof isGood).toBe('boolean')
      expect(Array.isArray(warnings)).toBe(true)
      expect(tickCount).toBeGreaterThan(0)
    })
  })
})