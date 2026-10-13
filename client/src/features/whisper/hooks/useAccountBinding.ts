import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth';
import { useAnonStore } from '../stores/anonStore';

/**
 * Ties the anonymous identity to whoever is signed in.
 *
 * The store outlives route changes, so without this a sign-out followed by
 * someone else's sign-in would hand the next person the previous alias, vibes
 * and (worse) a half-finished match. A different account wipes it.
 */
export function useAccountBinding(): void {
  const userId = useAuthStore((s) => s.user?._id ?? null);
  useEffect(() => {
    useAnonStore.getState().bindOwner(userId);
  }, [userId]);
}
