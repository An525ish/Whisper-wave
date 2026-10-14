/** Hub surfaces that ship dark behind a server flag. Whisper and Chats are always on. */
export type HubFeatures = {
  rooms: boolean;
  games: boolean;
  memes: boolean;
  /** Sub-flag of rooms: creating/joining invite-only members-only rooms. Kill-switch for the abuse surface. */
  privateRooms: boolean;
};

/** `GET /api/hub/summary` — what the hub home needs to decide what to render. */
export type HubSummary = {
  features: HubFeatures;
};

/** One persisted kill-switch override (absence = follow env). */
export type FeatureOverrideFields = {
  feature: keyof HubFeatures;
  enabled: boolean;
};

/** Fired when a surface's EFFECTIVE state changes (override set/cleared). */
export type FeatureChangeListener = (feature: keyof HubFeatures, enabled: boolean) => void;
