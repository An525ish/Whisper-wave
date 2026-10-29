import { GoogleAuth } from 'google-auth-library';
import { FCM_SCOPE, FCM_SEND_URL, PUSH_TTL_SECONDS } from '../../constants/push.js';
import type {
  FcmSendDeps,
  FcmSendResult,
  FcmSender,
  PushPayload,
  PushSettings,
} from '../../types/push.js';
import { logger } from '../../utils/logger.js';

type FcmErrorBody = {
  error?: {
    status?: string;
    message?: string;
    details?: Array<{ errorCode?: string; fieldViolations?: Array<{ field?: string }> }>;
  };
};

const readError = async (res: Response): Promise<FcmErrorBody['error']> => {
  try {
    return ((await res.json()) as FcmErrorBody).error;
  } catch {
    return undefined; // non-JSON error body: classify by status alone
  }
};

/** 404 / UNREGISTERED, or a 400 that blames the token itself, means the token is dead. */
export const isDeadTokenResponse = (
  status: number,
  error: FcmErrorBody['error']
): boolean => {
  if (status === 404) return true;
  const codes = (error?.details ?? []).map((d) => d.errorCode);
  if (codes.includes('UNREGISTERED')) return true;
  if (status !== 400) return false;
  const blamesToken = (error?.details ?? []).some((d) =>
    d.fieldViolations?.some((v) => v.field?.includes('token'))
  );
  return blamesToken || /registration token/i.test(error?.message ?? '');
};

export const buildFcmBody = (token: string, payload: PushPayload) => ({
  message: {
    token,
    // Data-only: no `notification` block, so the service worker renders it.
    data: { title: payload.title, body: payload.body, url: payload.url, tag: payload.tag },
    webpush: {
      headers: { TTL: PUSH_TTL_SECONDS, Urgency: payload.urgent ? 'high' : 'normal' },
    },
  },
});

export const createGoogleAccessToken = (settings: PushSettings): (() => Promise<string>) => {
  // GoogleAuth caches and refreshes the OAuth token internally.
  const auth = new GoogleAuth({ credentials: settings.serviceAccount, scopes: [FCM_SCOPE] });
  return async () => {
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();
    if (!token) throw new Error('FCM access token unavailable');
    return token;
  };
};

export const createFcmSender = (
  settings: PushSettings,
  deps: FcmSendDeps = { fetch, getAccessToken: createGoogleAccessToken(settings) }
): FcmSender => ({
  send: async (token, payload): Promise<FcmSendResult> => {
    try {
      const accessToken = await deps.getAccessToken();
      const res = await deps.fetch(FCM_SEND_URL(settings.projectId), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildFcmBody(token, payload)),
      });
      if (res.ok) return 'ok';
      const error = await readError(res);
      if (isDeadTokenResponse(res.status, error)) return 'invalid-token';
      logger.warn({ status: res.status, fcmStatus: error?.status }, 'FCM send rejected');
      return 'error';
    } catch (err) {
      logger.warn({ err }, 'FCM send failed');
      return 'error';
    }
  },
});
