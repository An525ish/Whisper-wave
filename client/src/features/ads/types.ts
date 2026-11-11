export type AdPlacement = 'waiting' | 'between';

/** Mirrors `GET /api/ads/config`. When `enabled` is false, nothing else is set. */
export type AdsConfig = {
  enabled: boolean;
  client: string | null;
  slots: Record<AdPlacement, string | null>;
};

export type AdConsent = 'granted' | 'declined';
