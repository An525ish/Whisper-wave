import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

type Props = {
  /** Member at zero for today — beached honestly instead of linked to a refusal. */
  quotaExhausted: boolean;
  onClick: () => void;
};

/**
 * Whisper's door on the hub home. Owned here so the surface can evolve alone
 * (HUB_PLAN §7.1); the hub only composes it. Its `hw-*` look comes from the
 * hub home's door styles, which load wherever the hub home renders.
 */
const WhisperHubCard = ({ quotaExhausted, onClick }: Props) => (
  <Link
    to={ROUTES.whisper}
    onClick={onClick}
    className="hw-door hw-glass hw-rim hw-sheen group relative overflow-hidden rounded-3xl p-5 text-left transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
  >
    <div aria-hidden className="hw-door__glow hw-door__glow--whisper" />
    <svg viewBox="0 0 64 64" fill="none" aria-hidden className="hw-door__glyph">
      <rect x="8" y="12" width="34" height="24" rx="12" fill="#8b6bff" opacity="0.9" />
      <rect x="14" y="20" width="16" height="4" rx="2" fill="#efeaf9" opacity="0.85" />
      <rect x="14" y="27" width="22" height="4" rx="2" fill="#efeaf9" opacity="0.45" />
      <rect x="22" y="30" width="34" height="24" rx="12" fill="#35e0c8" opacity="0.9" />
      <rect x="28" y="38" width="22" height="4" rx="2" fill="#04231f" opacity="0.5" />
      <rect x="28" y="45" width="14" height="4" rx="2" fill="#04231f" opacity="0.35" />
      <circle cx="50" cy="12" r="3.5" fill="#01c36d" />
    </svg>
    <p className="hw-eyebrow hw-eyebrow--live mt-4">
      <span aria-hidden className="hw-eyebrow__dot" />
      Anonymous 1-on-1
    </p>
    <h2 className="mt-1.5 font-display text-2xl text-white">Whisper</h2>
    <p className="mt-1 text-sm leading-relaxed text-body-300">
      {quotaExhausted
        ? 'Resting till tomorrow — the wave keeps count.'
        : 'Anonymous, one-to-one, gone when it’s over.'}
    </p>
    <p className="mt-3 text-sm font-semibold text-green">
      {quotaExhausted ? 'Back tomorrow' : 'Find someone →'}
    </p>
  </Link>
);

export default WhisperHubCard;
