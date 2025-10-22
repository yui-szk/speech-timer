import { useEffect, useState, memo, useMemo } from 'react'
import { timerSingleton } from '../utils/timer-singleton'
import type { TimerEngineState } from '../utils/timer-engine'

interface StartAndNowClockProps {
  className?: string
}

const StartAndNowClock = memo(({ className = '' }: StartAndNowClockProps) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [engineState, setEngineState] = useState<TimerEngineState | null>(null)

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Subscribe to timer engine state changes
  useEffect(() => {
    const updateEngineState = () => {
      setEngineState(timerSingleton.getState())
    }

    // Initial state
    updateEngineState()

    // Subscribe to changes
    const unsubscribe = timerSingleton.subscribe(updateEngineState)

    return unsubscribe
  }, [])

  // Format time using Intl.DateTimeFormat for localization - memoized for performance
  const formatter = useMemo(() => new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }), [])

  const formatTime = useMemo(() => (date: Date): string => {
    return formatter.format(date)
  }, [formatter])

  // Calculate start time from timer engine state
  const getStartTime = (): Date | null => {
    if (!engineState || !engineState.startTime) {
      return null
    }

    // Convert performance.now() timestamp to actual Date
    // performance.now() is relative to navigationStart, so we need to calculate the actual start time
    const performanceStart = performance.timeOrigin || (Date.now() - performance.now())
    const actualStartTime = new Date(performanceStart + engineState.startTime)

    return actualStartTime
  }

  const startTime = useMemo(() => getStartTime(), [engineState?.startTime])
  const startTimeText = useMemo(() => startTime ? formatTime(startTime) : '--:--', [startTime, formatTime])
  const currentTimeText = useMemo(() => formatTime(currentTime), [currentTime, formatTime])

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
})

StartAndNowClock.displayName = 'StartAndNowClock'

export default StartAndNowClock