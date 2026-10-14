import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

type Props = {
  /** The Memes flag. Off means no card at all — dark surfaces stay invisible. */
  enabled: boolean;
  onClick: () => void;
};

/**
 * Memes' door on the hub home. Owned here (HUB_PLAN §7.1); the hub only
 * composes it. Its `hw-*` look comes from the hub home's door styles.
 */
const MemesHubCard = ({ enabled, onClick }: Props) => {
  if (!enabled) return null;

  return (
    <Link
      to={ROUTES.memes}
      onClick={onClick}
      className="hw-door hw-glass hw-rim hw-sheen group relative overflow-hidden rounded-3xl p-5 text-left transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
    >
      <div aria-hidden className="hw-door__glow hw-door__glow--memes" />
      <svg viewBox="0 0 64 64" fill="none" aria-hidden className="hw-door__glyph">
        <rect x="12" y="10" width="40" height="34" rx="10" fill="#241a34" stroke="rgba(139,107,255,0.5)" strokeWidth="1.5" />
        <circle cx="24" cy="24" r="2.5" fill="#b6a4ff" />
        <circle cx="40" cy="24" r="2.5" fill="#35e0c8" />
        <path d="M22 34 q10 8 20 0" stroke="#7dffb8" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M8 50 h48" stroke="rgba(1,195,109,0.4)" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 5" />
      </svg>
      <p className="hw-eyebrow mt-4">
        <span aria-hidden className="hw-eyebrow__dot" />
        Shuffled laughs
      </p>
      <h2 className="mt-1.5 font-display text-2xl text-white">Memes</h2>
      <p className="mt-1 text-sm leading-relaxed text-body-300">
        Jokes on shuffle — no feed studying you.
      </p>
      <p className="mt-3 text-sm font-semibold text-green">Open the tap →</p>
    </Link>
  );
};

export default MemesHubCard;
