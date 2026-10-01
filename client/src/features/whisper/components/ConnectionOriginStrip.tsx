import { useState } from 'react';
import { useAuthStore } from '@/features/auth';
import { useConnectionOrigin, vibeTagLabel } from '@/features/whisper';

/**
 * "How we met" strip for the DM header.
 *
 * A DM created from an anonymous Whisper match carries a Connection record with
 * the vibe names and tags both people used. Showing it is the payoff for the
 * whole anonymous layer — without this the origin data is written and never
 * seen. Ordinary DMs have no record and render nothing.
 *
 * Lives in the whisper feature (it is whisper data); the chat header consumes it
 * through the feature's public API. It owns its own positioning and returns
 * `null` when there is no origin story, so an ordinary chat never gets a stray
 * absolutely-positioned overlay.
 */
export default function ConnectionOriginStrip({
  chatId,
}: {
  chatId: string | undefined;
}) {
  const user = useAuthStore((s) => s.user);
  const { data: origin } = useConnectionOrigin(chatId, Boolean(user));
  const [dismissed, setDismissed] = useState(false);

  if (!origin || dismissed) return null;

  const shared = origin.selfVibes.filter((v) => origin.partnerVibes.includes(v));

  return (
    <div className="absolute inset-x-2 top-[calc(max(0.5rem,env(safe-area-inset-top))+3.9rem)] z-20">
      <div className="flex items-start gap-2.5 rounded-lg border border-green/15 bg-[rgba(33,26,42,0.92)] px-3 py-2 backdrop-blur-xl">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mt-0.5 shrink-0 text-green"
          aria-hidden
        >
          <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] leading-snug text-body-300">
            You matched in the void as{' '}
            <span className="font-semibold text-white">{origin.selfAlias}</span>
            {shared.length > 0 && (
              <>
                {' '}· shared{' '}
                <span className="font-medium text-green">
                  {shared.map(vibeTagLabel).join(', ')}
                </span>
              </>
            )}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-body-700">
            They were{' '}
            <span className="text-body-500">{origin.partnerAlias}</span> back
            then.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 rounded-md px-1 text-[15px] leading-none text-body-700 transition hover:bg-white/5 hover:text-body-300"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
