import { useEffect, useCallback, memo } from 'react'
import { useTimer } from '../hooks/useTimer'

interface ControlsProps {
  // No props needed - bell test is handled internally
}

const Controls = memo(({ }: ControlsProps) => {
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

  return (
    <div className="relative w-[229px] h-[60px]" role="group" aria-label="タイマーコントロール">
      {/* リセットボタン */}
      <button
        onClick={handleReset}
        className="absolute left-[-2px] top-[2px] w-[60px] h-[60px] bg-transparent hover:bg-gray-100 active:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-150 focus-ring"
        aria-label="タイマーをリセット (R)"
        title="タイマーをリセット (R)"
        type="button"
        aria-describedby="reset-help"
      >
        <span className="material-symbols text-[#68b2a0] text-5xl">replay</span>
      </button>

      {/* ベルボタン */}
      <button
        onClick={handleBellTest}
        className="absolute left-[81px] top-0 w-[60px] h-[60px] bg-transparent hover:bg-yellow-100 active:bg-yellow-200 rounded-full flex items-center justify-center transition-colors duration-150 focus-ring-accent overflow-hidden"
        aria-label="ベル"
        title="ベル"
        type="button"
        aria-describedby="bell-test-help"
      >
        <span className="material-symbols text-yellow-500 hover:bg-yellow-50 text-5xl">room_service</span>
      </button>

      {/* 再生/一時停止ボタン */}
      <button
        onClick={handlePlayPause}
        disabled={isFinished}
        className={`absolute left-[169px] top-0 w-[60px] h-[60px] rounded-full flex items-center justify-center transition-colors duration-150 focus-ring ${
          isFinished

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
          <span className="material-symbols text-[#68b2a0] hover:text-[#5a9b8a] active:text-[#4d8577] text-5xl">pause</span>
        ) : (
          // 再生アイコン
          <span className="material-symbols text-[#68b2a0] hover:text-[#5a9b8a] active:text-[#4d8577] text-5xl">play_arrow</span>
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