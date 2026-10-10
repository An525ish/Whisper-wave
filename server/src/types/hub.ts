/** Hub surfaces that ship dark behind a server flag. Whisper and Chats are always on. */
export type HubFeatures = {
  rooms: boolean;
  games: boolean;
  memes: boolean;
};

/** `GET /api/hub/summary` — what the hub home needs to decide what to render. */
export type HubSummary = {
  features: HubFeatures;
};
