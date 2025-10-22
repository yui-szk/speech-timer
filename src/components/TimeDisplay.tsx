import React, { useState, useRef, useEffect } from 'react'
import { formatMsToTime, parseTimeToMs } from '../utils/time'
import { validateAndParse } from '../utils/validation'
import { useTimer } from '../hooks/useTimer'


interface TimeDisplayProps {
  className?: string
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({ className = '' }) => {
  const { status, remainingMs, setDuration } = useTimer()
  
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [originalValue, setOriginalValue] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)



  // 残り時間の表示
  const displayTime = formatMsToTime(remainingMs)

  // 値の変更を検出する関数
  const hasValueChanged = (original: string, current: string): boolean => {
    const originalMs = parseTimeToMs(original.trim())
    const currentMs = parseTimeToMs(current.trim())
    
    // 両方とも有効な値の場合のみ比較
    if (originalMs !== null && currentMs !== null) {
      return originalMs !== currentMs
    }
    
    // どちらかが無効な場合は、文字列として比較
    return original.trim() !== current.trim()
  }

  // 編集モードに入る
  const handleClick = () => {
    if (status === 'running') return // 実行中は編集不可
    
    setIsEditing(true)
    setInputValue(displayTime)
    setOriginalValue(displayTime) // 編集開始時の元の値を保存
    setHasChanges(false) // 編集開始時は変更なし
    setError(null)
  }

  // 編集を確定
  const handleSubmit = () => {
    // バリデーションを実行
    const validationResult = validateAndParse(inputValue)
    
    if (!validationResult.isValid) {
      setError(validationResult.error)
      return
    }

    // 値変更検出（バリデーション成功後に実行）
    if (hasChanges && hasValueChanged(originalValue, inputValue.trim())) {
      setDuration(validationResult.parsedValue!)
    }
    
    setIsEditing(false)
    setHasChanges(false)
    setError(null)
  }

  // 編集をキャンセル
  const handleCancel = () => {
    setIsEditing(false)
    setInputValue('')
    setOriginalValue('')
    setHasChanges(false)
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
    
    // 値変更検出（バリデーションとは独立して実行）
    setHasChanges(hasValueChanged(originalValue, value))
    
    // リアルタイムバリデーション（空の値の場合はエラーをクリア）
    if (!value.trim()) {
      setError(null)
    } else {
      const validationResult = validateAndParse(value)
      setError(validationResult.error)
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
    ${status === 'running' ? 'cursor-not-allowed opacity-75' : ''}
    ${status === 'finished' ? 'text-red-500' : ''}
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
        tabIndex={status === 'running' ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && status !== 'running') {
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
        {status === 'running' 
          ? '実行中は編集できません' 
          : 'クリックで時間を編集'
        }
      </div>
    </div>
  )
}

export default TimeDisplay