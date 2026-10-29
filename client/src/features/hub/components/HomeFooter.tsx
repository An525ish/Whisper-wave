import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import Image from '@/shared/components/ui/Image';
import { useMyChatsQuery } from '@/features/chat';

type Props = {
  signedIn: boolean;
  /** In-flight whisper connections awaiting their person. */
  pendingCount: number;
  onNavigate: (id: string) => void;
};

/**
 * Closing section. Guests get a plain "no account needed" invitation, never a
 * wall. Members get pending connections first, then chats.
 */
const HomeFooter = ({ signedIn, pendingCount, onNavigate }: Props) => {
  const { data } = useMyChatsQuery({ skip: !signedIn });
  const chats = data?.data ?? [];
  const unread = chats.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
  const faces = chats
    .slice(0, 3)
    .map((c) => (Array.isArray(c.avatar) ? c.avatar[0] : c.avatar))
    .filter(Boolean);
  const latest = chats[0]?.name;

  // Members with nothing pending and no chats yet: the hero above already says what to do.
  if (signedIn && pendingCount === 0 && chats.length === 0) return null;

  return !signedIn ? (
    <footer className="hw-closing hw-rise" style={{ '--hw-d': '270ms' } as React.CSSProperties}>
      <span aria-hidden className="hw-closing__rings" />
      <p className="hw-closing__pill">
        <span aria-hidden className="hw-live-dot h-1.5 w-1.5 rounded-full bg-green" />
        No account needed
      </p>
      <h2 className="hw-closing__title">
        Start now. <span className="hw-iri italic">Sign up later.</span>
      </h2>
      <p className="hw-closing__desc">
        Start as a guest. Make an account only if you want to keep someone you matched with.
      </p>
      <div className="hw-closing__actions">
        <Link to={ROUTES.whisper} onClick={() => onNavigate('whisper')} className="hw-show__go">
          Find someone
        </Link>
        <Link
          to={ROUTES.authLogin}
          onClick={() => onNavigate('signup-prompt')}
          className="hw-closing__ghost"
        >
          Create account
        </Link>
      </div>
    </footer>
  ) : (
    <footer className="hw-closing hw-rise" style={{ '--hw-d': '270ms' } as React.CSSProperties}>
      <span aria-hidden className="hw-closing__rings" />
      {faces.length > 0 && (
        <span aria-hidden className="hw-closing__faces">
          {faces.map((src, i) => (
            <span key={`${src}-${i}`} style={{ zIndex: faces.length - i }}>
              <Image src={src} alt="" className="h-full w-full" displayWidth={120} />
            </span>
          ))}
        </span>
      )}
      <p className="hw-closing__pill">
        <span aria-hidden className="hw-live-dot h-1.5 w-1.5 rounded-full bg-green" />
        {pendingCount > 0
          ? pendingCount === 1
            ? '1 connection waiting'
            : `${pendingCount} connections waiting`
          : unread > 0
            ? 'New messages'
            : 'Welcome back'}
      </p>
      <h2 className="hw-closing__title">
        {unread > 0 ? (
          <>You have <span className="hw-iri italic">{unread} unread.</span></>
        ) : chats.length > 0 ? (
          <>Back to <span className="hw-iri italic">your chats.</span></>
        ) : (
          <>Finish <span className="hw-iri italic">connecting.</span></>
        )}
      </h2>
      <p className="hw-closing__desc">
        {latest
          ? `Latest chat: ${latest}.`
          : 'Finish connecting with someone you matched.'}
      </p>
      <div className="hw-closing__actions">
        <Link
          to={ROUTES.chats}
          onClick={() => onNavigate(pendingCount > 0 && chats.length === 0 ? 'pending' : 'chats')}
          className="hw-show__go"
        >
          {unread > 0 ? 'Read messages' : 'Open chats'}
        </Link>
        <Link to={ROUTES.whisper} onClick={() => onNavigate('whisper')} className="hw-closing__ghost">
          Find someone
        </Link>
      </div>
    </footer>
  );
};

export default HomeFooter;
