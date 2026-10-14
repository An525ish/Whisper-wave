import { useState } from 'react';
import { useAuthStore } from '@/features/auth';
import { useMemeMode, useSetMemeMode } from './useMemeMode';

/**
 * The unfiltered switch's decisions: guests are sent to sign in, members
 * confirm 18+ once per enable, turning it off needs nothing. The stored flag
 * flips through the mutation — the switch never touches joke data.
 */
export function useMemeModeSwitch() {
  const user = useAuthStore((s) => s.user);
  const { data: mode } = useMemeMode();
  const setMode = useSetMemeMode();
  const [adultOpen, setAdultOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);

  const on = mode === true;
  const busy = setMode.isPending;

  const flip = () => {
    if (busy) return;
    if (!user) setGuestOpen(true);
    else if (!on) setAdultOpen(true);
    else setMode.mutate({ unfiltered: false });
  };

  const confirmAdult = () => {
    setAdultOpen(false);
    setMode.mutate({ unfiltered: true, confirmAdult: true });
  };

  return {
    on,
    busy,
    flip,
    adultOpen,
    guestOpen,
    confirmAdult,
    closeAdult: () => setAdultOpen(false),
    closeGuest: () => setGuestOpen(false),
  };
}
