import { api } from '@/shared/lib/api/client';
import type {
  CompleteConnectionResponse,
  ConnectionOrigin,
  PendingListResponse,
} from '../types';

export const completeConnection = (input: { connectToken: string } | { claimId: string }) =>
  api.post<CompleteConnectionResponse>('/connection/complete', input);

/** Everything this account still owes a whisper connection — or is owed. */
export const listPending = () =>
  api.get<PendingListResponse>('/connection/pending');

/** Cancel one pending item. Claims vanish; rows release only my seat. */
export const cancelPending = (id: string) =>
  api.delete<{ success: boolean }>(`/connection/pending/${id}`);

/** The "how we met" story for a DM, or null for an ordinary conversation. */
export const getConnectionOrigin = (chatId: string) =>
  api.get<{ success: boolean; data: { origin: ConnectionOrigin | null } }>(
    `/connection/${chatId}`
  );
