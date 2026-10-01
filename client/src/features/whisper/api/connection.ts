import { api } from '@/shared/lib/api/client';
import type { CompleteConnectionResponse, ConnectionOrigin } from '../types';

export const completeConnection = (connectToken: string) =>
  api.post<CompleteConnectionResponse>('/connection/complete', { connectToken });

/** The "how we met" story for a DM, or null for an ordinary conversation. */
export const getConnectionOrigin = (chatId: string) =>
  api.get<{ success: boolean; data: { origin: ConnectionOrigin | null } }>(
    `/connection/${chatId}`
  );
