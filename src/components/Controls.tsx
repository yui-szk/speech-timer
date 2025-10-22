import { useEffect, useCallback } from 'react'
import { useTimer } from '../hooks/useTimer'

interface ControlsProps {
  // No props needed - bell test is handled internally
}

const Controls = ({}: ControlsProps) => {
  const { 
    status, 
    start, 
    pause, 
    reset, 
    testBell, 
    initializeAudio, 
    isAudioReady 
  } = useTimer()

  // Initialize audio on first user interaction
  const handleInitializeAudio = useCallback(async () => {
    if (!isAudioReady) {
      try {
        await initializeAudio()
      } catch (error) {
        console.error('Failed to initialize audio:', error)
      }
    }
  }, [isAudioReady, initializeAudio])

  // キーボードショートカットの処理
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // フォーカスが入力フィールドにある場合はショートカットを無効化
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return
    }

    switch (event.code) {
      case 'Space':
        event.preventDefault()
        handleInitializeAudio() // Initialize audio on first interaction
        if (status === 'running') {
          pause()
        } else if (status === 'idle' || status === 'paused') {
          start()
        }
        break
      case 'KeyR':
        event.preventDefault()
        reset()
        break
      case 'KeyB':
        event.preventDefault()
        handleBellTest()
        break
    }
  }, [status, start, pause, reset, handleInitializeAudio])

  // キーボードイベントリスナーの設定
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // ボタンのクリックハンドラー
  const handlePlayPause = async () => {
    await handleInitializeAudio() // Initialize audio on first interaction
    
    if (status === 'running') {
      pause()
    } else if (status === 'idle' || status === 'paused') {
      start()
    }
  }

  const handleReset = () => {
    reset()
  }

  const handleBellTest = async () => {
    try {
      await handleInitializeAudio() // Initialize audio if needed
      await testBell()
    } catch (error) {
      console.error('Bell test failed:', error)
    }
  }

  // ボタンの状態を決定
  const isPlaying = status === 'running'
  const isFinished = status === 'finished'
  const canPlay = status === 'idle' || status === 'paused'

  return (
    <div className="flex justify-center space-x-4" role="group" aria-label="タイマーコントロール">
      {/* リセットボタン */}
      <button
        onClick={handleReset}
        className="w-tap h-tap bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg flex items-center justify-center transition-colors duration-150 focus-ring"
        aria-label="タイマーをリセット (R)"
        title="タイマーをリセット (R)"
        type="button"
        aria-describedby="reset-help"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      {/* ベルテストボタン */}
      <button
        onClick={handleBellTest}
        className="w-tap h-tap bg-accent-400 hover:bg-accent-500 active:bg-accent-600 rounded-lg flex items-center justify-center transition-colors duration-150 focus-ring-accent"
        aria-label="ベル音をテスト (B)"
        title="ベル音をテスト (B)"
        type="button"
        aria-describedby="bell-test-help"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5 5v-5zM4.868 19.718A8.966 8.966 0 003 12a8.966 8.966 0 001.868-7.718M6.343 6.343a8.966 8.966 0 000 11.314m2.829-2.829a4.966 4.966 0 000-5.656"
          />
        </svg>
      </button>

      {/* 再生/一時停止ボタン */}
      <button
        onClick={handlePlayPause}
        disabled={isFinished}
        className={`w-tap h-tap rounded-lg flex items-center justify-center transition-colors duration-150 focus-ring ${
          isFinished
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-mint-500 hover:bg-mint-600 active:bg-mint-700'
        }`}
        aria-label={
          isPlaying
            ? 'タイマーを一時停止 (Space)'
            : isFinished
            ? 'タイマー完了'
            : 'タイマーを開始 (Space)'
        }
        title={
          isPlaying
            ? 'タイマーを一時停止 (Space)'
            : isFinished
            ? 'タイマー完了'
            : 'タイマーを開始 (Space)'
        }
        type="button"
        aria-describedby="play-pause-help"
        aria-pressed={isPlaying}
      >
        {isPlaying ? (
          // 一時停止アイコン
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          // 再生アイコン
          <svg
            className="w-6 h-6 text-white ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      
      {/* Hidden help text for screen readers */}
      <div className="sr-only">
        <div id="reset-help">Rキーでもリセットできます</div>
        <div id="bell-test-help">Bキーでもベル音をテストできます</div>
        <div id="play-pause-help">スペースキーでも再生・一時停止できます</div>
      </div>
    </div>
  )
}

export default Controls