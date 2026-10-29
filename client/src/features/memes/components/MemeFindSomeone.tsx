import { Link } from 'react-router-dom';
import { track } from '@/shared/lib/analytics';
import { ROUTES } from '@/shared/constants/routes';
import { MEME_EVENTS } from '../constants';
import './memesStates.css';

/** Every N jokes: a way back into the funnel, honestly labelled. */
const MemeFindSomeone = () => (
  <div className="mm-cta mm-rise">
    <span className="mm-cta__orb" aria-hidden>
      <svg viewBox="0 0 32 32" fill="none">
        <circle cx="11" cy="13" r="6" fill="#1d1530" stroke="#8b6bff" strokeWidth="1.8" />
        <circle cx="21" cy="13" r="6" fill="#122b28" stroke="#35e0c8" strokeWidth="1.8" />
        <path
          d="M6 26 q5 -6 10 0 M16 26 q5 -6 10 0"
          stroke="rgba(235,236,236,0.4)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
    <p className="mm-cta__title">Feel like talking?</p>
    <p className="mm-cta__sub">Boredom is a great matchmaker.</p>
    <Link
      to={ROUTES.whisper}
      onClick={() => track(MEME_EVENTS.CTA_CLICK, { card: 'find_someone' })}
      className="mm-cta__btn"
    >
      Find someone →
    </Link>
  </div>
);

export default MemeFindSomeone;
