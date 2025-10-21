import { TimeDisplay, CircularProgress, Controls, BellScheduleStrip, StartAndNowClock } from '../components'

const MainTimer = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-full space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-medium text-gray-900 mb-2">
          メインタイマー画面
        </h2>
        <p className="text-subheadline text-gray-600">
          TimeDisplayコンポーネントが実装されました
        </p>
      </div>
      
      {/* 実装されたコンポーネントと将来のプレースホルダー */}
      <div className="w-full max-w-sm space-y-6">
        {/* TimeDisplay - 実装完了 */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <TimeDisplay />
        </div>
        
        {/* CircularProgress - 実装完了 */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <CircularProgress size={160} strokeWidth={12} />
        </div>
        
        {/* Controls - 実装完了 */}
        <Controls />
        
        {/* BellScheduleStrip - 実装完了 */}
        <BellScheduleStrip />
        
        {/* StartAndNowClock - 実装完了 */}
        <StartAndNowClock className="bg-gray-50 rounded-lg p-4" />
      </div>
    </div>
  );
};

export default MainTimer;