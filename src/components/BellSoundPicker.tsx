import { useState, useCallback } from 'react'
import { useSettings, useSettingsActions } from '../store'
import { getAudioManager } from '../utils/audio-manager'

const BellSoundPicker = () => {
  const settings = useSettings()
  const { updateSettings } = useSettingsActions()
  const [isTestingSound, setIsTestingSound] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)

  const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(event.target.value) / 100
    updateSettings({ volume })
    
    // Update audio manager volume immediately
    const audioManager = getAudioManager()
    audioManager.setVolume(volume)
  }, [updateSettings])

  const handleTestSound = useCallback(async () => {
    if (isTestingSound) return

    setIsTestingSound(true)
    setAudioError(null)

    try {
      const audioManager = getAudioManager({
        onError: (error) => {
          setAudioError(error.message)
        }
      })

      // Set current volume before testing
      audioManager.setVolume(settings.volume)
      
      // Initialize if needed (requires user gesture)
      if (!audioManager.isReady()) {
        await audioManager.initialize()
      }

      await audioManager.testSound()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ベル音の再生に失敗しました'
      setAudioError(errorMessage)
    } finally {
      setIsTestingSound(false)
    }
  }, [isTestingSound, settings.volume])

  const volumePercentage = Math.round(settings.volume * 100)

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-subheadline font-medium text-gray-900 mb-3">
        ベル音設定
      </h3>
      
      {/* Volume Control */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <label htmlFor="volume-slider" className="text-subheadline text-gray-700">
            音量
          </label>
          <span className="text-subheadline text-mint-600" aria-live="polite">
            {volumePercentage}%
          </span>
        </div>
        
        <div className="relative">
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="100"
            value={volumePercentage}
            onChange={handleVolumeChange}
            className="
              w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-2
              slider:bg-mint-500
            "
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${volumePercentage}%, #e5e7eb ${volumePercentage}%, #e5e7eb 100%)`
            }}
            aria-label={`音量を${volumePercentage}%に設定`}
          />
        </div>
      </div>

      {/* Test Sound Button */}
      <button
        onClick={handleTestSound}
        disabled={isTestingSound}
        className={`
          w-full p-3 rounded-lg text-subheadline font-medium transition-colors
          focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2
          ${isTestingSound
            ? 'bg-accent-300 text-white cursor-not-allowed'
            : 'bg-accent-400 text-white hover:bg-accent-500'
          }
        `}
        aria-label="ベル音をテスト再生"
      >
        {isTestingSound ? 'テスト中...' : 'ベル音をテスト'}
      </button>

      {/* Error Message */}
      {audioError && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-caption1 text-red-700">
          {audioError}
        </div>
      )}
    </div>
  )
}

export default BellSoundPicker