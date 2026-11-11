import { api } from '@/shared/lib/api/client';
import type { ApiSuccess } from '@/shared/types';
import type { AdsConfig } from '../types';

export const getAdsConfig = async (): Promise<AdsConfig> =>
  (await api.get<ApiSuccess<AdsConfig> & { data: AdsConfig }>('/ads/config')).data;
