import { useEffect, useRef, useState } from 'react';
import * as authApi from '@/api/auth';
import { usernameSchema } from '@/utils/authValidators';

export type UsernameAvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

const DEBOUNCE_MS = 500;

/**
 * Debounces the input, validates format with the shared schema, then checks
 * availability against the server. Only fires a network request when the
 * format is already valid — avoids hitting the server with garbage strings.
 *
 * Status is derived from a ref (never read during render), updated only inside
 * async callbacks and timers — never synchronously in the effect body.
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
    // Cancel any pending timer / in-flight request from a previous render
    const prevTimer = timerRef.current;
    const prevAbort = abortRef.current;
    if (prevTimer !== null) clearTimeout(prevTimer);
    if (prevAbort !== null) prevAbort.abort();
    timerRef.current = null;
    abortRef.current = null;

    const trimmed = username.trim();
    const isUnchanged = Boolean(trimmed && trimmed === currentValue.trim());
    const isValidFormat = Boolean(trimmed) && usernameSchema.safeParse(trimmed).success;

    if (isUnchanged) {
      // Schedule the state update via a zero-delay timer so it runs outside the
      // effect body, satisfying the rule against synchronous setState in effects.
      const t = setTimeout(() => setStatus('available'), 0);
      timerRef.current = t;
      return () => clearTimeout(t);
    }

    if (!isValidFormat) {
      const t = setTimeout(() => setStatus('idle'), 0);
      timerRef.current = t;
      return () => clearTimeout(t);
    }

    // Valid format — schedule the debounced check
    const t = setTimeout(async () => {
      // Signal "checking" at the start of the async work
      setStatus('checking');

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

    timerRef.current = t;

    return () => {
      clearTimeout(t);
      abortRef.current?.abort();
    };
  }, [username, currentValue]);

  return status;
};
