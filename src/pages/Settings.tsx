import { useNavigate } from 'react-router-dom'
import { ThemePicker, BellSoundPicker, ProgressModeToggle } from '../components'

const Settings = () => {
  const navigate = useNavigate()

  const handleBackClick = () => {
    navigate('/')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white from-80% to-[#a6d5cd] p-6" role="main">
      {/* Skip link for keyboard navigation */}
      <a 
        href="#theme-settings" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-mint-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-mint-300"
      >
        テーマ設定にスキップ
      </a>

      {/* Back Button */}
      <button 
        onClick={handleBackClick}
        className="absolute left-7 top-7 w-9 h-9 flex items-center justify-center text-gray-600 focus:outline-none rounded-lg"
        aria-label="メインタイマーに戻る"
        title="戻る"
      >
        <span className="material-symbols text-4xl text-[#A6D5CD]">arrow_back</span>
      </button>
      
      <header className="mb-6 mt-16">
        <h1 className="text-2xl font-medium text-gray-900">設定</h1>
        <p className="text-subheadline text-gray-600 mt-1">
          アプリの表示や動作をカスタマイズできます
        </p>
      </header>
      
      <div className="space-y-6">
        <section aria-labelledby="theme-settings-heading" id="theme-settings">
          <h2 id="theme-settings-heading" className="sr-only">テーマ設定</h2>
          <ThemePicker />
        </section>
        
        <section aria-labelledby="audio-settings-heading">
          <h2 id="audio-settings-heading" className="sr-only">音声設定</h2>
          <BellSoundPicker />
        </section>
        
        <section aria-labelledby="display-settings-heading">
          <h2 id="display-settings-heading" className="sr-only">表示設定</h2>
          <ProgressModeToggle />
        </section>
      </div>
    </main>
  );
};

export default Settings;