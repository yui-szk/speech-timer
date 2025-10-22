import React, { useState, useRef, useEffect } from 'react'
import { formatMsToTime, parseTimeToMs, validateTimeFormat } from '../utils/time'
import { useTimerState, useTimerActions } from '../store'
import type { Millis } from '../types'

interface TimeDisplayProps {
  className?: string
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({ className = '' }) => {
  const timer = useTimerState()
  const { setDuration } = useTimerActions()
  
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 残り時間を計算
  const calculateRemainingTime = (): Millis => {
    if (timer.status === 'idle' || timer.status === 'finished') {
      return timer.durationMs
    }
    
    let elapsed = timer.pauseAccumulatedMs
    if (timer.status === 'running' && timer.startEpochMs) {
      elapsed += timer.nowEpochMs - timer.startEpochMs
    }
    
    const remaining = Math.max(0, timer.durationMs - elapsed)
    return remaining
  }

  const remainingTime = calculateRemainingTime()
  const displayTime = formatMsToTime(remainingTime)

  // 編集モードに入る
  const handleClick = () => {
    if (timer.status === 'running') return // 実行中は編集不可
    
    setIsEditing(true)
    setInputValue(displayTime)
    setError(null)
  }

  // 編集を確定
  const handleSubmit = () => {
    const trimmedValue = inputValue.trim()
    
    if (!validateTimeFormat(trimmedValue)) {
      setError('mm:ss形式で入力してください（例：05:30）')
      return
    }

    const parsedMs = parseTimeToMs(trimmedValue)
    if (parsedMs === null) {
      setError('59:59以下の時間を入力してください')
      return
    }

    if (parsedMs === 0) {
      setError('0より大きい時間を入力してください')
      return
    }

    setDuration(parsedMs)
    setIsEditing(false)
    setError(null)
  }

  // 編集をキャンセル
  const handleCancel = () => {
    setIsEditing(false)
    setInputValue('')
    setError(null)
  }

  // キーボードイベント処理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  // 入力値の変更処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // リアルタイムバリデーション
    if (value && !validateTimeFormat(value)) {
      setError('mm:ss形式で入力してください（例：05:30）')
    } else if (value && validateTimeFormat(value)) {
      const parsedMs = parseTimeToMs(value)
      if (parsedMs === null) {
        setError('59:59以下の時間を入力してください')
      } else {
        setError(null)
      }
    } else {
      setError(null)
    }
  }

  // 編集モード時にフォーカスを設定
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const baseClasses = `
    font-mono font-medium text-center transition-all duration-200
    ${className}
  `

  const displayClasses = `
    ${baseClasses}
    text-4xl sm:text-5xl md:text-6xl lg:text-7xl
    text-mint-600 cursor-pointer hover:text-mint-700
    ${timer.status === 'running' ? 'cursor-not-allowed opacity-75' : ''}
    ${timer.status === 'finished' ? 'text-red-500' : ''}
  `

  const inputClasses = `
    ${baseClasses}
    text-4xl sm:text-5xl md:text-6xl lg:text-7xl
    text-mint-600 bg-transparent border-2 border-mint-300
    rounded-lg px-4 py-2 focus:outline-none focus:border-mint-500
    focus:ring-2 focus:ring-mint-200
    ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''}
  `

  if (isEditing) {
    return (
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleSubmit}
          className={inputClasses}
          placeholder="mm:ss"
          maxLength={5}
          aria-label="時間を編集"
          aria-describedby={error ? 'time-error time-format-help' : 'time-format-help'}
          aria-invalid={error ? 'true' : 'false'}
          inputMode="numeric"
          pattern="[0-9]{1,2}:[0-5][0-9]"
        />
        {error && (
          <div 
            id="time-error"
            className="text-sm text-red-600 text-center"
            role="alert"
          >
            {error}
          </div>
        )}
        <div id="time-format-help" className="text-xs text-gray-500 text-center">
          mm:ss形式で入力してください。Enterで確定、Escでキャンセル
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div
        className={displayClasses}
        onClick={handleClick}
        role="button"
        tabIndex={timer.status === 'running' ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && timer.status !== 'running') {
            e.preventDefault()
            handleClick()
          }
        }}
        aria-label={`残り時間 ${displayTime}。クリックして編集`}
        aria-describedby="time-hint"
      >
        {displayTime}
      </div>
      <div 
        id="time-hint"
        className="text-xs text-gray-500 text-center"
      >
        {timer.status === 'running' 
          ? '実行中は編集できません' 
          : 'クリックで時間を編集'
        }
      </div>
    </div>
  )
}

export default TimeDisplay