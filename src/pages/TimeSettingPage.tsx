import React from 'react';
import { useNavigate } from 'react-router-dom';

const TimeSettingPage: React.FC = () => {
  const navigate = useNavigate();

  const handlePlayButtonClick = () => {
    navigate('/timer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white from-80% to-[#a6d5cd] flex flex-col relative">
      {/* ヘッダー */}
      <div className="flex justify-end p-6">
        <button className="w-8 h-8 flex items-center justify-center opacity-70">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#a6d5cd]">
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* スクロール可能な時間ピッカー（メインタイマー） */}
        <div className="text-center mb-12">
          {/* 上の値（薄く表示） */}
          <div className="text-4xl font-mono text-gray-400 font-light mb-2">04:59</div>
          {/* 現在の値（メイン表示） */}
          <div className="text-6xl font-mono text-gray-800 font-light mb-2">05:00</div>
          {/* 下の値（薄く表示） */}
          <div className="text-4xl font-mono text-gray-400 font-light">06:01</div>
        </div>

        {/* 各令の時間設定 */}
        <div className="flex justify-center items-start space-x-16 mb-16">
          {/* 1令 */}
          <div className="text-center">
            {/* 上の値（薄く表示） */}
            <div className="text-lg font-mono text-gray-400 font-light mb-1">03:59</div>
            {/* 現在の値 */}
            <div className="text-2xl font-mono text-gray-800 font-light mb-1">04:00</div>
            {/* 下の値（薄く表示） */}
            <div className="text-lg font-mono text-gray-400 font-light mb-4">05:01</div>
            {/* ベルアイコン */}
            <div className="flex justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill="currentColor"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* 2令 */}
          <div className="text-center">
            {/* 上の値（薄く表示） */}
            <div className="text-lg font-mono text-gray-400 font-light mb-1">04:59</div>
            {/* 現在の値 */}
            <div className="text-2xl font-mono text-gray-800 font-light mb-1">05:00</div>
            {/* 下の値（薄く表示） */}
            <div className="text-lg font-mono text-gray-400 font-light mb-4">06:01</div>
            {/* ベルアイコン */}
            <div className="flex justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill="currentColor"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* 3令 */}
          <div className="text-center">
            {/* 上の値（薄く表示） */}
            <div className="text-lg font-mono text-gray-400 font-light mb-1">07:59</div>
            {/* 現在の値 */}
            <div className="text-2xl font-mono text-gray-800 font-light mb-1">08:00</div>
            {/* 下の値（薄く表示） */}
            <div className="text-lg font-mono text-gray-400 font-light mb-4">09:01</div>
            {/* ベルアイコン */}
            <div className="flex justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill="currentColor"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* 再生ボタン */}
        <button
          onClick={handlePlayButtonClick}
          className="w-16 h-16 bg-[#a6d5cd] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 mb-8"
        >
          <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
        </button>
      </div>

      {/* 下部の情報バー */}
      <div className="bg-[#a6d5cd]/30 backdrop-blur-sm px-6 py-4 flex justify-between items-center text-gray-700">
        <div className="text-center">
          <div className="text-sm opacity-70">start</div>
          <div className="text-lg font-mono">--:--</div>
        </div>
        <div className="text-center">
          <div className="text-sm opacity-70">now</div>
          <div className="text-lg font-mono">10:24</div>
        </div>
      </div>
    </div>
  );
};

export default TimeSettingPage;