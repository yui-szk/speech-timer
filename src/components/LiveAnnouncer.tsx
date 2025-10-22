import React, { useEffect, useRef } from 'react'
import { useTimerState } from '../store'
import { formatMsToTime } from '../utils/time'

interface LiveAnnouncerProps {
  className?: string
}

/**
 * LiveAnnouncer component provides screen reader announcements for timer state changes
 * Uses aria-live regions to announce important timer events
 */
const LiveAnnouncer: React.FC<LiveAnnouncerProps> = ({ className = '' }) => {
  const timer = useTimerState()
  const previousStatusRef = useRef(timer.status)
  const announcementRef = useRef<HTMLDivElement>(null)
  const lastAnnouncementRef = useRef<string>('')

  // Announce timer state changes
  useEffect(() => {
    const previousStatus = previousStatusRef.current
    const currentStatus = timer.status
    
    let announcement = ''
    
    // Announce status changes
    if (previousStatus !== currentStatus) {
      switch (currentStatus) {
        case 'running':
          if (previousStatus === 'idle') {
            announcement = `タイマーを開始しました。設定時間は${formatMsToTime(timer.durationMs)}です。`
          } else if (previousStatus === 'paused') {
            announcement = 'タイマーを再開しました。'
          }
          break
        case 'paused':
          announcement = 'タイマーを一時停止しました。'
          break
        case 'finished':
          announcement = 'タイマーが終了しました。時間になりました。'
          break
        case 'idle':
          if (previousStatus === 'finished' || previousStatus === 'paused' || previousStatus === 'running') {
            announcement = 'タイマーをリセットしました。'
          }
          break
      }
    }

    // Only announce if there's a new message and it's different from the last one
    if (announcement && announcement !== lastAnnouncementRef.current) {
      lastAnnouncementRef.current = announcement
      
      // Use a slight delay to ensure the announcement is picked up by screen readers
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = announcement
          
          // Clear the announcement after a delay to allow for repeated announcements
          setTimeout(() => {
            if (announcementRef.current) {
              announcementRef.current.textContent = ''
            }
          }, 1000)
        }
      }, 100)
    }

    previousStatusRef.current = currentStatus
  }, [timer.status, timer.durationMs])

  // Announce time milestones (every minute when running)
  useEffect(() => {
    if (timer.status !== 'running') return

    let elapsed = timer.pauseAccumulatedMs
    if (timer.startEpochMs) {
      elapsed += timer.nowEpochMs - timer.startEpochMs
    }
    
    const remaining = Math.max(0, timer.durationMs - elapsed)
    const remainingMinutes = Math.floor(remaining / (60 * 1000))
    const remainingSeconds = Math.floor((remaining % (60 * 1000)) / 1000)
    
    // Announce at specific time milestones
    const shouldAnnounce = (
      // Every minute mark
      (remainingSeconds === 0 && remainingMinutes > 0 && remainingMinutes <= 10) ||
      // Last 30 seconds
      (remainingMinutes === 0 && remainingSeconds === 30) ||
      // Last 10 seconds
      (remainingMinutes === 0 && remainingSeconds <= 10 && remainingSeconds > 0)
    )

    if (shouldAnnounce) {
      const timeAnnouncement = `残り時間${formatMsToTime(remaining)}`
      
      if (timeAnnouncement !== lastAnnouncementRef.current) {
        lastAnnouncementRef.current = timeAnnouncement
        
        setTimeout(() => {
          if (announcementRef.current) {
            announcementRef.current.textContent = timeAnnouncement
            
            setTimeout(() => {
              if (announcementRef.current) {
                announcementRef.current.textContent = ''
              }
            }, 1000)
          }
        }, 100)
      }
    }
  }, [timer.status, timer.nowEpochMs, timer.startEpochMs, timer.pauseAccumulatedMs, timer.durationMs])

  return (
    <div className={className}>
      {/* Polite announcements for general updates */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
      
      {/* Assertive announcements for urgent updates (timer finished) */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      >
        {timer.status === 'finished' ? '時間終了！タイマーが完了しました。' : ''}
      </div>
    </div>
  )
}

export default LiveAnnouncer