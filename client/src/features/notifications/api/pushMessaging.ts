import { PUSH_SW_URL } from '../constants';
import { getStoredPushToken, setStoredPushToken } from '../utils/pushEnvironment';
import type { EnabledPushConfig } from '../types';
import { registerPushDevice, unregisterPushDevice } from './push';

/**
 * Firebase SDK is imported dynamically so it stays out of the main bundle and
 * only loads once the user opts in (or is already opted in).
 */
const loadMessaging = async ({ firebase }: EnabledPushConfig) => {
  const [{ getApp, getApps, initializeApp }, messagingSdk] = await Promise.all([
    import('firebase/app'),
    import('firebase/messaging'),
  ]);
  if (!(await messagingSdk.isSupported())) throw new Error('Push is not supported in this browser');
  const app = getApps().length > 0 ? getApp() : initializeApp(firebase);
  return { sdk: messagingSdk, messaging: messagingSdk.getMessaging(app) };
};

/** Gets (or refreshes) this browser's FCM token and registers it with the server. */
export const registerPush = async (config: EnabledPushConfig): Promise<void> => {
  const registration = await navigator.serviceWorker.register(PUSH_SW_URL);
  await navigator.serviceWorker.ready;
  const { sdk, messaging } = await loadMessaging(config);
  const token = await sdk.getToken(messaging, {
    vapidKey: config.vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error('Could not get a push token');
  await registerPushDevice(token);
  setStoredPushToken(token);
};

/**
 * Best-effort teardown: server row, FCM token, local record. Never throws, so it
 * is safe to await before logout. `config` is optional — without it only the
 * server row and local record are removed.
 */
export const unregisterPush = async (config?: EnabledPushConfig): Promise<void> => {
  const token = getStoredPushToken();
  if (!token) return;
  await unregisterPushDevice(token).catch(() => undefined);
  if (config) {
    await loadMessaging(config)
      .then(({ sdk, messaging }) => sdk.deleteToken(messaging))
      .catch(() => undefined);
  }
  setStoredPushToken(null);
};
