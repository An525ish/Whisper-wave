import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import WaveIcon from '@/shared/components/ui/icons/Wave';
import ChatIcon from '@/shared/components/ui/icons/Chat';
import CheckStrokeIcon from '@/shared/components/ui/icons/CheckStroke';
import './guestChatsEmpty.css';

const STEPS = [
  { title: 'Match', body: 'Meet someone', icon: <WaveIcon /> },
  { title: 'Talk', body: 'No names, no profile', icon: <ChatIcon /> },
  { title: 'Keep', body: 'Save them to Chats', icon: <CheckStrokeIcon /> },
] as const;

/**
 * What a guest sees at `/chats`: the people you keep live here, and the way
 * to find them is Whisper. Never a redirect wall.
 */
const GuestChatsEmpty = () => (
  <main className="gc-page">
    <div className="gc-card">
      <div aria-hidden className="gc-art">
        <span className="gc-bubble gc-bubble--in">hey, you up?</span>
        <span className="gc-bubble gc-bubble--out">
          <i /><i /><i />
        </span>
        <span className="gc-kept">Kept</span>
      </div>

      <h1 className="gc-title">People you keep live here</h1>
      <p className="gc-desc">
        Chats holds the people you matched with and chose to keep. Find someone first. If it clicks,
        they show up here.
      </p>

      <ol className="gc-steps">
        {STEPS.map((step) => (
          <li key={step.title}>
            <span className="gc-steps__node">{step.icon}</span>
            <strong>{step.title}</strong>
            <span>{step.body}</span>
          </li>
        ))}
      </ol>

      <Link
        to={ROUTES.whisper}
        className="gc-cta group inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-gradient-action-button-green px-7 py-3 text-sm font-semibold text-body transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green active:scale-[0.98]"
      >
        Find someone with Whisper
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
      </Link>
      <Link to={ROUTES.authLogin} className="gc-signin">
        Already have an account? <span>Sign in</span>
      </Link>
    </div>
  </main>
);

export default GuestChatsEmpty;
