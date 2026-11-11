import './pricing.css';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';
import { ROUTES } from '@/shared/constants/routes';
import { useActivateBoost } from '../hooks/useActivateBoost';
import { usePassCheckout } from '../hooks/usePassCheckout';
import { useEntitlementsQuery, usePlansQuery } from '../hooks/usePassQueries';
import { boostLeftLabel, formatRupees } from '../utils/pricing';

/** Boosts on the pricing page: balance, what one does, packs to buy, and a use button. */
export default function BoostSection() {
  const signedIn = useAuthStore((s) => s.user !== null);
  const plans = usePlansQuery();
  const boost = useEntitlementsQuery().data?.boost;
  const { buy, busy } = usePassCheckout();
  const activate = useActivateBoost();

  if (!plans.data) return null;
  const { boosts, boostMinutes, enabled } = plans.data;
  const left = boostLeftLabel(boost?.activeUntil ?? null);

  return (
    <section className="pricing-boost" aria-labelledby="pricing-boost-title">
      <h2 id="pricing-boost-title" className="pricing-section-title font-display">
        <span aria-hidden>⚡</span> Boosts
      </h2>
      <p className="pricing-boost__sub">
        A boost puts you first in line for {boostMinutes} minutes. It helps most when several people are waiting. You
        do not need a pass, and a boost never overrides who you asked to meet.
      </p>

      {signedIn && boost && (
        <div className="pricing-boost__status" role="status">
          <span>
            <strong>{boost.credits}</strong> {boost.credits === 1 ? 'boost' : 'boosts'} left
            {left && <> · running, {left}</>}
          </span>
          <button
            type="button"
            className="pricing-boost__use"
            disabled={boost.credits < 1 || activate.isPending}
            onClick={() => activate.mutate()}
          >
            {activate.isPending ? 'Boosting…' : left ? 'Add 30 more minutes' : 'Use a boost'}
          </button>
        </div>
      )}

      <div className="pricing-boost__packs">
        {boosts.map((pack) => (
          <div key={pack.id} className="pricing-boost__pack">
            <span className="pricing-boost__label">{pack.label}</span>
            <span className="pricing-boost__price">{formatRupees(pack.amountPaise)}</span>
            <span className="pricing-boost__each">{formatRupees(pack.amountPaise / pack.credits)} each</span>
            {!enabled ? (
              <button type="button" className="pricing-boost__buy" disabled>Opening soon</button>
            ) : signedIn ? (
              <button type="button" className="pricing-boost__buy" disabled={busy} onClick={() => void buy(pack.id)}>
                Buy
              </button>
            ) : (
              <Link to={ROUTES.auth} className="pricing-boost__buy">Sign in to buy</Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
