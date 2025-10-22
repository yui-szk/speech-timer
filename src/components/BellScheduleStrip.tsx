import React, { useState, useRef, useEffect, memo, useCallback } from 'react'
import { formatMsToTime, parseTimeToMs, validateTimeFormat } from '../utils/time'
import { useSettings, useSettingsActions } from '../store'
import type { Millis } from '../types'

interface BellScheduleStripProps {
  className?: string
}

type BellType = 'first' | 'second' | 'third'

interface BellItemProps {
  type: BellType
  label: string
  timeMs: Millis
  enabled: boolean
  onTimeChange: (type: BellType, timeMs: Millis) => void
  onToggle: (type: BellType, enabled: boolean) => void
}

const BellItem: React.FC<BellItemProps> = memo(({
  type,
  label,
  timeMs,
  enabled,
  onTimeChange,
  onToggle
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayTime = formatMsToTime(timeMs)

  // 編集モードに入る
  const handleTimeClick = () => {
    if (!enabled) return // 無効時は編集不可
    
    setIsEditing(true)
    setInputValue(displayTime)
    setError(null)
  }

  // 編集を確定
  const handleSubmit = () => {
    const trimmedValue = inputValue.trim()
    
    // まず基本的な形式をチェック（正規表現のみ）
    const timeRegex = /^(\d{1,2}):([0-5]\d)$/
    if (!timeRegex.test(trimmedValue)) {
      setError('mm:ss形式で入力してください')
      return
    }

    // 形式は正しいが、範囲をチェック
    const [minutes] = trimmedValue.split(':').map(Number)
    if (minutes > 59) {
      setError('59:59以下の時間を入力してください')
      return
    }

    const parsedMs = parseTimeToMs(trimmedValue)
    if (parsedMs === null) {
      setError('59:59以下の時間を入力してください')
      return
    }

    onTimeChange(type, parsedMs)
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
    if (value) {
      // まず基本的な形式をチェック（正規表現のみ）
      const timeRegex = /^(\d{1,2}):([0-5]\d)$/
      if (!timeRegex.test(value)) {
        setError('mm:ss形式で入力してください')
      } else {
        // 形式は正しいが、範囲をチェック
        const [minutes] = value.split(':').map(Number)
        if (minutes > 59) {
          setError('59:59以下の時間を入力してください')
        } else {
          setError(null)
        }
      }
    } else {
      setError(null)
    }
  }

  // トグルスイッチの処理
  const handleToggle = () => {
    onToggle(type, !enabled)
  }

  // 編集モード時にフォーカスを設定
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  return (
    <div className="flex items-center justify-between w-full h-[50px]">
      {/* 時間表示・編集 */}
      <div className="flex-shrink-0">
        {isEditing ? (
          <div className="space-y-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleSubmit}
              className={`
                font-normal text-[32px] text-[#2c6975] text-center bg-transparent border border-mint-300
                rounded px-2 py-1 w-20 focus:outline-none focus:border-mint-500
                focus:ring-1 focus:ring-mint-200
                ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''}
              `}
              placeholder="mm:ss"
              maxLength={5}
              aria-label={`${label}の時間を編集`}
              aria-describedby={error ? `${type}-error` : undefined}
              style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
            />
            {error && (
              <div 
                id={`${type}-error`}
                className="text-xs text-red-600 text-center"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleTimeClick}
            disabled={!enabled}
            className={`
              font-normal text-[32px] px-2 py-1 rounded transition-colors focus-ring text-[#2c6975]
              ${enabled 
                ? 'hover:opacity-80 cursor-pointer' 
                : 'opacity-50 cursor-not-allowed'
              }
            `}
            aria-label={`${label}の時間 ${displayTime}${enabled ? '。クリックして編集' : '。無効'}`}
            style={{ fontVariationSettings: "'CTGR' 0, 'wdth' 100" }}
          >
            {displayTime}
          </button>
        )}
      </div>

      {/* ベルアイコン */}
      <button
        onClick={handleToggle}
        className={`
          w-8 h-8 flex items-center justify-center rounded transition-colors focus-ring
          ${enabled ? 'text-yellow-500 hover:bg-yellow-50' : 'text-gray-400 hover:bg-gray-50'}
        `}
        role="switch"
        aria-checked={enabled}
        aria-label={`${label}を${enabled ? '無効' : '有効'}にする`}
        aria-describedby={`${type}-switch-help`}
      >
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 10.5C21 10.5 20.75 10.75 20.5 11C20.25 11.25 20 11.5 20 11.5V12.5C20 12.5 20.25 12.75 20.5 13C20.75 13.25 21 13.5 21 13.5C21.3 13.4 21.5 13.1 21.5 12.75V11.25C21.5 10.9 21.3 10.6 21 10.5ZM3 10.5C2.7 10.6 2.5 10.9 2.5 11.25V12.75C2.5 13.1 2.7 13.4 3 13.5C3 13.5 3.25 13.25 3.5 13C3.75 12.75 4 12.5 4 12.5V11.5C4 11.5 3.75 11.25 3.5 11C3.25 10.75 3 10.5 3 10.5ZM9.5 6.5C9.5 6.5 9.4 6.6 9.25 6.75C8.9 7.1 8.4 7.6 8.4 8.4V15.6C8.4 16.4 8.9 16.9 9.25 17.25C9.4 17.4 9.5 17.5 9.5 17.5H14.5C14.5 17.5 14.6 17.4 14.75 17.25C15.1 16.9 15.6 16.4 15.6 15.6V8.4C15.6 7.6 15.1 7.1 14.75 6.75C14.6 6.6 14.5 6.5 14.5 6.5H9.5ZM12 20C10.9 20 10 20.9 10 22H14C14 20.9 13.1 20 12 20Z"/>
        </svg>
      </button>
    </div>
  )
})

const BellScheduleStrip: React.FC<BellScheduleStripProps> = memo(({ className = '' }) => {
  const settings = useSettings()
  const { updateSettings } = useSettingsActions()

  // ベル時間の変更処理
  const handleTimeChange = useCallback((type: BellType, timeMs: Millis) => {
    updateSettings({
      bellTimesMs: {
        ...settings.bellTimesMs,
        [type]: timeMs
      }
    })
  }, [settings.bellTimesMs, updateSettings])

  // ベルの有効/無効切り替え処理
  const handleToggle = useCallback((type: BellType, enabled: boolean) => {
    updateSettings({
      bellEnabled: {
        ...settings.bellEnabled,
        [type]: enabled
      }
    })
  }, [settings.bellEnabled, updateSettings])

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <BellItem
        type="first"
        label="1令"
        timeMs={settings.bellTimesMs.first}
        enabled={settings.bellEnabled.first}
        onTimeChange={handleTimeChange}
        onToggle={handleToggle}
      />
      
      <BellItem
        type="second"
        label="2令"
        timeMs={settings.bellTimesMs.second}
        enabled={settings.bellEnabled.second}
        onTimeChange={handleTimeChange}
        onToggle={handleToggle}
      />
      
      <BellItem
        type="third"
        label="3令"
        timeMs={settings.bellTimesMs.third}
        enabled={settings.bellEnabled.third}
        onTimeChange={handleTimeChange}
        onToggle={handleToggle}
      />
      
      {/* Hidden help text for screen readers */}
      <div className="sr-only">
        <div id="first-switch-help">1令ベルの有効・無効を切り替えます</div>
        <div id="second-switch-help">2令ベルの有効・無効を切り替えます</div>
        <div id="third-switch-help">3令ベルの有効・無効を切り替えます</div>
      </div>
    </div>
  )
})

BellItem.displayName = 'BellItem'
BellScheduleStrip.displayName = 'BellScheduleStrip'

export default BellScheduleStrip