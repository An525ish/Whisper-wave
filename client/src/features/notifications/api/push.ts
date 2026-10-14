import { api } from '@/shared/lib/api/client';
import type { PushConfig } from '../types';

export const getPushConfig = () => api.get<PushConfig>('/push/config');

export const registerPushDevice = (token: string) =>
  api.put<void>('/push/devices', { token, platform: 'web' });

export const unregisterPushDevice = (token: string) =>
  api.delete<void>('/push/devices', { token });
