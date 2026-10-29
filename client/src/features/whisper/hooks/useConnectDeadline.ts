import { CONNECT_TOKEN_TTL_MS } from '../constants';
import { readTokenExpiry } from '../utils/connectToken';
import { useNowWhile } from './useNowWhile';

/**
 * How long a mutual vibe can still be turned into a DM.
 *
 * The deadline is the connectToken's own `exp` (read client-side, unverified —
 * display only; the server enforces it). If the token can't be decoded, fall back
 * to the moment the mutual like landed plus the nominal TTL. Ticks while mounted,
 * so mount it only where the countdown is visible.
 */
export function useConnectDeadline(
  connectToken: string | null,
  mutualAt: number | null,
  tickMs: number
) {
  const deadline =
    readTokenExpiry(connectToken) ?? (mutualAt ? mutualAt + CONNECT_TOKEN_TTL_MS : null);
  const now = useNowWhile(deadline !== null, tickMs);
  const msLeft = deadline === null ? null : Math.max(0, deadline - now);

  return { msLeft, expired: msLeft === 0 };
}
