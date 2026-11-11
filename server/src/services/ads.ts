import { env } from '../config/env.js';
import { hasPass } from './user/entitlements.js';

/** What the client needs to render an ad slot. Never contains anything personal. */
export type AdsConfig = {
  enabled: boolean;
  client: string | null;
  slots: { waiting: string | null; between: string | null };
};

type AdsEnv = { client: string; waiting: string; between: string };

const OFF: AdsConfig = { enabled: false, client: null, slots: { waiting: null, between: null } };

/** Pure: turn env + "does this person hold a pass" into the client config. Exported for tests. */
export const buildAdsConfig = (cfg: AdsEnv, pass: boolean): AdsConfig => {
  if (pass || !cfg.client || (!cfg.waiting && !cfg.between)) return OFF;
  return {
    enabled: true,
    client: cfg.client,
    slots: { waiting: cfg.waiting || null, between: cfg.between || null },
  };
};

const fromEnv = (): AdsEnv => ({
  client: env.ADSENSE_CLIENT_ID,
  waiting: env.ADSENSE_SLOT_WAITING,
  between: env.ADSENSE_SLOT_BETWEEN,
});

/** Are ads configured for this deploy at all (ignores who is asking)? Drives CSP and ads.txt. */
export const adsConfigured = (): boolean => buildAdsConfig(fromEnv(), false).enabled;

/** Config for one visitor. A Spark Pass holder gets none: that is the "no ads" perk. */
export const getAdsConfig = async (userId: string | undefined): Promise<AdsConfig> => {
  if (!adsConfigured()) return OFF;
  return buildAdsConfig(fromEnv(), await hasPass(userId));
};

/**
 * `/ads.txt` body. AdSense requires it at the site root to confirm who may sell
 * this site's ad space. The trailing id is Google's fixed certification authority id.
 */
export const adsTxt = (client: string = env.ADSENSE_CLIENT_ID): string =>
  `google.com, ${client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`;
