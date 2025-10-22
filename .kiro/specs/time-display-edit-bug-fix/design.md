# 設計文書

## 概要

時間表示編集機能のバグ修正に関する設計文書です。現在の問題は、編集モードに入って何も変更せずに終了した際に、`onBlur`イベントで`handleSubmit`が呼ばれ、結果的に`setDuration`が実行されてタイマーエンジンの状態が更新されることです。これにより、タイマーの内部時刻計算にずれが生じています。

## アーキテクチャ

### 現在の問題分析

1. **TimeDisplayコンポーネント**
   - `onBlur={handleSubmit}`により、編集モードを終了する際に常に`handleSubmit`が実行される
   - `handleSubmit`内で値の検証後、`setDuration(parsedMs)`が呼ばれる
   - 値が変更されていなくても`setDuration`が実行される

2. **useTimerフック**
   - `setDuration`は常にストアとタイマーエンジンの両方を更新する
   - 値が同じでも`timerSingleton.setDuration(ms)`が呼ばれる

3. **TimerEngineクラス**
   - `setDuration`メソッドで`updateTimeCalculations`が呼ばれる
   - これにより`performance.now()`ベースの時刻計算が再実行される
   - 微小な時間差が蓄積される

### 解決アプローチ

編集状態の管理を改善し、実際に値が変更された場合のみタイマー状態を更新するように修正します。

## コンポーネント設計

### TimeDisplayコンポーネントの修正

#### 状態管理の改善

```typescript
interface EditState {
  isEditing: boolean
  originalValue: string  // 編集開始時の元の値
  inputValue: string
  error: string | null
}
```

#### 編集フローの改善

1. **編集開始時**
   - 現在の表示時間を`originalValue`として保存
   - `inputValue`に同じ値を設定

2. **編集終了時**
   - `originalValue`と`inputValue`を比較
   - 値が変更された場合のみ`setDuration`を実行
   - 値が同じ場合は何もしない

3. **キャンセル時**
   - 明示的なキャンセル操作
   - 状態をリセットして編集モードを終了

### useTimerフックの改善

#### 重複更新の防止

```typescript
const setDuration = useCallback((ms: Millis) => {
  // 現在の値と同じ場合は更新をスキップ
  const currentState = timerSingleton.getState()
  if (currentState && currentState.durationMs === ms) {
    return
  }
  
  // 値が異なる場合のみ更新
  setStoreDuration(ms)
  timerSingleton.setDuration(ms)
}, [setStoreDuration])
```

### TimerEngineクラスの改善

#### 不要な更新の防止

```typescript
setDuration(durationMs: Millis): void {
  // 現在の値と同じ場合は何もしない
  if (this.state.durationMs === durationMs) {
    return
  }
  
  // 既存のロジック
  const oldDuration = this.state.durationMs
  const remainingRatio = this.state.remainingMs / oldDuration
  
  this.state = {
    ...this.state,
    durationMs,
    remainingMs: Math.max(0, durationMs * remainingRatio)
  }

  this.updateTimeCalculations(performance.now())
}
```

## データモデル

### 編集状態の管理

```typescript
interface TimeDisplayEditState {
  isEditing: boolean
  originalDisplayTime: string  // 編集開始時の表示時間（フォーマット済み）
  inputValue: string          // 入力フィールドの値
  error: string | null        // バリデーションエラー
  hasChanges: boolean         // 値が変更されたかどうか
}
```

### 値変更検出ロジック

```typescript
const detectChanges = (original: string, current: string): boolean => {
  // 両方の値をミリ秒に変換して比較
  const originalMs = parseTimeToMs(original.trim())
  const currentMs = parseTimeToMs(current.trim())
  
  return originalMs !== currentMs
}
```

## エラーハンドリング

### バリデーション戦略

1. **リアルタイムバリデーション**
   - 入力中のフォーマットチェック
   - エラー表示の更新

2. **確定時バリデーション**
   - 最終的な値の検証
   - エラーがある場合は編集モードを継続

3. **値変更検出**
   - バリデーション成功後に変更検出
   - 変更がない場合は更新をスキップ

### エラー状態の管理

```typescript
interface ValidationResult {
  isValid: boolean
  error: string | null
  parsedValue: Millis | null
}

const validateAndParse = (input: string): ValidationResult => {
  const trimmed = input.trim()
  
  if (!validateTimeFormat(trimmed)) {
    return {
      isValid: false,
      error: 'mm:ss形式で入力してください（例：05:30）',
      parsedValue: null
    }
  }
  
  const parsedMs = parseTimeToMs(trimmed)
  if (parsedMs === null) {
    return {
      isValid: false,
      error: '59:59以下の時間を入力してください',
      parsedValue: null
    }
  }
  
  if (parsedMs === 0) {
    return {
      isValid: false,
      error: '0より大きい時間を入力してください',
      parsedValue: null
    }
  }
  
  return {
    isValid: true,
    error: null,
    parsedValue: parsedMs
  }
}
```

## テスト戦略

### 単体テスト

1. **TimeDisplayコンポーネント**
   - 編集モード開始時の状態初期化
   - 値変更検出ロジック
   - 変更なし時の`setDuration`非呼び出し
   - 変更あり時の`setDuration`呼び出し

2. **useTimerフック**
   - 同じ値での`setDuration`呼び出し時のスキップ
   - 異なる値での`setDuration`呼び出し時の更新

3. **TimerEngineクラス**
   - 同じdurationでの`setDuration`呼び出し時の状態非更新
   - 異なるdurationでの`setDuration`呼び出し時の状態更新

### 統合テスト

1. **編集フロー全体**
   - タイマー停止 → 編集モード開始 → 変更なしで終了 → タイマー再開
   - 時間のずれが発生しないことを確認

2. **精度テスト**
   - 複数回の編集操作後のタイマー精度
   - 長時間の一時停止後の精度

### E2Eテスト

1. **ユーザーシナリオ**
   - 実際のユーザー操作フローの再現
   - 時間表示の正確性確認

## パフォーマンス考慮事項

### 最適化ポイント

1. **不要な再レンダリング防止**
   - `useCallback`と`useMemo`の適切な使用
   - 状態更新の最小化

2. **タイマー精度の維持**
   - `performance.now()`の一貫した使用
   - 不要な時刻計算の回避

3. **メモリリーク防止**
   - イベントリスナーの適切なクリーンアップ
   - タイマーの適切な停止

## 実装の優先順位

1. **高優先度**
   - TimeDisplayコンポーネントの値変更検出ロジック
   - useTimerフックの重複更新防止
   - TimerEngineの不要更新防止

2. **中優先度**
   - エラーハンドリングの改善
   - テストケースの追加

3. **低優先度**
   - パフォーマンス最適化
   - コードリファクタリング