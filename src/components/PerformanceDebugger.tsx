/**
 * Performance debugging component for development
 * Shows real-time performance metrics
 */

import { memo } from 'react'
import { usePerformanceMonitor } from '../utils/performance-monitor'

interface PerformanceDebuggerProps {
  enabled?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

const PerformanceDebugger = memo(({ 
  enabled = process.env.NODE_ENV === 'development',
  position = 'top-right'
}: PerformanceDebuggerProps) => {
  const { metrics, isGood, warnings } = usePerformanceMonitor()

  if (!enabled) return null

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  const getStatusColor = () => {
    if (!isGood) return 'bg-red-500'
    if (warnings.length > 0) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 bg-black bg-opacity-80 text-white text-xs p-3 rounded-lg font-mono max-w-xs`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="font-semibold">Performance Monitor</span>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={metrics.frameRate < 50 ? 'text-red-400' : 'text-green-400'}>
            {metrics.frameRate.toFixed(1)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Frame Time:</span>
          <span>{metrics.averageFrameTime.toFixed(1)}ms</span>
        </div>
        
        <div className="flex justify-between">
          <span>Timing Accuracy:</span>
          <span className={metrics.timingAccuracy > 50 ? 'text-red-400' : 'text-green-400'}>
            ±{metrics.timingAccuracy.toFixed(1)}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Renders:</span>
          <span>{metrics.renderCount}</span>
        </div>
        
        {metrics.memoryUsage && (
          <div className="flex justify-between">
            <span>Memory:</span>
            <span className={metrics.memoryUsage > 50 ? 'text-yellow-400' : 'text-green-400'}>
              {metrics.memoryUsage.toFixed(1)}MB
            </span>
          </div>
        )}
      </div>
      
      {warnings.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="text-yellow-400 font-semibold mb-1">Warnings:</div>
          {warnings.map((warning, index) => (
            <div key={index} className="text-yellow-300 text-xs">
              • {warning}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-2 pt-2 border-t border-gray-600 text-gray-400">
        Last update: {new Date(metrics.lastUpdate).toLocaleTimeString()}
      </div>
    </div>
  )
})

PerformanceDebugger.displayName = 'PerformanceDebugger'

export default PerformanceDebugger