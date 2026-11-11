import './pricing.css';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';
import { ROUTES } from '@/shared/constants/routes';
import { useActivateBoost } from '../hooks/useActivateBoost';
import { useEntitlementsQuery, usePlansQuery } from '../hooks/usePassQueries';
import { boostLeftLabel } from '../utils/pricing';

/**
 * One-tap boost for the waiting screen, where it matters. Shows the running boost,
 * a button when there is a credit to spend, or a link to buy some. Nothing for guests
 * or while buying is switched off.
 */
export default function BoostButton() {
  const signedIn = useAuthStore((s) => s.user !== null);
  const enabled = usePlansQuery().data?.enabled ?? false;
  const boost = useEntitlementsQuery().data?.boost;
  const activate = useActivateBoost();

  if (!signedIn || !enabled || !boost) return null;

  const left = boostLeftLabel(boost.activeUntil);
  if (left) {
    return (
      <p className="boost-chip boost-chip--on" role="status">
        <span aria-hidden>⚡</span> Boost on, {left}
      </p>
    );
  }
  if (boost.credits > 0) {
    return (
      <button type="button" className="boost-chip" disabled={activate.isPending} onClick={() => activate.mutate()}>
        <span aria-hidden>⚡</span> {activate.isPending ? 'Boosting…' : `Boost, go first (${boost.credits} left)`}
      </button>
    );
  }
  return (
    <Link to={ROUTES.pricing} className="boost-chip">
      <span aria-hidden>⚡</span> Get a boost
    </Link>
  );
}
