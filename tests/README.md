# スピーチタイマー テストスイート

このディレクトリには、スピーチタイマーアプリケーションの包括的なテストスイートが含まれています。

## テストの種類

### 1. 単体テスト (Unit Tests)
- **場所**: `src/**/*.test.ts`
- **フレームワーク**: Vitest + React Testing Library
- **対象**: 個別のコンポーネント、フック、ユーティリティ関数

### 2. 統合テスト (Integration Tests)
- **場所**: `tests/integration/`
- **フレームワーク**: Vitest + React Testing Library
- **対象**: コンポーネント間の連携、状態管理、複雑なワークフロー

### 3. E2Eテスト (End-to-End Tests)
- **場所**: `tests/e2e/`
- **フレームワーク**: Playwright
- **対象**: ユーザーシナリオ、ブラウザ互換性、実際の使用フロー

## テストファイル構成

```
tests/
├── e2e/                          # E2Eテスト
│   ├── timer-workflow.spec.ts    # 完全なタイマーワークフロー
│   ├── bell-system.spec.ts       # ベルシステムの動作確認
│   ├── settings-persistence.spec.ts # 設定永続化テスト
│   └── cross-browser.spec.ts     # クロスブラウザ互換性
├── integration/                  # 統合テスト
│   ├── timer-precision.test.ts   # タイマー精度テスト
│   ├── bell-trigger.test.ts      # ベルトリガー検証
│   └── vitest.config.ts         # 統合テスト設定
├── utils/                        # テストユーティリティ
│   ├── test-helpers.ts          # E2Eテストヘルパー
│   └── mock-helpers.ts          # モックヘルパー
└── README.md                     # このファイル
```

## テストの実行方法

### 全テスト実行
```bash
npm run test:all
```

### 単体テスト
```bash
npm run test              # 一回実行
npm run test:watch        # ウォッチモード
npm run test:ui           # UIモード
npm run test:coverage     # カバレッジ付き
```

### 統合テスト
```bash
npm run test:integration  # 全統合テスト
npm run test:precision    # タイマー精度テストのみ
npm run test:bell         # ベルトリガーテストのみ
```

### E2Eテスト
```bash
npm run test:e2e          # ヘッドレスモード
npm run test:e2e:headed   # ブラウザ表示モード
npm run test:e2e:ui       # Playwright UIモード
```

## テスト対象の要件

### 要件7.1: タイマー精度
- **テスト**: `tests/integration/timer-precision.test.ts`
- **検証内容**: 
  - 1分間の動作で±50ms以内の精度維持
  - 一時停止・再開での累積時間の正確性
  - 長時間実行でのドリフト防止
  - ブラウザタブ非アクティブ状態での継続

### 要件7.2: パフォーマンス
- **テスト**: `tests/e2e/cross-browser.spec.ts`
- **検証内容**:
  - 60fpsでのスムーズな表示更新
  - メモリリークの防止
  - 高頻度更新でのフレームレート維持

### 要件7.3: 状態管理
- **テスト**: `tests/integration/timer-precision.test.ts`
- **検証内容**:
  - 複数回の一時停止・再開サイクル
  - 状態遷移の正確性
  - エラー状態からの復旧

## ベルシステムテスト

### ベルトリガー検証
- **正しいしきい値でのトリガー**: 残り時間がベル設定時間を下回った瞬間
- **重複防止**: 同じしきい値での複数回トリガーを防ぐ
- **ON/OFF制御**: 無効にされたベルはトリガーされない
- **リセット動作**: タイマーリセット時にベル状態もリセット

### オーディオシステム
- **Web Audio API互換性**: 各ブラウザでの動作確認
- **音量制御**: 0-100%の範囲での音量調整
- **ユーザージェスチャー**: オーディオコンテキスト初期化の要件

## 設定永続化テスト

### localStorage機能
- **設定保存**: 変更時の自動保存
- **設定復元**: アプリ再起動時の設定復元
- **エラーハンドリング**: 容量制限、破損データの処理
- **フォールバック**: localStorage利用不可時のデフォルト動作

### 設定項目
- タイマー時間設定
- ベル時間とON/OFF状態
- テーマ設定
- 音量設定
- プログレス表示モード

## クロスブラウザ互換性

### 対象ブラウザ
- **デスクトップ**: Chrome, Firefox, Safari
- **モバイル**: Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)

### 互換性テスト項目
- 基本的なタイマー機能
- プログレスバー表示
- 設定画面の動作
- キーボードショートカット
- ベル設定とトリガー
- localStorage永続化
- タッチ操作（モバイル）
- レスポンシブレイアウト

## パフォーマンステスト

### メモリ使用量
- 長時間実行でのメモリリーク検出
- JSヒープサイズの監視
- 50MB未満の使用量維持

### フレームレート
- タイマー動作中の60fps維持
- 3秒間で最低90フレーム（30fps以上）
- requestAnimationFrameの効率的な使用

## テスト実行環境

### 必要な依存関係
```json
{
  "@playwright/test": "^1.x.x",
  "@testing-library/react": "^16.x.x",
  "@testing-library/user-event": "^14.x.x",
  "vitest": "^2.x.x",
  "jsdom": "^26.x.x"
}
```

### 環境設定
- **Node.js**: 18以上
- **ブラウザ**: Playwright自動インストール
- **ポート**: 5173 (Vite開発サーバー)

## CI/CD統合

### GitHub Actions例
```yaml
- name: Run Unit Tests
  run: npm run test

- name: Run Integration Tests  
  run: npm run test:integration

- name: Run E2E Tests
  run: npm run test:e2e
```

### テスト結果
- **単体テスト**: カバレッジレポート生成
- **E2Eテスト**: HTMLレポートとスクリーンショット
- **統合テスト**: 精度測定結果の出力

## トラブルシューティング

### よくある問題

1. **E2Eテストの失敗**
   - 開発サーバーが起動していることを確認
   - ポート5173が利用可能であることを確認

2. **オーディオテストの失敗**
   - ブラウザの自動再生ポリシーを確認
   - ユーザージェスチャーが適切に実行されているか確認

3. **タイマー精度テストの失敗**
   - システムの負荷状況を確認
   - 他のプロセスがCPUを占有していないか確認

4. **localStorage テストの失敗**
   - ブラウザの設定でlocalStorageが有効になっているか確認
   - プライベートモードでないことを確認

### デバッグ方法

1. **E2Eテスト**: `--headed`フラグでブラウザを表示
2. **統合テスト**: `console.log`でタイミングを確認
3. **単体テスト**: `test.only`で特定のテストのみ実行

## 今後の拡張

### 追加予定のテスト
- アクセシビリティテスト (axe-core)
- 視覚回帰テスト (Percy/Chromatic)
- パフォーマンス回帰テスト (Lighthouse CI)
- セキュリティテスト (OWASP ZAP)

### メトリクス収集
- テスト実行時間の追跡
- フレイキーテストの検出
- カバレッジトレンドの監視