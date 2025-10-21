import React, { useState, useRef, useEffect } from 'react'
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

const BellItem: React.FC<BellItemProps> = ({
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
    <div className="flex items-center justify-between py-2">
      {/* ベルラベルとトグルスイッチ */}
      <div className="flex items-center space-x-3">
        <span className={`text-subheadline font-medium ${enabled ? 'text-gray-900' : 'text-gray-400'}`}>
          {label}
        </span>
        
        {/* トグルスイッチ */}
        <button
          onClick={handleToggle}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-2
            ${enabled ? 'bg-mint-600' : 'bg-gray-200'}
          `}
          role="switch"
          aria-checked={enabled}
          aria-label={`${label}を${enabled ? '無効' : '有効'}にする`}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${enabled ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

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
                font-mono text-subheadline text-center bg-transparent border border-mint-300
                rounded px-2 py-1 w-16 focus:outline-none focus:border-mint-500
                focus:ring-1 focus:ring-mint-200
                ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''}
              `}
              placeholder="mm:ss"
              maxLength={5}
              aria-label={`${label}の時間を編集`}
              aria-describedby={error ? `${type}-error` : undefined}
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
              font-mono text-subheadline px-2 py-1 rounded transition-colors
              ${enabled 
                ? 'text-mint-600 hover:text-mint-700 hover:bg-mint-50 cursor-pointer' 
                : 'text-gray-400 cursor-not-allowed'
              }
              focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-1
            `}
            aria-label={`${label}の時間 ${displayTime}${enabled ? '。クリックして編集' : '。無効'}`}
          >
            {displayTime}
          </button>
        )}
      </div>
    </div>
  )
}

const BellScheduleStrip: React.FC<BellScheduleStripProps> = ({ className = '' }) => {
  const settings = useSettings()
  const { updateSettings } = useSettingsActions()

  // ベル時間の変更処理
  const handleTimeChange = (type: BellType, timeMs: Millis) => {
    updateSettings({
      bellTimesMs: {
        ...settings.bellTimesMs,
        [type]: timeMs
      }
    })
  }

  // ベルの有効/無効切り替え処理
  const handleToggle = (type: BellType, enabled: boolean) => {
    updateSettings({
      bellEnabled: {
        ...settings.bellEnabled,
        [type]: enabled
      }
    })
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-5 h-5 bg-accent-400 rounded-full flex items-center justify-center">
          <svg 
            className="w-3 h-3 text-white" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-subheadline font-medium text-gray-900">ベル設定</h3>
      </div>
      
      <div className="space-y-1">
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
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-caption1 text-gray-500 text-center">
          残り時間がベル時間に到達すると音が鳴ります
        </p>
      </div>
    </div>
  )
}

export default BellScheduleStrip