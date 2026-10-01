import { PARTNER_LEFT_AUTO_REQUEUE_MS } from '../hooks/usePartnerLeftPrompt';
import './partnerLeftPrompt.css';

type Props = {
  /** True while the full prompt is showing; false once collapsed to the bar. */
  expanded: boolean;
  partnerName: string;
  onFindSomeoneNew: () => void;
  onStay: () => void;
};

/**
 * What replaces the composer when the partner leaves.
 *
 * Deliberately *not* a disabled input. A greyed-out field says "something is
 * broken"; this says "this thread is over, here is the next move". It also keeps
 * reporting reachable — being matched and then dropped currently makes someone
 * unreportable, which is exactly the case a user most wants to act on.
 */
export default function PartnerLeftPrompt({
  expanded,
  partnerName,
  onFindSomeoneNew,
  onStay,
}: Props) {
  const firstName = partnerName.trim().split(/\s+/)[0] || 'They';
  const seconds = Math.round(PARTNER_LEFT_AUTO_REQUEUE_MS / 1000);

  if (!expanded) {
    return (
      <div className="plp plp--bar">
        <p className="plp__bar-text">That thread ended.</p>
        <button type="button" className="plp__bar-cta" onClick={onFindSomeoneNew}>
          Find someone new
        </button>
      </div>
    );
  }

  return (
    <div className="plp" role="status">
      <p className="plp__lede">
        <strong>{firstName}</strong> is gone. This thread stays readable, but you
        can&apos;t reply to it.
      </p>

      <div className="plp__actions">
        {/* The bar is the countdown: it drains over the auto-requeue window, so
            the pending action is legible without a number ticking in a corner. */}
        <button type="button" className="plp__primary" onClick={onFindSomeoneNew}>
          <span className="plp__primary-label">
            Find someone new
            <span className="plp__primary-hint"> · in {seconds}s</span>
          </span>
          <span
            className="plp__progress"
            style={{ animationDuration: `${PARTNER_LEFT_AUTO_REQUEUE_MS}ms` }}
            aria-hidden
          />
        </button>

        <button type="button" className="plp__secondary" onClick={onStay}>
          Stay here
        </button>
      </div>
    </div>
  );
}