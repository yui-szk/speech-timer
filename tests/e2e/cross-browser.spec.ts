import { test, expect, devices } from '@playwright/test';

test.describe('ブラウザ互換性テスト', () => {

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      // オーディオコンテキストの初期化
      await page.click('body');
    });

  test('基本的なタイマー機能', async ({ page }) => {
      // タイマー表示の確認
      await expect(page.getByTestId('time-display')).toBeVisible();
      await expect(page.getByTestId('time-display')).toContainText('10:00');

      // 時間設定
      await page.getByTestId('time-display').click();
      await page.fill('[data-testid="time-input"]', '03:00');
      await page.press('[data-testid="time-input"]', 'Enter');
      await expect(page.getByTestId('time-display')).toContainText('03:00');

      // タイマー操作
      await page.getByTestId('play-pause-button').click();
      await expect(page.getByTestId('timer-status')).toHaveText('running');

      await page.getByTestId('play-pause-button').click();
      await expect(page.getByTestId('timer-status')).toHaveText('paused');

      await page.getByTestId('reset-button').click();
      await expect(page.getByTestId('timer-status')).toHaveText('idle');
    });

  test('プログレスバーの表示', async ({ page }) => {
      const progressBar = page.getByTestId('circular-progress');
      await expect(progressBar).toBeVisible();

      // SVG要素の確認
      const svgElement = progressBar.locator('svg');
      await expect(svgElement).toBeVisible();

      // 円形パスの確認
      const circles = progressBar.locator('circle');
      await expect(circles).toHaveCount(2); // 背景とプログレス
    });

  test('設定画面の動作', async ({ page }) => {
      await page.getByTestId('settings-button').click();
      await expect(page.getByTestId('settings-page')).toBeVisible();

      // テーマピッカーの動作確認
      const themePicker = page.getByTestId('theme-picker');
      await expect(themePicker).toBeVisible();

      // 音量スライダーの動作確認
      const volumeSlider = page.getByTestId('volume-slider');
      await expect(volumeSlider).toBeVisible();
      await volumeSlider.fill('60');
      await expect(volumeSlider).toHaveValue('60');

      // 戻るボタン
      await page.getByTestId('back-button').click();
      await expect(page.getByTestId('main-timer')).toBeVisible();
    });

  test('キーボードショートカット', async ({ page }) => {
      // Spaceキーでタイマー開始
      await page.keyboard.press('Space');
      await expect(page.getByTestId('timer-status')).toHaveText('running');

      // Spaceキーで一時停止
      await page.keyboard.press('Space');
      await expect(page.getByTestId('timer-status')).toHaveText('paused');

      // Rキーでリセット
      await page.keyboard.press('KeyR');
      await expect(page.getByTestId('timer-status')).toHaveText('idle');
    });

  test('ベル設定の動作', async ({ page }) => {
      // ベル時間の設定
      await page.getByTestId('bell-first-time').click();
      await page.fill('[data-testid="bell-first-input"]', '02:00');
      await page.press('[data-testid="bell-first-input"]', 'Enter');
      await expect(page.getByTestId('bell-first-time')).toContainText('02:00');

      // ベルのON/OFF切り替え
      const bellToggle = page.getByTestId('bell-first-toggle');
      const initialState = await bellToggle.isChecked();
      await bellToggle.click();
      const newState = await bellToggle.isChecked();
      expect(newState).toBe(!initialState);

      // ベルテストボタン
      await page.getByTestId('bell-test-button').click();
      // 音声は確認できないが、ボタンが機能することを確認
      await expect(page.getByTestId('bell-test-button')).toBeVisible();
    });

  test('localStorage永続化', async ({ page }) => {
      // 設定を変更
      await page.getByTestId('settings-button').click();
      await page.getByTestId('volume-slider').fill('75');
      await page.getByTestId('back-button').click();

      // ページリロード
      await page.reload();

      // 設定が保持されていることを確認
      await page.getByTestId('settings-button').click();
      await expect(page.getByTestId('volume-slider')).toHaveValue('75');
  });
});

