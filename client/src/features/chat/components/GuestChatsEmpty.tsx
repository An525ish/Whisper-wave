import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import EmptyState from '@/shared/components/ui/EmptyState';

/**
 * What a guest sees at `/chats`: the people you keep live here, and the way
 * to find them is Whisper. Never a redirect wall.
 */
const GuestChatsEmpty = () => (
  <main className="grid h-full min-h-0 place-items-center px-6">
    <EmptyState
      imageSrc="/logo-4.png"
      imageClassName="w-24 opacity-90"
      contentClassName="max-w-sm"
      titleClassName="mt-4 text-center font-display text-2xl text-white"
      descriptionClassName="mt-2 text-center text-sm leading-relaxed text-body-300"
      title="People you keep live here"
      description="Chats is where the strangers you vibe with become people you can message. Find someone first — if it clicks, you can keep them."
      action={
        <div className="flex flex-col items-center gap-2">
          <Link
            to={ROUTES.whisper}
            className="rounded-full bg-gradient-action-button-green px-7 py-3 text-sm font-semibold text-body transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
          >
            Find someone with Whisper →
          </Link>
          <Link
            to={ROUTES.authLogin}
            className="text-sm font-medium text-body-300 transition hover:text-green focus-visible:outline-2 focus-visible:outline-green"
          >
            Already have an account? Sign in
          </Link>
        </div>
      }
    />
  </main>
);

export default GuestChatsEmpty;
