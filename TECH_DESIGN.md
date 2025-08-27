## スピーチタイマー 技術設計書

参照: `DESIGN.md` / Figma [sheet1](https://www.figma.com/design/t1xyTOy4za51SGL89ohgOE/timer-design?node-id=100-1191&m=dev), [sheet2](https://www.figma.com/design/t1xyTOy4za51SGL89ohgOE/timer-design?node-id=108-1256&m=dev)

---

### 1. 目的と非機能要件
- **目的**: 残り時間の高視認タイマーと、1/2/3令ベル通知により発表を支援
- **対応プラットフォーム**: Web（スマホ優先。タブレット/デスクトップはレスポンシブ対応）
- **パフォーマンス**: 60fpsを目標。タイマー誤差 ±50ms/分以内
- **アクセシビリティ**: キーボード操作、コントラスト比、音量調整、色依存回避
- **オフライン**: PWA化は将来対応。現在はローカル動作前提

### 2. 技術スタック
- **フロントエンド**: React + TypeScript + Vite（想定）
- **スタイル**: Tailwind CSS（Figma出力に合致）
- **状態管理**: Zustand もしくは React Context + Reducer（小規模）
- **日付/時間**: ネイティブ `performance.now` / `requestAnimationFrame`、`Intl.DateTimeFormat`
- **音声**: Web Audio API（`AudioContext`, `OscillatorNode`）または短い音源ファイル
- **永続化**: `localStorage`（設定、ベル時刻、テーマ）
- **テスト**: Vitest + React Testing Library、Playwright(E2E)

### 3. 画面構成とルーティング
- `/` メイン画面（タイマー）
- `/settings` 設定画面
- ルーターは `react-router-dom` を想定（遷移は最小）
- レスポンシブ: モバイル優先。ブレークポイント例 `sm: 640px`、`md: 768px`。`md`以上で左右余白を増やし操作群を固定幅に

### 4. UIコンポーネント構成
- `AppShell`
  - ヘッダー（右上: 設定歯車）/ コンテンツ / フッター
- `MainTimer`
  - `TimeDisplay`（大きな数字、クリックで編集モード）
  - `CircularProgress`（残り/経過モード切替）
  - `Controls`（Reset/ Bell/ PlayPause）
  - `BellScheduleStrip`（1令/2令/3令の表示・ON/OFF・編集）
  - `StartAndNowClock`（開始・現在時刻）
- `Settings`
  - `BackButton`
  - `ThemePicker`（メイン/アクセント）
  - `BellSoundPicker`（音色/音量/テスト再生）
  - `ProgressModeToggle`（残り/経過）

### 5. データモデル
```ts
// 時間はミリ秒
export type Millis = number;

export type ProgressMode = 'remaining' | 'elapsed';

export interface TimerSettings {
  theme: 'mint' | 'system';
  bellEnabled: { first: boolean; second: boolean; third: boolean };
  bellTimesMs: { first: Millis; second: Millis; third: Millis }; // 残り時間基準
  progressMode: ProgressMode; // 残り or 経過
  volume: number; // 0..1
}

export interface TimerState {
  status: 'idle' | 'running' | 'paused' | 'finished';
  durationMs: Millis; // 総時間
  startEpochMs?: number; // 開始時の Date.now
  pauseAccumulatedMs: Millis; // 一時停止の累積
  nowEpochMs: number; // UI更新用（tick）
}
```

### 6. 状態遷移（タイマー）
- `idle` → `running`（開始）
- `running` ↔ `paused`（一時停止/再開）
- `running` → `finished`（0到達）
- `finished` → `idle`（リセット）

内部時間は `startEpochMs`, `pauseAccumulatedMs`, `performance.now()` を用いて算出。

### 7. タイムキーピングとレンダリング
- 1秒ごとの `setInterval(1000)` は使用せず、`requestAnimationFrame` で 60fps の軽量tickを駆動
- 表示更新は 250ms 間隔にスロットルし、音の鳴動は実時間で厳密に判定
- 残り時間: `remaining = duration - (now - start - pauseAccumulated)`

### 8. ベルスケジューリング
- 設定された 1/2/3令の「残り時間しきい値」到達時にトリガ
- 直前/直後フレームで取り逃し防止：`prevRemaining > t && currentRemaining <= t`
- 同一しきい値での重複鳴動を回避するため、発報済みフラグを保持

### 9. サウンド生成
- 方式A: Web Audio API で 1kHz 正弦波を短く鳴動（ベルらしいエンベロープ）
- 方式B: 事前用意の短い音源（mp3/ogg）を再生
- ミュート/音量は `GainNode` で制御。テスト再生ボタンを提供

### 10. 入力・編集
- 時刻編集: `TimeDisplay`クリック → 分:秒入力（`mm:ss`）
- ベル編集: `BellScheduleStrip` の各セルクリックで `mm:ss` 入力。ON/OFFトグル
- キーボード: Space（再生/停止）、R（リセット）、B（ベルテスト）

### 11. 永続化
- `localStorage` キー `speechTimer.settings` に `TimerSettings` を保存/読込
- 初回はデフォルト値を使用し、変更時に即時保存

### 12. アクセシビリティ
- ボタンは 44×44px 以上。フォーカスリング表示
- 役割/ラベルを `aria-*` で付与（例: 再生/一時停止）
- 色覚配慮: 進捗は色＋形（円弧の長さ）で表現

### 13. スタイル指針
- カラー: メイン=ミント、アクセント=イエロー、背景=ホワイト（`DESIGN.md`準拠）
- フォント: サンセリフ（Noto Sans等）。数字は等幅を選択可能
- コンポーネントは Tailwind のユーティリティで構築
- レイアウト: モバイル縦画面を基準に設計（幅: 360–430px想定）。主要要素は縦積み、下部に操作群
- タップ領域: 44×44px以上、主要ボタンは最小48×48pxを推奨
- テキストサイズ: 残り時間は画面幅に応じて流体タイポ（例: `clamp(48px, 18vw, 96px)`）

### 14. テスト方針
- 単体: 時間計算、状態遷移、ベル発報判定、設定の永続化
- コンポーネント: 主要UIのレンダリング/操作（RTL）
- E2E: 10分タイマーでの再生→2分経過→一時停止→再開→0到達とベル検証（Playwright、音はモック）

### 15. マイルストーン
1. 骨格実装（ルーティング、シェル、テーマ）
2. タイマー計時と表示/プログレス
3. 操作ボタン・ショートカット
4. ベル編集・鳴動
5. 設定画面と永続化
6. アクセシビリティ仕上げ・E2E

---

この設計は `DESIGN.md` の要件に準拠します。必要があれば章立てや詳細仕様を追補します。 