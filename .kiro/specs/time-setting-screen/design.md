# 設計書

## 概要

時間設定画面は、Figmaデザインに基づいてメインタイマー時間と1,2,3令の時間を設定できる専用画面です。スクロール可能な数字ピッカーを使用して直感的な時間設定を提供し、各令のベル通知設定も管理します。この画面はアプリケーションの初期画面として機能し、再生ボタンからメインタイマー画面に遷移します。

## アーキテクチャ

### コンポーネント構造

```
TimeSettingPage
├── TimeSettingHeader (設定ボタン)
├── MainTimerSetting (メインタイマー時間設定)
├── StageTimerSettings (1,2,3令の時間設定)
│   ├── StageTimerItem × 3
│   │   ├── ScrollableTimePicker
│   │   └── BellToggle
└── PlayButton (再生ボタン)
```

### ルーティング変更

現在のルーティング構造を以下のように変更します：

- `/` → TimeSettingPage（新規作成）
- `/timer` → MainTimer（既存のMainTimerを移動）
- `/settings` → Settings（既存のまま）

### 状態管理の拡張

既存のZustandストアに以下の状態を追加：

```typescript
interface TimerSettings {
  // 既存の設定に追加
  stageTimesMs: {
    first: Millis
    second: Millis
    third: Millis
  }
}
```

## コンポーネントと インターフェース

### 1. TimeSettingPage

メインの時間設定画面コンポーネント

```typescript
interface TimeSettingPageProps {}

const TimeSettingPage: React.FC<TimeSettingPageProps> = () => {
  // メインタイマー時間と各令の時間を管理
  // 再生ボタンでメインタイマー画面に遷移
}
```

### 2. ScrollableTimePicker

スクロール可能な時間ピッカーコンポーネント

```typescript
interface ScrollableTimePickerProps {
  value: Millis // 現在の時間値（ミリ秒）
  onChange: (value: Millis) => void
  size: 'large' | 'medium' // メインタイマー用とステージ用のサイズ
  className?: string
}

const ScrollableTimePicker: React.FC<ScrollableTimePickerProps> = ({
  value,
  onChange,
  size,
  className
}) => {
  // 分と秒を独立してスクロール可能
  // スクロール中は前後の値を薄く表示
  // スクロール停止時に最も近い値にスナップ
}
```

### 3. StageTimerItem

各令の時間設定とベルトグルを含むコンポーネント

```typescript
interface StageTimerItemProps {
  stage: 'first' | 'second' | 'third'
  time: Millis
  bellEnabled: boolean
  onTimeChange: (time: Millis) => void
  onBellToggle: (enabled: boolean) => void
}

const StageTimerItem: React.FC<StageTimerItemProps> = ({
  stage,
  time,
  bellEnabled,
  onTimeChange,
  onBellToggle
}) => {
  // ScrollableTimePickerとBellToggleを組み合わせ
}
```

### 4. BellToggle

ベル通知のオン/オフを切り替えるコンポーネント

```typescript
interface BellToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  className?: string
}

const BellToggle: React.FC<BellToggleProps> = ({
  enabled,
  onChange,
  className
}) => {
  // Figmaデザインのベルアイコンを使用
  // アクティブ/非アクティブ状態を視覚的に表示
}
```

## データモデル

### 既存のベル管理システムとの統合

現在の`TimerSettings`では、`bellTimesMs`が各令のベル通知タイミング（残り時間）を管理しています。時間設定画面では、この`bellTimesMs`を各令の実際の時間として使用し、ベル通知は各令の終了時（残り時間0）に発生するように変更します。

```typescript
// 既存のTimerSettings（変更なし）
interface TimerSettings {
  theme: 'mint' | 'system'
  bellEnabled: {
    first: boolean
    second: boolean
    third: boolean
  }
  bellTimesMs: {
    first: Millis    // 1令の時間として使用
    second: Millis   // 2令の時間として使用
    third: Millis    // 3令の時間として使用
  }
  progressMode: ProgressMode
  volume: number
}
```

### デフォルト値の調整

```typescript
// settings-manager.tsのDEFAULT_SETTINGSを更新
const DEFAULT_BELL_TIMES = {
  first: 4 * 60 * 1000,  // 04:00
  second: 5 * 60 * 1000, // 05:00  
  third: 8 * 60 * 1000   // 08:00
}
```

### ベル通知ロジックの変更

- 現在：メインタイマーの残り時間が`bellTimesMs`に達した時にベル通知
- 変更後：各令のタイマーが完了した時（残り時間0）にベル通知

## エラーハンドリング

### バリデーション

1. **時間値の検証**
   - 最小値: 00:01（1秒）
   - 最大値: 99:59（99分59秒）
   - 無効な値の場合は前の有効な値に戻す

2. **スクロール操作の検証**
   - スクロール範囲外の値は自動的にクランプ
   - 不正な操作時は最も近い有効な値にスナップ

### エラー表示

- 時間設定エラー時は視覚的なフィードバックを提供
- アクセシビリティを考慮したエラーメッセージ

## テスト戦略

### 単体テスト

1. **ScrollableTimePicker**
   - スクロール操作による値変更
   - 分と秒の独立した操作
   - 値の範囲チェック
   - スナップ機能

2. **StageTimerItem**
   - 時間変更とベルトグル連携
   - プロパティの正しい伝播

3. **TimeSettingPage**
   - 初期値の設定
   - 設定値の保存
   - ナビゲーション

### 統合テスト

1. **ルーティング**
   - 時間設定画面からメインタイマーへの遷移
   - 設定値の引き継ぎ

2. **状態管理**
   - 設定変更の永続化
   - 複数コンポーネント間の状態同期

### E2Eテスト

1. **ユーザーフロー**
   - 時間設定 → タイマー開始 → 完了
   - ベル設定の動作確認
   - 設定画面との連携

## 実装上の考慮事項

### パフォーマンス

1. **スクロール最適化**
   - `requestAnimationFrame`を使用した滑らかなアニメーション
   - 不要な再レンダリングの防止
   - メモ化による最適化

2. **状態更新の最適化**
   - デバウンス処理による頻繁な更新の制御
   - 必要な場合のみ状態を更新

### アクセシビリティ

1. **キーボード操作**
   - 矢印キーによる値変更
   - Tabキーによるフォーカス移動
   - Enterキーによる確定

2. **スクリーンリーダー対応**
   - 適切なARIAラベル
   - 値変更時の音声フィードバック
   - 操作方法の説明

### レスポンシブデザイン

- Figmaデザインに基づく固定レイアウト
- 異なる画面サイズでの適切な表示
- タッチ操作の最適化

## 既存コードの変更

### MainTimer.tsx

- TimeDisplayコンポーネントから編集機能を削除
- 時間表示を読み取り専用に変更
- 時間設定画面への戻りボタンは不要（再生ボタンからの一方向遷移）

### App.tsx

ルーティング構造の変更：

```typescript
<Routes>
  <Route path="/" element={<AppShell />}>
    <Route index element={<TimeSettingPage />} />
    <Route path="timer" element={<MainTimer />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Routes>
```

### store/index.ts

既存の設定更新アクションを使用して各令の時間を管理：

```typescript
// 既存のupdateSettingsアクションを使用
updateSettings({
  bellTimesMs: {
    ...settings.bellTimesMs,
    [stage]: newTimeMs
  }
})

// 既存のupdateSettingsアクションを使用してベル有効/無効を管理
updateSettings({
  bellEnabled: {
    ...settings.bellEnabled,
    [stage]: enabled
  }
})
```