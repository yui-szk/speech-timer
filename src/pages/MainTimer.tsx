import { useNavigate } from 'react-router-dom'
import { TimeDisplay, CircularProgress, Controls, BellScheduleStrip, StartAndNowClock, LiveAnnouncer } from '../components'

const MainTimer = () => {
  const navigate = useNavigate()

  const handleSettingsClick = () => {
    navigate('/settings')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white from-80% to-[#a6d5cd] overflow-hidden" role="main">
      {/* Skip link for keyboard navigation */}
      <a
        href="#timer-controls"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-mint-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-mint-300"
      >
        タイマーコントロールにスキップ
      </a>

      {/* Settings Button */}
      <button 
        onClick={handleSettingsClick}
        className="absolute right-7 top-7 w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-mint-500 rounded-lg"
        aria-label="設定を開く"
        title="設定"
      >
        <span className="material-symbols text-4xl text-[#A6D5CD]">settings</span>
      </button>

      {/* Main Timer Circle */}
      <div className="absolute left-1/2 top-[103px] transform -translate-x-1/2 w-[283px] h-[283px]">
        <CircularProgress size={283} strokeWidth={8} responsive={false} />
        <div className="absolute inset-0 flex items-center justify-center">
          <TimeDisplay />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="absolute left-1/2 top-[413px] transform -translate-x-1/2 w-[229px] h-[60px]" id="timer-controls">
        <Controls />
      </div>

      {/* Bell Schedule */}
      <div className="absolute left-1/2 top-[521px] transform -translate-x-1/2 w-[142px]">
        <BellScheduleStrip />
      </div>

      {/* Start and Now Clock */}
      <div className="absolute bottom-0 left-0 right-0 h-[120px] flex justify-between items-end px-16 pb-8">
        <StartAndNowClock />
      </div>

      {/* Live announcements for screen readers */}
      <LiveAnnouncer />
    </main>
  );
};

export default MainTimer;