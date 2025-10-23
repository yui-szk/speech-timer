import React, { memo, useMemo } from 'react'
import { useTimer } from '../hooks/useTimer'
import type { Millis } from '../types'

interface CircularProgressProps {
  /** Size of the progress circle in pixels */
  size?: number
  /** Stroke width of the progress circle */
  strokeWidth?: number
  /** Additional CSS classes */
  className?: string
  /** Enable responsive sizing */
  responsive?: boolean
}



/**
 * Circular progress bar component that displays timer progress
 * Shows remaining time as a colored circle that decreases clockwise
 */
export const CircularProgress: React.FC<CircularProgressProps> = memo(({
  size = 200,
  strokeWidth = 8,
  className = '',
  responsive = true
}) => {
  const timer = useTimer()

  // Calculate remaining time percentage
  const remainingPercentage = useMemo(() => {
    if (timer.durationMs === 0) return 100

    return Math.max(0, (timer.remainingMs / timer.durationMs) * 100)
  }, [timer.remainingMs, timer.durationMs])

  // Calculate circle properties
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  
  // Calculate stroke dash offset for remaining time (clockwise from top)
  // For clockwise: offset should be 0 when full (100%), circumference when empty (0%)
  const strokeDasharray = circumference
  const strokeDashoffset = circumference * (1 - remainingPercentage / 100)

  // Determine colors based on timer status - matching the design
  const getProgressColor = () => {
    if (timer.status === 'finished') {
      return 'stroke-red-500'
    }
    if (timer.status === 'paused') {
      return 'stroke-yellow-500'
    }
    return 'stroke-[#a6d5cd]' // Mint green color matching the design
  }

  const getBackgroundColor = () => {
    return 'stroke-gray-300' // Slightly darker for better visibility
  }

  const containerClasses = responsive 
    ? `relative inline-flex items-center justify-center w-48 h-48 xs:w-52 xs:h-52 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 ${className}`
    : `relative inline-flex items-center justify-center ${className}`

  const svgClasses = responsive
    ? "w-full h-full transform -rotate-90"
    : "transform -rotate-90"

  return (
    <div className={containerClasses}>
      <svg
        width={responsive ? undefined : size}
        height={responsive ? undefined : size}
        viewBox={responsive ? `0 0 ${size} ${size}` : undefined}
        className={svgClasses}
        role="img"
        aria-label={`タイマー進行状況: 残り${Math.round(remainingPercentage)}%`}
      >
        {/* Background circle (light gray) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-gray-200"
        />
        
        {/* Progress circle (colored, decreases clockwise) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`${getProgressColor()} transition-all duration-300 ease-linear`}
          style={{
            transformOrigin: 'center',
          }}
        />
      </svg>
      
      {/* Progress percentage text for screen readers */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-medium text-gray-600 sr-only">
          残り時間: {Math.round(remainingPercentage)}%
        </span>
      </div>
    </div>
  )
})

CircularProgress.displayName = 'CircularProgress'

export default CircularProgress