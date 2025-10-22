import { expect } from '@playwright/test';

/**
 * E2Eテスト用のヘルパー関数
 */

/**
 * タイマーの時間を設定する
 */
export async function setTimerDuration(page: any, duration: string) {
  await page.getByTestId('time-display').click();
  await page.fill('[data-testid="time-input"]', duration);
  await page.press('[data-testid="time-input"]', 'Enter');
  await expect(page.getByTestId('time-display')).toContainText(duration);
}

/**
 * ベルの時間を設定する
 */
export async function setBellTime(page: any, bellType: 'first' | 'second' | 'third', time: string) {
  await page.getByTestId(`bell-${bellType}-time`).click();
  await page.fill(`[data-testid="bell-${bellType}-input"]`, time);
  await page.press(`[data-testid="bell-${bellType}-input"]`, 'Enter');
  await expect(page.getByTestId(`bell-${bellType}-time`)).toContainText(time);
}

/**
 * ベルのON/OFF状態を切り替える
 */
export async function toggleBell(page: any, bellType: 'first' | 'second' | 'third', enabled: boolean) {
  const toggle = page.getByTestId(`bell-${bellType}-toggle`);
  const currentState = await toggle.isChecked();
  
  if (currentState !== enabled) {
    await toggle.click();
  }
  
  if (enabled) {
    await expect(toggle).toBeChecked();
  } else {
    await expect(toggle).not.toBeChecked();
  }
}

/**
 * タイマーの状態を確認する
 */
export async function expectTimerStatus(page: any, status: 'idle' | 'running' | 'paused' | 'finished') {
  await expect(page.getByTestId('timer-status')).toHaveText(status);
}

/**
 * 設定画面に移動する
 */
export async function navigateToSettings(page: any) {
  await page.getByTestId('settings-button').click();
  await expect(page.getByTestId('settings-page')).toBeVisible();
}

/**
 * メイン画面に戻る
 */
export async function navigateToMain(page: any) {
  await page.getByTestId('back-button').click();
  await expect(page.getByTestId('main-timer')).toBeVisible();
}

/**
 * 音量を設定する
 */
export async function setVolume(page: any, volume: string) {
  await page.getByTestId('volume-slider').fill(volume);
  await expect(page.getByTestId('volume-slider')).toHaveValue(volume);
}

/**
 * プログレスモードを切り替える
 */
export async function toggleProgressMode(page: any, toElapsed: boolean) {
  const toggle = page.getByTestId('progress-mode-toggle');
  const currentState = await toggle.isChecked();
  
  if (currentState !== toElapsed) {
    await toggle.click();
  }
  
  if (toElapsed) {
    await expect(toggle).toBeChecked();
  } else {
    await expect(toggle).not.toBeChecked();
  }
}

/**
 * 時間文字列をミリ秒に変換する
 */
export function timeStringToMs(timeStr: string): number {
  const [minutes, seconds] = timeStr.split(':').map(Number);
  return (minutes * 60 + seconds) * 1000;
}

/**
 * ミリ秒を時間文字列に変換する
 */
export function msToTimeString(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 指定した時間だけ待機する（テスト用）
 */
export async function waitForTime(page: any, ms: number) {
  await page.waitForTimeout(ms);
}

/**
 * タイマーが指定した時間まで進むのを待つ
 */
export async function waitForTimerTime(page: any, expectedTime: string, timeout: number = 5000) {
  await expect(page.getByTestId('time-display')).toContainText(expectedTime, { timeout });
}

/**
 * エラーが発生していないことを確認する
 */
export async function expectNoErrors(page: any) {
  const errors: Error[] = [];
  page.on('pageerror', (error: Error) => errors.push(error));
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      errors.push(new Error(msg.text()));
    }
  });
  
  // 少し待機してエラーをキャッチ
  await page.waitForTimeout(100);
  
  if (errors.length > 0) {
    throw new Error(`Page errors detected: ${errors.map(e => e.message).join(', ')}`);
  }
}

/**
 * ローカルストレージをクリアする
 */
export async function clearLocalStorage(page: any) {
  await page.evaluate(() => localStorage.clear());
}

/**
 * ローカルストレージに値を設定する
 */
export async function setLocalStorage(page: any, key: string, value: string) {
  await page.evaluate(({ key, value }) => {
    localStorage.setItem(key, value);
  }, { key, value });
}

/**
 * ローカルストレージから値を取得する
 */
export async function getLocalStorage(page: any, key: string): Promise<string | null> {
  return await page.evaluate((key) => {
    return localStorage.getItem(key);
  }, key);
}