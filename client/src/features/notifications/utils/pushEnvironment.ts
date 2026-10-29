import { PUSH_TOKEN_STORAGE_KEY } from '../constants';
import type { PushEnvironment, PushPermission, PushSnapshot, PushUiState } from '../types';

export const getStoredPushToken = (): string | null => {
  try {
    return localStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setStoredPushToken = (token: string | null): void => {
  try {
    if (token) localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  } catch {
    // Storage blocked (private mode): the token just won't survive a reload.
  }
};

const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const readPushEnvironment = (): PushEnvironment => ({
  supported:
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window,
  permission: 'Notification' in window ? (Notification.permission as PushPermission) : 'default',
  iosNeedsInstall: isIos() && !isStandalone(),
});

export const readPushSnapshot = (): PushSnapshot => ({
  ...readPushEnvironment(),
  hasToken: getStoredPushToken() !== null,
});

/** Pure: which control the notifications panel should render. */
export const derivePushUiState = (
  serverEnabled: boolean,
  snapshot: PushSnapshot,
): PushUiState => {
  if (!serverEnabled) return 'hidden';
  if (!snapshot.supported) return snapshot.iosNeedsInstall ? 'install' : 'unsupported';
  if (snapshot.permission === 'denied') return 'denied';
  return snapshot.permission === 'granted' && snapshot.hasToken ? 'on' : 'off';
};
