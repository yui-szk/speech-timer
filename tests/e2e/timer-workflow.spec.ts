import { test, expect } from '@playwright/test';

test.describe('完全なタイマーワークフロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // オーディオコンテキストの初期化のためにページをクリック
    await page.click('body');
  });

  test('基本的なタイマー操作フロー', async ({ page }) => {
    // 初期状態の確認
    await expect(page.getByTestId('timer-status')).toHaveText('idle');
    await expect(page.getByTestId('time-display')).toContainText('10:00');

    // 時間を5分に設定
    await page.getByTestId('time-display').click();
    await page.fill('[data-testid="time-input"]', '05:00');
    await page.press('[data-testid="time-input"]', 'Enter');
    
    await expect(page.getByTestId('time-display')).toContainText('05:00');

    // タイマー開始
    await page.getByTestId('play-pause-button').click();
    await expect(page.getByTestId('timer-status')).toHaveText('running');

    // 少し待機してタイマーが動作していることを確認
    await page.waitForTimeout(1100);
    await expect(page.getByTestId('time-display')).toContainText('04:58');

    // 一時停止
    await page.getByTestId('play-pause-button').click();
    await expect(page.getByTestId('timer-status')).toHaveText('paused');

    // 現在の時間を記録
    const pausedTime = await page.getByTestId('time-display').textContent();

    // 少し待機して時間が止まっていることを確認
    await page.waitForTimeout(1000);
    await expect(page.getByTestId('time-display')).toHaveText(pausedTime || '');

    // 再開
    await page.getByTestId('play-pause-button').click();
    await expect(page.getByTestId('timer-status')).toHaveText('running');

    // リセット
    await page.getByTestId('reset-button').click();
    await expect(page.getByTestId('timer-status')).toHaveText('idle');
    await expect(page.getByTestId('time-display')).toContainText('05:00');
  });

  test('キーボードショートカット操作', async ({ page }) => {
    // 時間を2分に設定
    await page.getByTestId('time-display').click();
    await page.fill('[data-testid="time-input"]', '02:00');
    await page.press('[data-testid="time-input"]', 'Enter');

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

  test('プログレスバーの動作確認', async ({ page }) => {
    // 時間を30秒に設定
    await page.getByTestId('time-display').click();
    await page.fill('[data-testid="time-input"]', '00:30');
    await page.press('[data-testid="time-input"]', 'Enter');

    // タイマー開始
    await page.getByTestId('play-pause-button').click();

    // プログレスバーが存在することを確認
    const progressBar = page.getByTestId('circular-progress');
    await expect(progressBar).toBeVisible();

    // 少し待機してプログレスが変化することを確認
    await page.waitForTimeout(2000);
    
    // プログレスバーのstroke-dashoffsetが変化していることを確認
    const strokeDashOffset = await progressBar.locator('circle').nth(1).getAttribute('stroke-dashoffset');
    expect(strokeDashOffset).not.toBe('0');
  });

  test('タイマー完了時の動作', async ({ page }) => {
    // 時間を3秒に設定（テスト用に短時間）
    await page.getByTestId('time-display').click();
    await page.fill('[data-testid="time-input"]', '00:03');
    await page.press('[data-testid="time-input"]', 'Enter');

    // タイマー開始
    await page.getByTestId('play-pause-button').click();

    // タイマー完了まで待機
    await expect(page.getByTestId('timer-status')).toHaveText('finished', { timeout: 5000 });
    await expect(page.getByTestId('time-display')).toContainText('00:00');
  });
});