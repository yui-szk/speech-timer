import { vi } from 'vitest';

/**
 * 統合テスト用のモックヘルパー関数
 */

/**
 * performance.nowのモックを作成する
 */
export function createPerformanceMock() {
  const mockPerformanceNow = vi.fn();
  
  Object.defineProperty(global, 'performance', {
    value: { now: mockPerformanceNow },
    writable: true
  });
  
  return mockPerformanceNow;
}

/**
 * requestAnimationFrameのモックを作成する
 */
export function createRAFMock() {
  const mockRAF = vi.fn();
  const mockCancelRAF = vi.fn();
  
  Object.defineProperty(global, 'requestAnimationFrame', {
    value: mockRAF,
    writable: true
  });
  
  Object.defineProperty(global, 'cancelAnimationFrame', {
    value: mockCancelRAF,
    writable: true
  });
  
  return { mockRAF, mockCancelRAF };
}

/**
 * Web Audio APIのモックを作成する
 */
export function createAudioMock() {
  const mockAudioContext = {
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 0 },
      type: 'sine'
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: { value: 1 }
    })),
    destination: {},
    currentTime: 0,
    state: 'running',
    resume: vi.fn()
  };
  
  Object.defineProperty(global, 'AudioContext', {
    value: vi.fn(() => mockAudioContext),
    writable: true
  });
  
  Object.defineProperty(global, 'webkitAudioContext', {
    value: vi.fn(() => mockAudioContext),
    writable: true
  });
  
  return mockAudioContext;
}

/**
 * localStorageのモックを作成する
 */
export function createLocalStorageMock() {
  const storage = new Map<string, string>();
  
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => storage.get(key) || null),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
    }),
    clear: vi.fn(() => {
      storage.clear();
    }),
    length: 0,
    key: vi.fn()
  };
  
  Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });
  
  return { mockLocalStorage, storage };
}

/**
 * タイマーの時間進行をシミュレートする
 */
export class TimerSimulator {
  private currentTime: number = 0;
  private performanceMock: ReturnType<typeof vi.fn>;
  
  constructor(performanceMock: ReturnType<typeof vi.fn>) {
    this.performanceMock = performanceMock;
    this.performanceMock.mockReturnValue(this.currentTime);
  }
  
  /**
   * 指定した時間だけ進める
   */
  advance(ms: number) {
    this.currentTime += ms;
    this.performanceMock.mockReturnValue(this.currentTime);
  }
  
  /**
   * 絶対時間を設定する
   */
  setTime(ms: number) {
    this.currentTime = ms;
    this.performanceMock.mockReturnValue(this.currentTime);
  }
  
  /**
   * 現在時間を取得する
   */
  getCurrentTime(): number {
    return this.currentTime;
  }
  
  /**
   * タイマーをリセットする
   */
  reset() {
    this.currentTime = 0;
    this.performanceMock.mockReturnValue(this.currentTime);
  }
}

/**
 * ベルトリガーのテストヘルパー
 */
export class BellTriggerTester {
  private bellCalls: Array<{ time: number; type: string }> = [];
  private mockPlayBell: ReturnType<typeof vi.fn>;
  
  constructor(mockPlayBell: ReturnType<typeof vi.fn>) {
    this.mockPlayBell = mockPlayBell;
    this.mockPlayBell.mockImplementation(() => {
      this.bellCalls.push({
        time: performance.now(),
        type: 'bell'
      });
    });
  }
  
  /**
   * ベルが呼ばれた回数を取得する
   */
  getBellCallCount(): number {
    return this.bellCalls.length;
  }
  
  /**
   * ベルが呼ばれた時間のリストを取得する
   */
  getBellCallTimes(): number[] {
    return this.bellCalls.map(call => call.time);
  }
  
  /**
   * ベル呼び出しをリセットする
   */
  reset() {
    this.bellCalls = [];
    this.mockPlayBell.mockClear();
  }
  
  /**
   * 指定した時間にベルが呼ばれたかを確認する
   */
  wasCalledAt(time: number, tolerance: number = 50): boolean {
    return this.bellCalls.some(call => 
      Math.abs(call.time - time) <= tolerance
    );
  }
}

/**
 * 精度テスト用のヘルパー
 */
export class PrecisionTester {
  private measurements: Array<{
    expected: number;
    actual: number;
    error: number;
    timestamp: number;
  }> = [];
  
  /**
   * 測定値を記録する
   */
  record(expected: number, actual: number) {
    const error = Math.abs(actual - expected);
    this.measurements.push({
      expected,
      actual,
      error,
      timestamp: performance.now()
    });
  }
  
  /**
   * 最大誤差を取得する
   */
  getMaxError(): number {
    return Math.max(...this.measurements.map(m => m.error));
  }
  
  /**
   * 平均誤差を取得する
   */
  getAverageError(): number {
    const totalError = this.measurements.reduce((sum, m) => sum + m.error, 0);
    return totalError / this.measurements.length;
  }
  
  /**
   * 指定した許容誤差内の測定値の割合を取得する
   */
  getAccuracyRate(tolerance: number): number {
    const accurateCount = this.measurements.filter(m => m.error <= tolerance).length;
    return accurateCount / this.measurements.length;
  }
  
  /**
   * 測定結果をリセットする
   */
  reset() {
    this.measurements = [];
  }
  
  /**
   * 測定結果の統計を取得する
   */
  getStats() {
    return {
      count: this.measurements.length,
      maxError: this.getMaxError(),
      averageError: this.getAverageError(),
      accuracyRate50ms: this.getAccuracyRate(50),
      accuracyRate100ms: this.getAccuracyRate(100)
    };
  }
}