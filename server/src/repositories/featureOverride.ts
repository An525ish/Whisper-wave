import { FeatureOverride } from '../models/featureOverride.js';
import type { FeatureOverrideFields } from '../types/hub.js';

export const listAll = async (): Promise<FeatureOverrideFields[]> =>
  FeatureOverride.find({}).select('feature enabled -_id').lean<FeatureOverrideFields[]>();

export const upsert = async (feature: FeatureOverrideFields['feature'], enabled: boolean): Promise<void> => {
  await FeatureOverride.updateOne({ feature }, { $set: { enabled } }, { upsert: true });
};

export const clear = async (feature: FeatureOverrideFields['feature']): Promise<void> => {
  await FeatureOverride.deleteOne({ feature });
};
