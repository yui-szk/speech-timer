import { useSettings, useSettingsActions } from '../store'

const ThemePicker = () => {
  const settings = useSettings()
  const { updateSettings } = useSettingsActions()

  const themes = [
    {
      id: 'mint' as const,
      name: 'ミント',
      colorClass: 'bg-mint-500',
      bgClass: 'bg-mint-100',
      borderClass: 'border-mint-500',
      textClass: 'text-mint-700'
    },
    {
      id: 'system' as const,
      name: 'システム',
      colorClass: 'bg-gray-500',
      bgClass: 'bg-gray-100',
      borderClass: 'border-gray-500',
      textClass: 'text-gray-700'
    }
  ]

  const handleThemeChange = (theme: 'mint' | 'system') => {
    updateSettings({ theme })
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-subheadline font-medium text-gray-900 mb-3">
        テーマ設定
      </h3>
      <div className="flex space-x-3">
        {themes.map((theme) => {
          const isSelected = settings.theme === theme.id
          return (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`
                flex-1 p-3 rounded-lg border-2 transition-colors focus-ring
                ${isSelected 
                  ? `${theme.bgClass} ${theme.borderClass}` 
                  : 'bg-gray-100 border-transparent hover:bg-gray-200'
                }
              `}
              aria-label={`${theme.name}テーマを選択`}
              aria-pressed={isSelected}
            >
              <div className={`w-6 h-6 ${theme.colorClass} rounded mx-auto mb-1`}></div>
              <div className={`text-caption1 ${isSelected ? theme.textClass : 'text-gray-700'}`}>
                {theme.name}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ThemePicker