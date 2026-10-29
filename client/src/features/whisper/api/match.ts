import { api } from '@/shared/lib/api/client';
import type { JoinQueuePayload, JoinQueueResponse, WhisperQuotaResponse } from '../types';

export const joinQueue = (payload: JoinQueuePayload) =>
  api.post<JoinQueueResponse>('/match/join', payload);

export const leaveQueue = () =>
  api.delete<{ success: boolean }>('/match/leave');

/** Remaining whispers today (members only — guests are never capped). */
export const getQuota = () => api.get<WhisperQuotaResponse>('/match/quota');

export const ANON_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ANON_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Sign, then PUT one photo straight to R2. Resolves to the key the socket message carries. */
export const uploadAnonImage = async (file: File): Promise<string> => {
  const res = await api.post<{ success: boolean; data: { presignedUrl: string; key: string; mimeType: string } }>(
    '/match/image/sign',
    { mimeType: file.type, size: file.size }
  );
  const { presignedUrl, key, mimeType } = res.data;
  // Content-Type must match what was signed or R2 answers 403.
  const put = await fetch(presignedUrl, { method: 'PUT', headers: { 'Content-Type': mimeType }, body: file });
  if (!put.ok) throw new Error('Upload failed');
  return key;
};
