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
    <div className={`flex justify-between w-full ${className}`}>
      <div className="text-left">
        <div className="text-[20px] font-normal text-[#2c6975] mb-2" style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
          start
        </div>
        <div className="text-[32px] font-normal text-[#2c6975]" style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
          {startTimeText}
        </div>
      </div>
      <div className="text-left">
        <div className="text-[20px] font-normal text-[#2c6975] mb-2" style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
          now
        </div>
        <div className="text-[32px] font-normal text-[#2c6975]" style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}>
          {currentTimeText}
        </div>
      </div>
    </div>
  )
})

StartAndNowClock.displayName = 'StartAndNowClock'

export default StartAndNowClock