import { useAuthStore } from '@/features/auth';
import { DAILY_WHISPER_LIMIT } from '../constants';
import './signedInNote.css';

/**
 * Tells a signed-in visitor that their account is carrying this conversation, and
 * what that costs them.
 *
 * Without it Phase C is invisible: the server links the account for blocking,
 * cross-device state and quota, and the person has no idea any of that is
 * happening. Worse, the first sign of it would be being *refused* mid-flow, which
 * reads as a bug rather than a policy.
 *
 * Two deliberate omissions:
 *
 * - **The account's name is never shown next to the alias as if it were the same
 *   thing.** They are separate by design — the alias is what the partner sees, and
 *   defaulting it to the account name would de-anonymise the user to a stranger.
 * - **The counter is not a countdown.** It is a stated allowance, not a claim about
 *   what is left, because the server does not report remaining and inventing a
 *   number from a value the client never received would be a lie on the screen.
 */
export default function SignedInNote() {
  const username = useAuthStore((s) => s.user?.username);
  if (!username) return null;

  return (
    <div className="sin" role="status">
      <span className="sin__who">
        <span className="sin__badge" aria-hidden>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        Signed in as <strong className="sin__name">{username}</strong>
      </span>
      <span className="sin__detail">
        Your alias below stays anonymous to them. Up to {DAILY_WHISPER_LIMIT} whispers
        a day on this account; guests are never limited.
      </span>
    </div>
  );
}
