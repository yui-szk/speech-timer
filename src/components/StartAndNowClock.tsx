import { useEffect, useState } from 'react'
import { useTimerState } from '../store'

interface StartAndNowClockProps {
  className?: string
}

const StartAndNowClock = ({ className = '' }: StartAndNowClockProps) => {
  const timer = useTimerState()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Format time using Intl.DateTimeFormat for localization
  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date)
  }

  // Calculate start time based on timer state
  const getStartTime = (): Date | null => {
    if (!timer.startEpochMs) {
      return null
    }
    
    // Convert performance.now() timestamp to Date
    // performance.now() is relative to navigationStart, so we need to calculate the actual start time
    const performanceStart = performance.timeOrigin || (Date.now() - performance.now())
    const actualStartTime = new Date(performanceStart + timer.startEpochMs)
    
    return actualStartTime
  }

  const startTime = getStartTime()
  const startTimeText = startTime ? formatTime(startTime) : '--:--'
  const currentTimeText = formatTime(currentTime)

  return (
    <div className={`text-center ${className}`}>
      <div className="text-caption1 text-gray-500 mb-1">
        開始時刻・現在時刻
      </div>
      <div className="text-subheadline text-gray-700">
        {startTimeText} - {currentTimeText}
      </div>
    </div>
  )
}

export default StartAndNowClock