import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { stashPostAuthReturn } from '@/shared/utils/postAuthReturn';
import './roomJoin.css';

/**
 * Guest at a private room's door WITH a valid invite (the info sheet only
 * answers with proof): private rooms are members-only, so the way in is to
 * sign in. The path, invite included, is stashed so sign-in lands right back here.
 */
const RoomSignInPrompt = () => (
  <section aria-label="Sign in to join" className="rm-rulescard">
    <h2 className="rm-rulescard__label">Members only</h2>
    <p className="mt-2 text-sm text-body-300">
      This is a private room — you’re invited, but it’s open to signed-in members only. Sign in or make an account
      and you’ll come straight back to this door.
    </p>
    <Link
      to={ROUTES.authLogin}
      onClick={() => stashPostAuthReturn(`${window.location.pathname}${window.location.search}`)}
      className="rm-joinbtn mt-4 inline-block w-full text-center"
    >
      Sign in to join
    </Link>
  </section>
);

export default RoomSignInPrompt;
