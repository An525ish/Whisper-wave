import './pricing.css';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';
import { ROUTES } from '@/shared/constants/routes';
import { useEntitlementsQuery, usePlansQuery } from '../hooks/usePassQueries';
import { usePassCheckout } from '../hooks/usePassCheckout';
import { cheapestPerDay, formatExpiry, formatRupees, timeLeftLabel } from '../utils/pricing';
import type { PlanId } from '../types';
import { useState } from 'react';

const DEFAULT_PLAN: PlanId = 'month';

/**
 * Plan picker + buy button + current-pass status. Every state the money path can
 * be in has a plain answer: loading, buying off, signed out, active, error.
 */
export default function PassCheckout() {
  const signedIn = useAuthStore((s) => s.user !== null);
  const plansQuery = usePlansQuery();
  const entitlements = useEntitlementsQuery();
  const { buy, phase, busy } = usePassCheckout();
  const [picked, setPicked] = useState<PlanId>(DEFAULT_PLAN);

  if (plansQuery.isPending) return <p className="pass-note" role="status">Loading prices…</p>;
  if (plansQuery.isError) {
    return (
      <p className="pass-note" role="alert">
        Couldn&apos;t load prices.{' '}
        <button type="button" className="pass-link" onClick={() => void plansQuery.refetch()}>
          Try again
        </button>
      </p>
    );
  }

  const { plans, enabled } = plansQuery.data;
  const best = cheapestPerDay(plans);
  const plan = plans.find((p) => p.id === picked) ?? plans[0];
  const pass = entitlements.data?.pass;
  const left = pass?.active ? timeLeftLabel(pass.expiresAt) : null;

  const cta = (() => {
    if (!enabled) return <button type="button" className="pass-cta" disabled>Opening soon</button>;
    if (!signedIn) {
      return (
        <Link to={ROUTES.auth} className="pass-cta">
          Sign in to buy
        </Link>
      );
    }
    return (
      <button type="button" className="pass-cta" disabled={busy} onClick={() => void buy(plan.id)}>
        {phase === 'confirming'
          ? 'Confirming payment…'
          : busy
            ? 'Opening checkout…'
            : `${pass?.active ? 'Add' : 'Get'} ${plan.label.toLowerCase()} pass for ${formatRupees(plan.amountPaise)}`}
      </button>
    );
  })();

  return (
    <div className="pass-checkout">
      {left && pass?.expiresAt && (
        <div className="pass-status" role="status">
          <span className="pass-status__icon" aria-hidden>✦</span>
          <div className="pass-status__text">
            <strong>Spark Pass is on</strong>
            <span>Ends {formatExpiry(pass.expiresAt)}. Buying more adds to it.</span>
          </div>
          <span className="pass-status__left">{left}</span>
        </div>
      )}

      <div role="radiogroup" aria-label="Choose a pass length" className="pass-plans">
        {plans.map((p) => {
          const active = p.id === plan.id;
          const perDay = Math.round(p.amountPaise / 100 / p.days);
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={`pass-plan${active ? ' pass-plan--active' : ''}`}
              onClick={() => setPicked(p.id)}
            >
              {best?.id === p.id && <span className="pass-plan__tag">Best value</span>}
              <span className="pass-plan__label">{p.label}</span>
              <span className="pass-plan__price">{formatRupees(p.amountPaise)}</span>
              <span className="pass-plan__length">{p.days === 1 ? '24 hours' : `${p.days} days`}</span>
              <span className="pass-plan__hint">{p.days === 1 ? 'Just today' : `₹${perDay} a day`}</span>
            </button>
          );
        })}
      </div>

      {cta}

      <p className="pass-fine">
        {enabled
          ? 'One payment, no auto-renew. UPI, cards and netbanking through Razorpay. Your pass is tied to your account.'
          : "Buying isn't open yet. Check back soon."}
      </p>
    </div>
  );
}
