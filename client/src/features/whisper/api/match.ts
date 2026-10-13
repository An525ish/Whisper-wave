import { api } from '@/shared/lib/api/client';
import type { JoinQueuePayload, JoinQueueResponse } from '../types';

export const joinQueue = (payload: JoinQueuePayload) =>
  api.post<JoinQueueResponse>('/match/join', payload);

export const leaveQueue = () =>
  api.delete<{ success: boolean }>('/match/leave');
