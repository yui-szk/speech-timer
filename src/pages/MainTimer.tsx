import { TimeDisplay, CircularProgress, Controls, BellScheduleStrip, StartAndNowClock, LiveAnnouncer } from '../components'

const MainTimer = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-full space-y-8" role="main">
      {/* Skip link for keyboard navigation */}
      <a 
        href="#timer-controls" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-mint-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-mint-300"
      >
        タイマーコントロールにスキップ
      </a>
      
      <header className="text-center">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          スピーチタイマー
        </h1>
        <p className="text-subheadline text-gray-600">
          発表時間を正確に計測し、ベル通知でサポートします
        </p>
      </header>
      
      <div className="w-full max-w-sm space-y-6">
        {/* Timer Display Section */}
        <section aria-labelledby="timer-display-heading">
          <h2 id="timer-display-heading" className="sr-only">タイマー表示</h2>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <TimeDisplay />
          </div>
        </section>
        
        {/* Progress Visualization Section */}
        <section aria-labelledby="progress-heading">
          <h2 id="progress-heading" className="sr-only">進捗表示</h2>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <CircularProgress size={160} strokeWidth={12} />
          </div>
        </section>
        
        {/* Timer Controls Section */}
        <section aria-labelledby="timer-controls-heading" id="timer-controls">
          <h2 id="timer-controls-heading" className="sr-only">タイマー操作</h2>
          <Controls />
        </section>
        
        {/* Bell Settings Section */}
        <section aria-labelledby="bell-settings-heading">
          <h2 id="bell-settings-heading" className="sr-only">ベル設定</h2>
          <BellScheduleStrip />
        </section>
        
        {/* Time Information Section */}
        <section aria-labelledby="time-info-heading">
          <h2 id="time-info-heading" className="sr-only">時刻情報</h2>
          <StartAndNowClock className="bg-gray-50 rounded-lg p-4" />
        </section>
      </div>
      
      {/* Live announcements for screen readers */}
      <LiveAnnouncer />
    </main>
  );
};

export default MainTimer;