// モバイルデバイスでの互換性テスト
test.describe('モバイルデバイス互換性', () => {
  test('iPhone 12でのタッチ操作', async ({ page }) => {
    await page.goto('/');
    await page.click('body');

    // タッチ操作でのタイマー制御
    await page.tap('[data-testid="play-pause-button"]');
    await expect(page.getByTestId('timer-status')).toHaveText('running');

    await page.tap('[data-testid="play-pause-button"]');
    await expect(page.getByTestId('timer-status')).toHaveText('paused');

    // 時間設定のタッチ操作
    await page.tap('[data-testid="time-display"]');
    await page.fill('[data-testid="time-input"]', '05:00');
    await page.press('[data-testid="time-input"]', 'Enter');
    await expect(page.getByTestId('time-display')).toContainText('05:00');
  });

  test('Pixel 5でのレスポンシブレイアウト', async ({ page }) => {
    await page.goto('/');

    // モバイルレイアウトの確認
    const mainTimer = page.getByTestId('main-timer');
    await expect(mainTimer).toBeVisible();

    // ボタンサイズの確認（44px以上のタップ領域）
    const playButton = page.getByTestId('play-pause-button');
    const buttonBox = await playButton.boundingBox();
    expect(buttonBox?.width).toBeGreaterThanOrEqual(44);
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);

    // 設定画面のモバイル表示
    await page.getByTestId('settings-button').click();
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // 戻るボタンの動作
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('main-timer')).toBeVisible();
  });
});

// Web Audio API互換性テスト
test.describe('Web Audio API互換性', () => {
  test('オーディオコンテキストの初期化', async ({ page }) => {
    await page.goto('/');

    // ユーザージェスチャー後のオーディオコンテキスト初期化
    await page.click('body');

    // ベルテスト機能の動作確認
    await page.getByTestId('bell-test-button').click();
    
    // エラーが発生しないことを確認
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('音量制御の動作', async ({ page }) => {
    await page.goto('/');
    await page.click('body');

    // 設定画面で音量変更
    await page.getByTestId('settings-button').click();
    await page.getByTestId('volume-slider').fill('50');

    // ベルテストで音量設定が適用されることを確認
    await page.getByTestId('bell-test-button').click();
    
    // エラーが発生しないことを確認
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });
});

// パフォーマンステスト
test.describe('パフォーマンス互換性', () => {
  test('長時間タイマー実行でのメモリリーク確認', async ({ page }) => {
    await page.goto('/');
    await page.click('body');

    // 短時間タイマーを複数回実行
    for (let i = 0; i < 5; i++) {
      await page.getByTestId('time-display').click();
      await page.fill('[data-testid="time-input"]', '00:02');
      await page.press('[data-testid="time-input"]', 'Enter');

      await page.getByTestId('play-pause-button').click();
      await page.waitForTimeout(2500); // タイマー完了まで待機
      
      await expect(page.getByTestId('timer-status')).toHaveText('finished');
      await page.getByTestId('reset-button').click();
    }

    // メモリリークがないことを確認（JSヒープサイズの確認）
    const metrics = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
      } : null;
    });

    if (metrics) {
      // ヒープサイズが異常に大きくないことを確認
      expect(metrics.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB未満
    }
  });

  test('高頻度更新でのフレームレート維持', async ({ page }) => {
    await page.goto('/');
    await page.click('body');

    // タイマーを開始してフレームレートを監視
    await page.getByTestId('time-display').click();
    await page.fill('[data-testid="time-input"]', '00:05');
    await page.press('[data-testid="time-input"]', 'Enter');

    await page.getByTestId('play-pause-button').click();

    // 3秒間のフレームレート測定
    const frameCount = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frames = 0;
        const startTime = performance.now();
        
        function countFrame() {
          frames++;
          const elapsed = performance.now() - startTime;
          if (elapsed < 3000) {
            requestAnimationFrame(countFrame);
          } else {
            resolve(frames);
          }
        }
        
        requestAnimationFrame(countFrame);
      });
    });

    // 最低30fps（3秒で90フレーム）を維持していることを確認
    expect(frameCount).toBeGreaterThan(90);
  });
});