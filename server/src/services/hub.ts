import { env } from '../config/env.js';
import type { HubFeatures, HubSummary } from '../types/index.js';

/** The surfaces switched on for this deploy, straight from validated env. */
const envFeatures: HubFeatures = {
  rooms: env.FEATURE_ROOMS,
  games: env.FEATURE_GAMES,
  memes: env.FEATURE_MEMES,
};

/**
 * Runtime kill-switch overrides. A deploy restart resets to env — the flags
 * are the durable state, this is the incident switch (< 60 s, no deploy).
 */
const overrides = new Map<keyof HubFeatures, boolean>();

export const setFeatureFlag = (
  feature: keyof HubFeatures,
  enabled: boolean | null
): HubFeatures => {
  if (enabled === null) overrides.delete(feature);
  else overrides.set(feature, enabled);
  return getHubSummary().features;
};

/**
 * What the hub home renders from.
 *
 * Only flags for now. Live counts (whisper queue size, room occupancy, quota)
 * join this payload as their surfaces land, each cached in-process for a few
 * seconds so a busy home page can never turn into Redis/Mongo load.
 */
export const getHubSummary = (features: HubFeatures = envFeatures): HubSummary => ({
  features: { ...features, ...Object.fromEntries(overrides) },
});
