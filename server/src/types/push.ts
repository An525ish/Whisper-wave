import type { Types } from 'mongoose';

export type PushPlatform = 'web';

/** Subset of a Google service-account key that GoogleAuth needs. */
export type FcmServiceAccount = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

/** Raw env values the push feature reads (all optional; empty = unset). */
export type PushEnvInput = {
  FCM_PROJECT_ID: string;
  FCM_SERVICE_ACCOUNT_JSON: string;
  FCM_WEB_API_KEY: string;
  FCM_WEB_APP_ID: string;
  FCM_WEB_SENDER_ID: string;
  FCM_WEB_VAPID_KEY: string;
};

/** Fully-resolved settings; only exists when every value is present and valid. */
export type PushSettings = {
  projectId: string;
  serviceAccount: FcmServiceAccount;
  apiKey: string;
  appId: string;
  senderId: string;
  vapidKey: string;
};

/** GET /api/push/config response (public web identifiers only). */
export type PublicPushConfig =
  | { enabled: false }
  | {
      enabled: true;
      firebase: {
        apiKey: string;
        projectId: string;
        appId: string;
        messagingSenderId: string;
      };
      vapidKey: string;
    };

/** Data-only message the service worker renders. All values are strings. */
export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  /** Maps to webpush Urgency=high (chat messages) instead of normal. */
  urgent: boolean;
};

/** What a send path attaches to a RealtimeNotify; the dispatcher builds the payload. */
export type PushIntent =
  | { kind: 'message'; senderName: string; hasAttachment: boolean; forwarded?: boolean }
  | { kind: 'request'; senderName: string }
  /** Your friend request was accepted; `accepterName` is their public account name. */
  | { kind: 'request-accepted'; accepterName: string }
  /** `displayName` is the peer's identity-card name, already public to the recipient. */
  | { kind: 'connection'; displayName: string }
  /** Room reminder fired; `title` is the public room title. */
  | { kind: 'room-open'; slug: string; title: string }
  /** A listening room is waiting for a mod. `waiting` is a head count — never identities or text. */
  | { kind: 'mod-needed'; slug: string; title: string; waiting: number };

export type FcmSendResult = 'ok' | 'invalid-token' | 'error';

export type FcmSendDeps = {
  fetch: typeof fetch;
  getAccessToken: () => Promise<string>;
};

export type FcmSender = {
  send: (token: string, payload: PushPayload) => Promise<FcmSendResult>;
};

export type PushThrottle = {
  /** True when a push for (userId, tag) may go out now; records it if so. `windowMs` overrides the default window for this tag. */
  allow: (userId: string, tag: string, windowMs?: number) => boolean;
};

export type PushChatInfo = {
  members: string[];
  groupChat: boolean;
  name: string;
};

export type PushDispatchDeps = {
  enabled: boolean;
  sender: FcmSender;
  throttle: PushThrottle;
  loadChat: (chatId: string) => Promise<PushChatInfo | null>;
  loadTokens: (userIds: string[]) => Promise<string[]>;
  removeTokens: (tokens: string[]) => Promise<void>;
};

export type RegisterPushDeviceInput = {
  userId: string;
  token: string;
  platform: PushPlatform;
  userAgent: string;
};

export type IPushDeviceFields = {
  userId: Types.ObjectId;
  token: string;
  platform: PushPlatform;
  userAgent: string;
  lastSeenAt: Date;
};

export type PushDeviceRecord = IPushDeviceFields & { _id: Types.ObjectId };
