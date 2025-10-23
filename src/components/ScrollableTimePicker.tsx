import React, { useState, useRef, useEffect, useCallback } from 'react'
import type { Millis } from '../types'

// スナップ機能のためのデバウンス用タイマー
let snapTimeout: number | null = null

// 時間値のバリデーション関数
const validateTimeValue = (minutes: number, seconds: number): { isValid: boolean; error: string | null } => {
  // 最小値チェック（00:01）
  if (minutes === 0 && seconds === 0) {
    return { isValid: false, error: '時間は最低1秒以上に設定してください' }
  }

  // 最大値チェック（99:59）
  if (minutes > 99) {
    return { isValid: false, error: '分は99分以下に設定してください' }
  }

  if (seconds > 59) {
    return { isValid: false, error: '秒は59秒以下に設定してください' }
  }

  // 範囲チェック
  if (minutes < 0 || seconds < 0) {
    return { isValid: false, error: '時間は正の値で設定してください' }
  }

  return { isValid: true, error: null }
}

// ミリ秒から分と秒を安全に取得する関数
const getMinutesAndSeconds = (ms: Millis): { minutes: number; seconds: number } => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.min(99, Math.floor(totalSeconds / 60))
  const seconds = Math.min(59, totalSeconds % 60)
  return { minutes, seconds }
}

interface ScrollableTimePickerProps {
  value: Millis // 現在の時間値（ミリ秒）
  onChange: (value: Millis) => void
  size: 'large' | 'medium' // メインタイマー用とステージ用のサイズ
  className?: string
  onValidationError?: (error: string | null) => void // バリデーションエラーのコールバック
}

interface NumberPickerProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  size: 'large' | 'medium'
  className?: string
}

// 個別の数字ピッカーコンポーネント
const NumberPicker: React.FC<NumberPickerProps> = ({
  value,
  onChange,
  min,
  max,
  size,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [startValue, setStartValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [lastMoveTime, setLastMoveTime] = useState(0)

  // サイズに応じたスタイル
  const sizeClasses = size === 'large'
    ? 'h-20'
    : 'h-12'

  // 表示する値のリストを生成（現在の値を中心に前後2つずつ）
  const getDisplayValues = useCallback(() => {
    const values = []
    for (let i = -2; i <= 2; i++) {
      const displayValue = value + i
      // 範囲外の値も表示するが、min/maxを超えた場合は適切に処理
      let actualValue = displayValue
      let shouldShow = true

      if (displayValue < min) {
        actualValue = min
        shouldShow = false
      } else if (displayValue > max) {
        actualValue = max
        shouldShow = false
      }

      if (shouldShow || Math.abs(i) <= 1) { // 中央付近は常に表示
        values.push({
          value: actualValue,
          offset: i,
          opacity: i === 0 ? 1 : (shouldShow ? 0.3 : 0.1) // 中央は不透明、前後は薄く表示
        })
      }
    }
    return values
  }, [value, min, max])

  // マウス/タッチ開始
  const handleStart = useCallback((clientY: number) => {
    setIsDragging(true)
    setStartY(clientY)
    setStartValue(value)
  }, [value])

  // スナップ処理
  const handleSnapToNearest = useCallback(() => {
    if (isDragging || isAnimating) return

    setIsAnimating(true)

    // 現在の値が既に整数なので、特別なスナップ処理は不要
    // ただし、アニメーション効果を提供
    setTimeout(() => {
      setIsAnimating(false)
    }, 200)
  }, [isDragging, isAnimating])

  // マウス/タッチ移動
  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return

    const now = Date.now()
    setLastMoveTime(now)

    const deltaY = startY - clientY
    const sensitivity = size === 'large' ? 25 : 18 // ピクセル単位での感度を調整
    const deltaValue = Math.round(deltaY / sensitivity)
    const newValue = Math.max(min, Math.min(max, startValue + deltaValue))

    if (newValue !== value) {
      onChange(newValue)
    }

    // スナップ用のタイマーをリセット
    if (snapTimeout) {
      clearTimeout(snapTimeout)
    }

    // 150ms後にスナップ処理を実行（連続した動きが止まった時）
    snapTimeout = setTimeout(() => {
      if (Date.now() - lastMoveTime >= 150) {
        handleSnapToNearest()
      }
    }, 150)
  }, [isDragging, startY, startValue, value, onChange, min, max, size, lastMoveTime, handleSnapToNearest])

  // マウス/タッチ終了
  const handleEnd = useCallback(() => {
    setIsDragging(false)

    // ドラッグ終了時にスナップ処理を実行
    setTimeout(() => {
      handleSnapToNearest()
    }, 50)
  }, [handleSnapToNearest])

  // マウスイベント
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientY)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientY)
  }, [handleMove])

  const handleMouseUp = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // タッチイベント
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handleStart(e.touches[0].clientY)
  }

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
    handleMove(e.touches[0].clientY)
  }, [handleMove])

  const handleTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // グローバルイベントリスナーの設定
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // コンポーネントのアンマウント時にタイマーをクリア
  useEffect(() => {
    return () => {
      if (snapTimeout) {
        clearTimeout(snapTimeout)
        snapTimeout = null
      }
    }
  }, [])

  const displayValues = getDisplayValues()

  return (
    <div
      ref={containerRef}
      className={`
        relative overflow-hidden select-none cursor-grab touch-none
        ${isDragging ? 'cursor-grabbing' : ''}
        ${isAnimating ? 'transition-transform duration-200 ease-out' : ''}
        ${sizeClasses}
        ${className}
        ${size === 'large' ? 'min-w-[80px]' : 'min-w-[48px]'}
      `}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <div className="flex flex-col items-center justify-center h-full relative">
        {displayValues.map(({ value: displayValue, offset, opacity }, index) => (
          <div
            key={`${displayValue}-${offset}-${index}`}
            className={`
              absolute font-mono font-medium text-[#2c6975] 
              transition-all duration-200 ease-out pointer-events-none
              text-center w-full
              ${size === 'large' ? 'text-[64px] leading-none' : 'text-[32px] leading-none'}
              ${isAnimating ? 'transform-gpu' : ''}
            `}
            style={{
              opacity,
              transform: `translateY(${offset * (size === 'large' ? 80 : 40)}px) ${isAnimating ? 'scale(1.02)' : 'scale(1)'
                }`,
              transition: isAnimating
                ? 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'opacity 0.15s ease-out'
            }}
          >
            {displayValue.toString().padStart(2, '0')}
          </div>
        ))}
      </div>
    </div>
  )
}

