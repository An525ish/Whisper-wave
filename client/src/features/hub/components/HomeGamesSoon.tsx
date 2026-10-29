import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { HUB_GAMES } from '../constants';
/** Cards in the fan, left to right. Each is a real game from the Games page. */
const FAN_IDS = ['skribbl', 'gartic', 'codenames', 'lichess', 'typeracer'];
/** Angle of each card along the arc, in degrees from straight up. */
const FAN_ANGLE = [-40, -20, 0, 20, 40];

const fan = FAN_IDS.map((id) => HUB_GAMES.find((g) => g.id === id)).filter((g) => g !== undefined);

/**
 * Games band on Home. `/games` is a list of free games on other sites, so this
 * links there. Hub-owned because no feature exists to own it.
 */
const HomeGamesSoon = () => (
  <section aria-label="Games" className="hw-show hw-show--games">
    <div aria-hidden className="hw-show__ghost">Games</div>
    <div className="hw-show__copy hw-games__copy">
      <p className="hw-show__eyebrow">
        <span className="hw-show__num">03</span>
        <span className="hw-games__soon">{HUB_GAMES.length} free games</span>
      </p>
      <h2 className="hw-show__title">
        Play with <span className="hw-iri italic">anyone.</span>
      </h2>
      <p className="hw-show__desc">Draw, guess and race. Pick one and send the link.</p>
      <Link to={ROUTES.games} className="hw-show__go">
        Browse games
      </Link>
    </div>
    <div aria-hidden className="hw-fan">
      {fan.map((g, i) => (
        <div
          key={g.id}
          className="hw-fan__card"
          style={{ '--g': g.hue, '--a': `${FAN_ANGLE[i]}deg` } as CSSProperties}
        >
          <span className="hw-fan__emoji">{g.emoji}</span>
          <span className="hw-fan__name">{g.tag}</span>
        </div>
      ))}
    </div>
  </section>
);

export default HomeGamesSoon;
