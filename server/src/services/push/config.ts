import { env } from '../../config/env.js';
import type {
  FcmServiceAccount,
  PublicPushConfig,
  PushEnvInput,
  PushSettings,
} from '../../types/push.js';

const isServiceAccount = (value: unknown): value is FcmServiceAccount => {
  if (typeof value !== 'object' || value === null) return false;
  const rec = value as Record<string, unknown>;
  return typeof rec.client_email === 'string' && typeof rec.private_key === 'string';
};

const tryJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null; // not JSON: caller falls back to base64 or treats it as unset
  }
};

/** Accepts raw JSON or base64 of it. Returns null on anything unusable (never throws, never logs the value). */
export const parseServiceAccount = (raw: string): FcmServiceAccount | null => {
  const text = raw.trim();
  if (!text) return null;
  const direct = tryJson(text);
  const parsed = direct ?? tryJson(Buffer.from(text, 'base64').toString('utf8'));
  return isServiceAccount(parsed) ? parsed : null;
};

/** Pure: every value must be present and the key parseable, else push is off. */
export const resolvePushSettings = (input: PushEnvInput): PushSettings | null => {
  const serviceAccount = parseServiceAccount(input.FCM_SERVICE_ACCOUNT_JSON);
  const projectId = input.FCM_PROJECT_ID.trim();
  const apiKey = input.FCM_WEB_API_KEY.trim();
  const appId = input.FCM_WEB_APP_ID.trim();
  const senderId = input.FCM_WEB_SENDER_ID.trim();
  const vapidKey = input.FCM_WEB_VAPID_KEY.trim();
  if (!serviceAccount || !projectId || !apiKey || !appId || !senderId || !vapidKey) {
    return null;
  }
  return { projectId, serviceAccount, apiKey, appId, senderId, vapidKey };
};

export const toPublicConfig = (settings: PushSettings | null): PublicPushConfig =>
  settings
    ? {
        enabled: true,
        firebase: {
          apiKey: settings.apiKey,
          projectId: settings.projectId,
          appId: settings.appId,
          messagingSenderId: settings.senderId,
        },
        vapidKey: settings.vapidKey,
      }
    : { enabled: false };

/** Resolved once at boot from env. */
export const pushSettings: PushSettings | null = resolvePushSettings(env);
