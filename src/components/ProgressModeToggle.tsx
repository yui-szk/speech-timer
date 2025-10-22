import { useSettings, useSettingsActions } from '../store'
import type { ProgressMode } from '../types'

const ProgressModeToggle = () => {
  const settings = useSettings()
  const { updateSettings } = useSettingsActions()

  const modes = [
    {
      id: 'remaining' as const,
      label: '残り時間',
      description: 'タイマーの残り時間を表示'
    },
    {
      id: 'elapsed' as const,
      label: '経過時間',
      description: '開始からの経過時間を表示'
    }
  ]

  const handleModeChange = (mode: ProgressMode) => {
    updateSettings({ progressMode: mode })
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-subheadline font-medium text-gray-900 mb-3">
        プログレス表示
      </h3>
      
      <div className="flex bg-gray-200 rounded-lg p-1" role="radiogroup" aria-label="プログレス表示モード">
        {modes.map((mode) => {
          const isSelected = settings.progressMode === mode.id
          return (
            <button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              className={`
                flex-1 py-2 px-3 rounded-md text-subheadline font-medium transition-colors focus-ring focus:ring-offset-gray-200
                ${isSelected
                  ? 'bg-mint-500 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-300'
                }
              `}
              role="radio"
              aria-checked={isSelected}
              aria-label={mode.description}
            >
              {mode.label}
            </button>
          )
        })}
      </div>
      
      <p className="mt-2 text-caption1 text-gray-600">
        {settings.progressMode === 'remaining' 
          ? 'プログレスバーと表示が残り時間ベースになります'
          : 'プログレスバーと表示が経過時間ベースになります'
        }
      </p>
    </div>
  )
}

export default ProgressModeToggle