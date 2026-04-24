// index.html の gtag.js で定義されるグローバル関数
declare function gtag(command: string, eventName: string, params?: Record<string, unknown>): void;

/** GA4 にカスタムイベントを送信する。gtag 未定義時は無視 */
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  try {
    if (typeof gtag === 'function') {
      gtag('event', eventName, params);
    }
  } catch {
    // 開発環境など gtag が存在しない場合は無視
  }
}

/**
 * standalone モード（ホーム画面から起動）を検出してイベント送信。
 * ブラウザから開いた場合は送信しない。
 */
export function trackPwaLaunch() {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  if (isStandalone) {
    trackEvent('pwa_launch');
  }
}
