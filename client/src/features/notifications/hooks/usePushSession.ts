import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { setBeforeSignOutHandler } from '@/shared/lib/api/authBridge';
import { registerPush, unregisterPush } from '../api/pushMessaging';
import { getStoredPushToken, readPushEnvironment } from '../utils/pushEnvironment';
import { usePushConfigQuery } from './usePushConfigQuery';

/**
 * Mount once inside the authenticated shell. Silently refreshes the FCM token
 * (once per session) for users who already opted in, and unregisters this
 * device before logout clears the auth cookies.
 */
export function usePushSession(): void {
  const { data } = usePushConfigQuery();
  const enabledConfig = data ?? undefined;
  const refreshedRef = useRef(false);

  // Silent refresh: never prompts, failures stay quiet (the toggle shows truth).
  const { mutate: refresh } = useMutation({
    mutationFn: () => (enabledConfig ? registerPush(enabledConfig) : Promise.resolve()),
  });

  useEffect(() => {
    if (!enabledConfig || refreshedRef.current) return;
    const { supported, permission } = readPushEnvironment();
    if (!supported || permission !== 'granted' || !getStoredPushToken()) return;
    refreshedRef.current = true;
    refresh();
  }, [enabledConfig, refresh]);

  useEffect(() => {
    setBeforeSignOutHandler(() => unregisterPush(enabledConfig));
    return () => setBeforeSignOutHandler(null);
  }, [enabledConfig]);
}
