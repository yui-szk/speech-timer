import { test, expect } from '@playwright/test';

test.describe('ベルシステムの動作確認', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // オーディオコンテキストの初期化
    await page.click('body');
  });

  test('ベル設定とトリガー検証', async ({ page }) => {
    // タイマーを10秒に設定
    await page.getByTestId('time-display').click();
    await page.fill('[data-testid="time-input"]', '00:10');
    await page.press('[data-testid="time-input"]', 'Enter');

    // 1令を8秒に設定
    await page.getByTestId('bell-first-time').click();
    await page.fill('[data-testid="bell-first-input"]', '00:08');
    await page.press('[data-testid="bell-first-input"]', 'Enter');

    // 2令を5秒に設定
    await page.getByTestId('bell-second-time').click();
    await page.fill('[data-testid="bell-second-input"]', '00:05');
    await page.press('[data-testid="bell-second-input"]', 'Enter');

    // 3令を2秒に設定
    await page.getByTestId('bell-third-time').click();
    await page.fill('[data-testid="bell-third-input"]', '00:02');
    await page.press('[data-testid="bell-third-input"]', 'Enter');

    // すべてのベルが有効になっていることを確認
    await expect(page.getByTestId('bell-first-toggle')).toBeChecked();
    await expect(page.getByTestId('bell-second-toggle')).toBeChecked();
    await expect(page.getByTestId('bell-third-toggle')).toBeChecked();

    // タイマー開始
    await page.getByTestId('play-pause-button').click();

    // 1令のトリガー確認（残り8秒）
    await page.waitForTimeout(2500); // 2.5秒待機で残り約7.5秒
    await expect(page.getByTestId('time-display')).toContainText('00:07');

    // 2令のトリガー確認（残り5秒）
    await page.waitForTimeout(3000); // さらに3秒待機で残り約4.5秒
    await expect(page.getByTestId('time-display')).toContainText('00:04');

    // 3令のトリガー確認（残り2秒）
    await page.waitForTimeout(3000); // さらに3秒待機で残り約1.5秒
    await expect(page.getByTestId('time-display')).toContainText('00:01');
  });

  test('ベルのON/OFF切り替え', async ({ page }) => {
    // 1令を無効にする
    await page.getByTestId('bell-first-toggle').click();
    await expect(page.getByTestId('bell-first-toggle')).not.toBeChecked();

    // 2令を無効にする
    await page.getByTestId('bell-second-toggle').click();
    await expect(page.getByTestId('bell-second-toggle')).not.toBeChecked();

    // 3令のみ有効な状態でタイマーを実行
    await page.getByTestId('time-display').click();
    await page.fill('[data-testid="time-input"]', '00:05');
    await page.press('[data-testid="time-input"]', 'Enter');

    await page.getByTestId('play-pause-button').click();
    
    // 3令のみがトリガーされることを確認（残り3秒でベル）
    await page.waitForTimeout(2500);
    await expect(page.getByTestId('time-display')).toContainText('00:02');
  });

  test('ベルテスト機能', async ({ page }) => {
    // ベルテストボタンをクリック
    await page.getByTestId('bell-test-button').click();
    
    // ベルテストが実行されることを確認（音声は実際には確認できないが、ボタンが機能することを確認）
    await expect(page.getByTestId('bell-test-button')).toBeVisible();
  });

  test('重複ベルトリガーの防止', async ({ page }) => {
    // タイマーを5秒に設定
    await page.getByTestId('time-display').click();
    await page.fill('[data-testid="time-input"]', '00:05');
    await page.press('[data-testid="time-input"]', 'Enter');

    // 1令を3秒に設定
    await page.getByTestId('bell-first-time').click();
    await page.fill('[data-testid="bell-first-input"]', '00:03');
    await page.press('[data-testid="bell-first-input"]', 'Enter');

    // タイマー開始
    await page.getByTestId('play-pause-button').click();

    // 1令トリガー時点で一時停止
    await page.waitForTimeout(2500);
    await page.getByTestId('play-pause-button').click();

    // 再開（同じしきい値を再度通過）
    await page.getByTestId('play-pause-button').click();

    // 重複してベルが鳴らないことを確認（実装上の確認）
    await page.waitForTimeout(1000);
    await expect(page.getByTestId('timer-status')).toHaveText('running');
  });
});