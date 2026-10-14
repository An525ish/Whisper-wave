/** Hub home data model — mirrors `GET /api/hub/summary` on the server. */

/** Hub surfaces that ship dark behind a server flag. Whisper and Chats are always on. */
export type HubFeatures = {
  rooms: boolean;
  games: boolean;
  memes: boolean;
  /** Sub-flag of rooms: invite-only, members-only rooms. */
  privateRooms: boolean;
};

export type HubSummary = {
  features: HubFeatures;
};

export type HubSummaryResponse = {
  success: boolean;
  data: HubSummary;
};
