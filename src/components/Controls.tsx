import { useEffect, useCallback, memo } from 'react'
import { useTimer } from '../hooks/useTimer'

interface ControlsProps {
  // No props needed - bell test is handled internally
}

const Controls = memo(({}: ControlsProps) => {
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
    <div className="relative w-[229px] h-[60px]" role="group" aria-label="タイマーコントロール">
      {/* リセットボタン */}
      <button
        onClick={handleReset}
        className="absolute left-[-2px] top-[2px] w-[42px] h-[49px] bg-transparent hover:bg-gray-100 active:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-150 focus-ring"
        aria-label="タイマーをリセット (R)"
        title="タイマーをリセット (R)"
        type="button"
        aria-describedby="reset-help"
      >
        <svg
          className="w-6 h-6 text-[#68b2a0]"
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
        className="absolute left-[81px] top-0 w-[60px] h-[60px] bg-transparent hover:bg-yellow-100 active:bg-yellow-200 rounded-full flex items-center justify-center transition-colors duration-150 focus-ring-accent"
        aria-label="ベル音をテスト (B)"
        title="ベル音をテスト (B)"
        type="button"
        aria-describedby="bell-test-help"
      >
        <svg
          className="w-8 h-8 text-yellow-500"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 10.5C21 10.5 20.75 10.75 20.5 11C20.25 11.25 20 11.5 20 11.5V12.5C20 12.5 20.25 12.75 20.5 13C20.75 13.25 21 13.5 21 13.5C21.3 13.4 21.5 13.1 21.5 12.75V11.25C21.5 10.9 21.3 10.6 21 10.5ZM3 10.5C2.7 10.6 2.5 10.9 2.5 11.25V12.75C2.5 13.1 2.7 13.4 3 13.5C3 13.5 3.25 13.25 3.5 13C3.75 12.75 4 12.5 4 12.5V11.5C4 11.5 3.75 11.25 3.5 11C3.25 10.75 3 10.5 3 10.5ZM9.5 6.5C9.5 6.5 9.4 6.6 9.25 6.75C8.9 7.1 8.4 7.6 8.4 8.4V15.6C8.4 16.4 8.9 16.9 9.25 17.25C9.4 17.4 9.5 17.5 9.5 17.5H14.5C14.5 17.5 14.6 17.4 14.75 17.25C15.1 16.9 15.6 16.4 15.6 15.6V8.4C15.6 7.6 15.1 7.1 14.75 6.75C14.6 6.6 14.5 6.5 14.5 6.5H9.5ZM12 20C10.9 20 10 20.9 10 22H14C14 20.9 13.1 20 12 20Z"/>
        </svg>
      </button>

      {/* 再生/一時停止ボタン */}
      <button
        onClick={handlePlayPause}
        disabled={isFinished}
        className={`absolute left-[169px] top-0 w-[60px] h-[60px] rounded-full flex items-center justify-center transition-colors duration-150 focus-ring ${
          isFinished
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-[#68b2a0] hover:bg-[#5a9b8a] active:bg-[#4d8577]'
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
          // 一時停止アイコン（2つの縦線）
          <div className="flex space-x-1">
            <div className="w-2 h-6 bg-white rounded-sm"></div>
            <div className="w-2 h-6 bg-white rounded-sm"></div>
          </div>
        ) : (
          // 再生アイコン（三角形）
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
})

Controls.displayName = 'Controls'

export default Controls