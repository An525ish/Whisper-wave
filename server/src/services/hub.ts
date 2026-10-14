import { env } from '../config/env.js';
import * as overrideRepo from '../repositories/featureOverride.js';
import { logger } from '../utils/logger.js';
import type { FeatureChangeListener, HubFeatures, HubSummary } from '../types/index.js';

/** The surfaces switched on for this deploy, straight from validated env. */
const envFeatures: HubFeatures = {
  rooms: env.FEATURE_ROOMS,
  games: env.FEATURE_GAMES,
  memes: env.FEATURE_MEMES,
  privateRooms: env.FEATURE_PRIVATE_ROOMS,
};

/**
 * Runtime kill-switch overrides (env stays the default, an override wins, null
 * clears). Held in memory so `getHubSummary` stays synchronous; mirrored to
 * Mongo so a restart does not silently re-enable a surface an admin shut off.
 */
const overrides = new Map<keyof HubFeatures, boolean>();
const listeners = new Set<FeatureChangeListener>();

/** Writes only start after boot hydration — unit tests never touch Mongo. */
let persistent = false;
let writes: Promise<void> = Promise.resolve();

const effective = (feature: keyof HubFeatures): boolean =>
  overrides.get(feature) ?? envFeatures[feature];

/** Load persisted overrides. Call once at boot, after the DB connects, before listen. */
export const hydrateFeatureOverrides = async (): Promise<void> => {
  for (const { feature, enabled } of await overrideRepo.listAll()) overrides.set(feature, enabled);
  persistent = true;
};

/** Await in-flight override writes (graceful shutdown). Never rejects. */
export const flushFeatureOverrides = (): Promise<void> => writes;

/** Subscribe to effective-state changes. Returns an unsubscribe. */
export const onFeatureChange = (listener: FeatureChangeListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Set or clear (null) an override. The in-memory switch applies immediately and
 * the write is queued: the kill-switch must work even while Mongo is down, so a
 * failed write is logged loudly instead of blocking the flip.
 */
export const setFeatureFlag = (
  feature: keyof HubFeatures,
  enabled: boolean | null
): HubFeatures => {
  const before = effective(feature);
  if (enabled === null) overrides.delete(feature);
  else overrides.set(feature, enabled);
  if (persistent) {
    writes = writes
      .then(() => (enabled === null ? overrideRepo.clear(feature) : overrideRepo.upsert(feature, enabled)))
      .catch((err: unknown) =>
        logger.error({ err, feature }, 'Feature override NOT persisted — a restart will revert it')
      );
  }
  const after = effective(feature);
  if (after !== before) {
    for (const listener of listeners) {
      try {
        listener(feature, after);
      } catch (err) {
        logger.error({ err, feature }, 'Feature change listener failed');
      }
    }
  }
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

/** Is this surface switched on right now (env flag, or the runtime kill-switch override)? */
export const isFeatureEnabled = (feature: keyof HubFeatures): boolean =>
  getHubSummary().features[feature];
