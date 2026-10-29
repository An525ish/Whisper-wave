import { api } from '@/shared/lib/api/client';
import type { HubSummary, HubSummaryResponse } from '../types';

/** What the hub home renders from. Unwraps the `{ success, data }` envelope. */
export const getHubSummary = async (): Promise<HubSummary> => {
  const res = await api.get<HubSummaryResponse>('/hub/summary');
  return res.data;
};
