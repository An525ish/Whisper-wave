import { useEffect, useRef, useState } from 'react';
import * as authApi from '@/api/auth';
import { usernameSchema } from '@/utils/authValidators';

export type UsernameAvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

const DEBOUNCE_MS = 500;

/**
 * Debounces the input, validates format with the shared schema, then checks
 * availability against the server.  Only fires a network request when the
 * format is already valid — avoids hitting the server with garbage strings.
 *
 * @param username     - raw value from the form field
 * @param currentValue - pre-filled value (e.g. server-assigned handle); if the
 *                       typed value equals this we skip the check and report
 *                       'available' immediately (user hasn't changed it).
 */
export const useUsernameAvailability = (username: string, currentValue = '') => {
  const [status, setStatus] = useState<UsernameAvailabilityStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    const trimmed = username.trim();

    // Same as the server-assigned starting value → treat as available
    if (trimmed && trimmed === currentValue.trim()) {
      setStatus('available');
      return;
    }

    // Format check — no network call for invalid format
    const parsed = usernameSchema.safeParse(trimmed);
    if (!trimmed || !parsed.success) {
      setStatus('idle');
      return;
    }

    setStatus('checking');

    timerRef.current = setTimeout(async () => {
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await authApi.checkUsernameAvailability(trimmed);
        if (!ac.signal.aborted) {
          setStatus(res.data.available ? 'available' : 'taken');
        }
      } catch {
        if (!ac.signal.aborted) setStatus('error');
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [username, currentValue]);

  return status;
};