const ScrollableTimePicker: React.FC<ScrollableTimePickerProps> = ({
  value,
  onChange,
  size,
  className = '',
  onValidationError
}) => {
  const [validationError, setValidationError] = useState<string | null>(null)
  const [lastValidValue, setLastValidValue] = useState<Millis>(value)

  // ミリ秒を分と秒に安全に変換
  const { minutes, seconds } = getMinutesAndSeconds(value)

  // バリデーションエラーの通知
  useEffect(() => {
    if (onValidationError) {
      onValidationError(validationError)
    }
  }, [validationError, onValidationError])

  // 有効な値が変更された時に記録
  useEffect(() => {
    const validation = validateTimeValue(minutes, seconds)
    if (validation.isValid) {
      setLastValidValue(value)
      setValidationError(null)
    } else {
      setValidationError(validation.error)
    }
  }, [value, minutes, seconds])

  // 分の変更ハンドラー（バリデーション付き）
  const handleMinutesChange = useCallback((newMinutes: number) => {
    const newValue = (newMinutes * 60 + seconds) * 1000
    const validation = validateTimeValue(newMinutes, seconds)

    if (validation.isValid) {
      onChange(newValue)
      setValidationError(null)
    } else {
      // 無効な値の場合、一時的にエラーを表示するが値は変更しない
      setValidationError(validation.error)

      // 1秒後に前の有効な値に戻す
      setTimeout(() => {
        if (lastValidValue !== value) {
          onChange(lastValidValue)
        }
        setValidationError(null)
      }, 1000)
    }
  }, [seconds, onChange, lastValidValue, value])

  // 秒の変更ハンドラー（バリデーション付き）
  const handleSecondsChange = useCallback((newSeconds: number) => {
    const newValue = (minutes * 60 + newSeconds) * 1000
    const validation = validateTimeValue(minutes, newSeconds)

    if (validation.isValid) {
      onChange(newValue)
      setValidationError(null)
    } else {
      // 無効な値の場合、一時的にエラーを表示するが値は変更しない
      setValidationError(validation.error)

      // 1秒後に前の有効な値に戻す
      setTimeout(() => {
        if (lastValidValue !== value) {
          onChange(lastValidValue)
        }
        setValidationError(null)
      }, 1000)
    }
  }, [minutes, onChange, lastValidValue, value])

  const sizeClasses = size === 'large'
    ? 'text-[64px] gap-4'
    : 'text-[32px] gap-2'

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* 時間ピッカー */}
      <div className={`flex items-center justify-center ${sizeClasses}`}>
        {/* 分のピッカー */}
        <NumberPicker
          value={minutes}
          onChange={handleMinutesChange}
          min={0}
          max={99}
          size={size}
          className={size === 'large' ? 'w-20' : 'w-12'}
        />

        {/* コロン区切り */}
        <div className={`
          font-mono font-medium text-[#2c6975] select-none
          ${size === 'large' ? 'text-[64px]' : 'text-[32px]'}
        `}>
          :
        </div>

        {/* 秒のピッカー */}
        <NumberPicker
          value={seconds}
          onChange={handleSecondsChange}
          min={0}
          max={59}
          size={size}
          className={size === 'large' ? 'w-20' : 'w-12'}
        />
      </div>

      {/* バリデーションエラー表示 */}
      {validationError && (
        <div
          className={`
            text-red-500 text-center mt-2 transition-opacity duration-200
            ${size === 'large' ? 'text-sm' : 'text-xs'}
          `}
          role="alert"
          aria-live="polite"
        >
          {validationError}
        </div>
      )}
    </div>
  )
}

export default ScrollableTimePicker