import { api } from '@/shared/lib/api/client';
import type { JoinQueuePayload, JoinQueueResponse, WhisperQuotaResponse } from '../types';

export const joinQueue = (payload: JoinQueuePayload) =>
  api.post<JoinQueueResponse>('/match/join', payload);

export const leaveQueue = () =>
  api.delete<{ success: boolean }>('/match/leave');

/** Remaining whispers today (members only — guests are never capped). */
export const getQuota = () => api.get<WhisperQuotaResponse>('/match/quota');
