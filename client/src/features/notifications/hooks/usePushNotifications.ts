import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import useErrors from '@/shared/hooks/useError';
import { registerPush, unregisterPush } from '../api/pushMessaging';
import { derivePushUiState, readPushSnapshot } from '../utils/pushEnvironment';
import type { PushUiState } from '../types';
import { usePushConfigQuery } from './usePushConfigQuery';

/** Drives the opt-in toggle. The permission prompt only ever fires from `enable`. */
export function usePushNotifications(): {
  state: PushUiState;
  isPending: boolean;
  enable: () => void;
  disable: () => void;
} {
  const { data } = usePushConfigQuery();
  const enabledConfig = data ?? undefined;
  const [snapshot, setSnapshot] = useState(readPushSnapshot);
  const refresh = () => setSnapshot(readPushSnapshot());

  const enableMutation = useMutation({
    mutationFn: async () => {
      if (!enabledConfig) return;
      const permission = await Notification.requestPermission();
      if (permission === 'granted') await registerPush(enabledConfig);
    },
    onSettled: refresh,
  });

  const disableMutation = useMutation({
    mutationFn: () => unregisterPush(enabledConfig),
    onSettled: refresh,
  });

  useErrors([
    { error: enableMutation.error, isError: enableMutation.isError },
    { error: disableMutation.error, isError: disableMutation.isError },
  ]);

  return {
    state: derivePushUiState(Boolean(enabledConfig), snapshot),
    isPending: enableMutation.isPending || disableMutation.isPending,
    enable: enableMutation.mutate,
    disable: disableMutation.mutate,
  };
}
