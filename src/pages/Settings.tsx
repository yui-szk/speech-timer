const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-medium text-gray-900 mb-2">
          設定画面
        </h2>
        <p className="text-subheadline text-gray-600">
          設定機能は次のタスクで実装されます
        </p>
      </div>
      
      <div className="space-y-4">
        {/* ThemePicker プレースホルダー */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-subheadline font-medium text-gray-900 mb-3">
            テーマ設定
          </h3>
          <div className="flex space-x-3">
            <button className="flex-1 p-3 bg-mint-100 border-2 border-mint-500 rounded-lg">
              <div className="w-6 h-6 bg-mint-500 rounded mx-auto mb-1"></div>
              <div className="text-caption1 text-mint-700">ミント</div>
            </button>
            <button className="flex-1 p-3 bg-gray-100 border-2 border-transparent rounded-lg">
              <div className="w-6 h-6 bg-gray-500 rounded mx-auto mb-1"></div>
              <div className="text-caption1 text-gray-700">システム</div>
            </button>
          </div>
        </div>
        
        {/* BellSoundPicker プレースホルダー */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-subheadline font-medium text-gray-900 mb-3">
            ベル音設定
          </h3>
          <div className="flex items-center justify-between mb-3">
            <span className="text-subheadline text-gray-700">音量</span>
            <span className="text-subheadline text-mint-600">80%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div className="bg-mint-500 h-2 rounded-full" style={{ width: '80%' }}></div>
          </div>
          <button className="w-full p-3 bg-accent-400 text-white rounded-lg text-subheadline font-medium">
            ベル音をテスト
          </button>
        </div>
        
        {/* ProgressModeToggle プレースホルダー */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-subheadline font-medium text-gray-900 mb-3">
            プログレス表示
          </h3>
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button className="flex-1 py-2 px-3 bg-mint-500 text-white rounded-md text-subheadline font-medium">
              残り時間
            </button>
            <button className="flex-1 py-2 px-3 text-gray-700 rounded-md text-subheadline font-medium">
              経過時間
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;