import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { HUB_APPS } from '../constants';

const app = HUB_APPS[0];

/**
 * Apps band on Home. Whispr is the one live app, so the picture is its own idea:
 * a sealed envelope with a letter peeking out, stamped with the app's icon.
 * Decorative only; the button is the way in. Reads from `HUB_APPS`, so the copy
 * and colour follow the data.
 */
const HomeAppsBand = () => (
  <section aria-label="Apps" className="hw-show hw-show--apps hw-show--flip" style={{ '--g': app.accent } as CSSProperties}>
    <div aria-hidden className="hw-show__ghost">Apps</div>
    <div className="hw-show__copy hw-apps__copy">
      <p className="hw-show__eyebrow">
        <span className="hw-show__num">04</span>
        <span className="hw-apps__tag">{HUB_APPS.length === 1 ? 'From the same maker' : `${HUB_APPS.length} apps`}</span>
      </p>
      <h2 className="hw-show__title">
        Write it. <span className="hw-iri italic">Send it unsigned.</span>
      </h2>
      <p className="hw-show__desc">{app.name} sends one anonymous confession to someone you know. No account.</p>
      <Link to={ROUTES.apps} className="hw-show__go">
        See {app.name}
      </Link>
    </div>

    <div aria-hidden className="hw-env">
      <span className="hw-env__chip hw-env__chip--a">No account</span>
      <span className="hw-env__chip hw-env__chip--b">Anonymous sender</span>
      <span className="hw-env__chip hw-env__chip--c">Free</span>

      <div className="hw-env__back" />
      <div className="hw-env__letter">
        <span className="hw-env__to">To: someone you know</span>
        <span className="hw-env__line" />
        <span className="hw-env__line hw-env__line--s" />
        <span className="hw-env__line hw-env__line--m" />
        <span className="hw-env__from">From: ???</span>
      </div>
      <div className="hw-env__front" />
      <img src={app.icon} alt="" className="hw-env__seal" loading="lazy" />
    </div>
  </section>
);

export default HomeAppsBand;
