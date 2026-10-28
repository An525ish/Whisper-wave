import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import './homeGames.css';
import './gamesSoon.css';

/**
 * The `/games` page. Games has no playable surface yet (D7), so this is an
 * honest "coming soon" with the way to get there: match with someone first.
 * Reuses the floating pieces from the Home teaser.
 */
const GamesSoon = () => (
  <main className="gs-page">
    <div className="gs-stage">
      <div aria-hidden className="hw-games gs-pieces">
        <span className="hw-games__piece hw-games__piece--die">
          <i /><i /><i /><i /><i />
        </span>
        <span className="hw-games__piece hw-games__piece--ring" />
        <span className="hw-games__piece hw-games__piece--x">×</span>
        <span className="hw-games__piece hw-games__piece--tri" />
        <span className="hw-games__piece hw-games__piece--card">?</span>
      </div>
      <span className="hw-games__soon">Coming soon</span>
      <h1 className="gs-title">
        Games for <span className="hw-iri italic">two.</span>
      </h1>
      <p className="gs-desc">
        Quick games you play with someone you just matched with. Not live yet. Match with someone
        now and you'll be first in line when they are.
      </p>
      <Link to={ROUTES.whisper} className="gs-cta">
        Find someone <span aria-hidden>→</span>
      </Link>
    </div>
  </main>
);

export default GamesSoon;
