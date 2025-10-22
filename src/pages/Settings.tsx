import { ThemePicker, BellSoundPicker, ProgressModeToggle } from '../components'

const Settings = () => {
  return (
    <main className="space-y-4" role="main">
      {/* Skip link for keyboard navigation */}
      <a 
        href="#theme-settings" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-mint-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-mint-300"
      >
        テーマ設定にスキップ
      </a>
      
      <header className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900">設定</h1>
        <p className="text-subheadline text-gray-600 mt-1">
          アプリの表示や動作をカスタマイズできます
        </p>
      </header>
      
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
    </main>
  );
};

export default Settings;