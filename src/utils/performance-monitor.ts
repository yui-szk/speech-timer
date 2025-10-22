/**
 * Performance monitoring utilities for timer precision and frame rate tracking
 */

export interface PerformanceMetrics {
  frameRate: number
  averageFrameTime: number
  timingAccuracy: number
  memoryUsage?: number
  renderCount: number
  lastUpdate: number
}

export class PerformanceMonitor {
  private frameCount = 0
  private lastFrameTime = performance.now()
  private frameTimes: number[] = []
  private renderCount = 0
  private timingErrors: number[] = []
  private maxSamples = 60 // Keep last 60 samples (1 second at 60fps)
  
  private metrics: PerformanceMetrics = {
    frameRate: 0,
    averageFrameTime: 0,
    timingAccuracy: 0,
    renderCount: 0,
    lastUpdate: performance.now()
  }

  /**
   * Record a frame for frame rate calculation
   */
  recordFrame(): void {
    const now = performance.now()
    
    // Skip first frame as we don't have a previous time
    if (this.frameCount > 0) {
      const frameTime = now - this.lastFrameTime
      
      this.frameTimes.push(frameTime)
      if (this.frameTimes.length > this.maxSamples) {
        this.frameTimes.shift()
      }
    }
    
    this.frameCount++
    this.lastFrameTime = now
    
    this.updateMetrics()
  }

  /**
   * Record a render event
   */
  recordRender(): void {
    this.renderCount++
    this.updateMetrics()
  }

  /**
   * Record timing accuracy (expected vs actual elapsed time)
   */
  recordTimingAccuracy(expectedMs: number, actualMs: number): void {
    const error = Math.abs(expectedMs - actualMs)
    this.timingErrors.push(error)
    
    if (this.timingErrors.length > this.maxSamples) {
      this.timingErrors.shift()
    }
    
    this.updateMetrics()
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.frameCount = 0
    this.renderCount = 0
    this.frameTimes = []
    this.timingErrors = []
    this.lastFrameTime = performance.now()
    
    // Reset metrics to initial state
    this.metrics = {
      frameRate: 0,
      averageFrameTime: 0,
      timingAccuracy: 0,
      renderCount: 0,
      lastUpdate: performance.now()
    }
  }

  /**
   * Update calculated metrics
   */
  private updateMetrics(): void {
    const now = performance.now()
    
    // Calculate frame rate
    if (this.frameTimes.length > 0) {
      const averageFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length
      this.metrics.frameRate = averageFrameTime > 0 ? 1000 / averageFrameTime : 0
      this.metrics.averageFrameTime = averageFrameTime
    }
    
    // Calculate timing accuracy
    if (this.timingErrors.length > 0) {
      this.metrics.timingAccuracy = this.timingErrors.reduce((sum, error) => sum + error, 0) / this.timingErrors.length
    }
    
    // Get memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
    }
    
    this.metrics.renderCount = this.renderCount
    this.metrics.lastUpdate = now
  }

  /**
   * Check if performance is within acceptable thresholds
   */
  isPerformanceGood(): boolean {
    const metrics = this.getMetrics()
    
    // Frame rate should be close to 60fps (allow 50+ fps)
    const goodFrameRate = metrics.frameRate >= 50
    
    // Timing accuracy should be within ±50ms
    const goodTiming = metrics.timingAccuracy <= 50
    
    return goodFrameRate && goodTiming
  }

  /**
   * Get performance warnings
   */
  getWarnings(): string[] {
    const warnings: string[] = []
    const metrics = this.getMetrics()
    
    if (metrics.frameRate < 50 && metrics.frameRate > 0) {
      warnings.push(`Low frame rate: ${metrics.frameRate.toFixed(1)} fps`)
    }
    
    if (metrics.timingAccuracy > 50) {
      warnings.push(`Poor timing accuracy: ±${metrics.timingAccuracy.toFixed(1)}ms`)
    }
    
    if (metrics.memoryUsage && metrics.memoryUsage > 50) {
      warnings.push(`High memory usage: ${metrics.memoryUsage.toFixed(1)}MB`)
    }
    
    return warnings
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * React hook for performance monitoring
 */
import { useState, useEffect } from 'react'

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(performanceMonitor.getMetrics())
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics())
    }, 1000) // Update every second
    
    return () => clearInterval(interval)
  }, [])
  
  return {
    metrics,
    isGood: performanceMonitor.isPerformanceGood(),
    warnings: performanceMonitor.getWarnings(),
    reset: () => performanceMonitor.reset()
  }
}