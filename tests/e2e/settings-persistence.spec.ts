import { test, expect } from '@playwright/test';

test.describe('設定永続化テスト', () => {
  test.beforeEach(async ({ page }) => {
    // localStorageをクリア
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('設定変更とブラウザセッション間の永続化', async ({ page }) => {
    // 設定画面に移動
    await page.getByTestId('settings-button').click();
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // テーマを変更
    await page.getByTestId('theme-picker').selectOption('mint');

    // プログレスモードを経過時間に変更
    await page.getByTestId('progress-mode-toggle').click();
    await expect(page.getByTestId('progress-mode-toggle')).toBeChecked();

    // 音量を50%に変更
    await page.getByTestId('volume-slider').fill('50');

    // メイン画面に戻る
    await page.getByTestId('back-button').click();
    await expect(page.getByTestId('main-timer')).toBeVisible();

    // 設定が適用されていることを確認
    await expect(page.getByTestId('progress-mode-indicator')).toHaveText('elapsed');

    // ページをリロードして設定が永続化されていることを確認
    await page.reload();

    // 設定画面で設定が保持されていることを確認
    await page.getByTestId('settings-button').click();
    await expect(page.getByTestId('theme-picker')).toHaveValue('mint');
    await expect(page.getByTestId('progress-mode-toggle')).toBeChecked();
    await expect(page.getByTestId('volume-slider')).toHaveValue('50');
  });

  test('ベル設定の永続化', async ({ page }) => {
    // ベル設定を変更
    await page.getByTestId('bell-first-time').click();
    await page.fill('[data-testid="bell-first-input"]', '02:30');
    await page.press('[data-testid="bell-first-input"]', 'Enter');

    await page.getByTestId('bell-second-time').click();
    await page.fill('[data-testid="bell-second-input"]', '01:45');
    await page.press('[data-testid="bell-second-input"]', 'Enter');

    await page.getByTestId('bell-third-time').click();
    await page.fill('[data-testid="bell-third-input"]', '00:30');
    await page.press('[data-testid="bell-third-input"]', 'Enter');

    // 2令を無効にする
    await page.getByTestId('bell-second-toggle').click();

    // ページをリロードして設定が保持されていることを確認
    await page.reload();

    await expect(page.getByTestId('bell-first-time')).toContainText('02:30');
    await expect(page.getByTestId('bell-second-time')).toContainText('01:45');
    await expect(page.getByTestId('bell-third-time')).toContainText('00:30');
    
    await expect(page.getByTestId('bell-first-toggle')).toBeChecked();
    await expect(page.getByTestId('bell-second-toggle')).not.toBeChecked();
    await expect(page.getByTestId('bell-third-toggle')).toBeChecked();
  });

  test('タイマー時間設定の永続化', async ({ page }) => {
    // タイマー時間を変更
    await page.getByTestId('time-display').click();
    await page.fill('[data-testid="time-input"]', '15:30');
    await page.press('[data-testid="time-input"]', 'Enter');

    // ページをリロードして時間が保持されていることを確認
    await page.reload();
    await expect(page.getByTestId('time-display')).toContainText('15:30');
  });

  test('localStorage容量制限エラーの処理', async ({ page }) => {
    // localStorageを満杯にする（テスト用）
    await page.evaluate(() => {
      try {
        const largeData = 'x'.repeat(5 * 1024 * 1024); // 5MB
        for (let i = 0; i < 100; i++) {
          localStorage.setItem(`test_${i}`, largeData);
        }
      } catch (e) {
        // 容量制限に達した
      }
    });

    // 設定変更を試行（エラーが発生しても適切に処理されることを確認）
    await page.getByTestId('settings-button').click();
    await page.getByTestId('volume-slider').fill('75');
    await page.getByTestId('back-button').click();

    // アプリが正常に動作し続けることを確認
    await expect(page.getByTestId('main-timer')).toBeVisible();
  });

  test('破損した設定データの処理', async ({ page }) => {
    // 破損したデータをlocalStorageに設定
    await page.evaluate(() => {
      localStorage.setItem('speech-timer-settings', 'invalid-json-data');
    });

    // ページをリロードしてデフォルト設定にフォールバックすることを確認
    await page.reload();
    
    await page.getByTestId('settings-button').click();
    await expect(page.getByTestId('theme-picker')).toHaveValue('mint');
    await expect(page.getByTestId('volume-slider')).toHaveValue('80');
    await expect(page.getByTestId('progress-mode-toggle')).not.toBeChecked();
  });
});