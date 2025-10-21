import React from 'react'
import { useTimerState, useSettings } from '../store'
import type { Millis } from '../types'

interface CircularProgressProps {
  /** Size of the progress circle in pixels */
  size?: number
  /** Stroke width of the progress circle */
  strokeWidth?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Circular progress bar component that displays timer progress
 * Supports both remaining time and elapsed time modes
 */
export const CircularProgress: React.FC<CircularProgressProps> = ({
  size = 200,
  strokeWidth = 8,
  className = ''
}) => {
  const timer = useTimerState()
  const settings = useSettings()

  // Calculate progress percentage based on mode
  const progressPercentage = React.useMemo(() => {
    if (timer.durationMs === 0) return 0

    const elapsed = calculateElapsedTime(timer)
    const remaining = timer.durationMs - elapsed

    if (settings.progressMode === 'elapsed') {
      // Elapsed mode: progress increases as time passes
      return Math.min(100, (elapsed / timer.durationMs) * 100)
    } else {
      // Remaining mode: progress decreases as time passes
      return Math.max(0, (remaining / timer.durationMs) * 100)
    }
  }, [timer, settings.progressMode])

  // Calculate circle properties
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference

  // Determine colors based on timer status and progress
  const getProgressColor = () => {
    if (timer.status === 'finished') {
      return 'stroke-red-500'
    }
    if (timer.status === 'paused') {
      return 'stroke-yellow-500'
    }
    return 'stroke-mint-500'
  }

  const getBackgroundColor = () => {
    return 'stroke-gray-200'
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="img"
        aria-label={`Timer progress: ${Math.round(progressPercentage)}%`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={getBackgroundColor()}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`${getProgressColor()} transition-all duration-300 ease-out`}
          style={{
            transformOrigin: 'center',
          }}
        />
      </svg>
      
      {/* Progress percentage text (optional, can be hidden) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-medium text-gray-600 sr-only">
          {Math.round(progressPercentage)}%
        </span>
      </div>
    </div>
  )
}

/**
 * Calculate elapsed time from timer state
 */
function calculateElapsedTime(timer: typeof useTimerState extends () => infer T ? T : never): Millis {
  if (timer.status === 'idle') {
    return 0
  }

  if (timer.status === 'finished') {
    return timer.durationMs
  }

  // For running and paused states
  const sessionElapsed = timer.startEpochMs 
    ? timer.nowEpochMs - timer.startEpochMs 
    : 0

  const totalElapsed = timer.pauseAccumulatedMs + sessionElapsed
  
  return Math.min(totalElapsed, timer.durationMs)
}

export default CircularProgress