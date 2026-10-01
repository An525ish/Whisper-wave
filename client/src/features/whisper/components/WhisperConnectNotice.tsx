import { WHISPER_CONNECT_TOKEN_KEY } from '../constants';
import { useAnonStore } from '../stores/anonStore';
import { readAliases } from '../utils/connectToken';

type Props = {
  /** True when the user arrived here from the mutual-vibe reveal flow. */
  active: boolean;
  onStayAnonymous: () => void;
};

/**
 * "You matched as X and Y" banner for the auth screen.
 *
 * This is the emotional hook that gets the account created — a user who just
 * had a real moment with a stranger should never face a generic "Create account"
 * form. Owns its own token read and alias precedence so `pages/Auth.tsx` only
 * decides whether to render it.
 */
export default function WhisperConnectNotice({ active, onStayAnonymous }: Props) {
  const storeAlias = useAnonStore((s) => s.displayName);
  const partnerAlias = useAnonStore((s) => s.partnerName);

  if (!active) return null;

  // Live store values beat the token: they reflect what the user actually
  // matched as, including any session resume.
  const tokenAliases = readAliases(sessionStorage.getItem(WHISPER_CONNECT_TOKEN_KEY));
  const self = storeAlias || tokenAliases?.self;
  const them = partnerAlias || tokenAliases?.partner;
  if (!self || !them) return null;

  return (
    <div className="mb-4">
      <div
        className="flex items-center gap-2.5 rounded-xl border border-green/25 bg-green/[0.07] px-3.5 py-2.5"
        role="status"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-green"
          aria-hidden
        >
          <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
        </svg>
        <p className="text-[12px] leading-snug text-body-300">
          <span className="font-semibold text-white">{self}</span>
          <span className="text-body-700"> &amp; </span>
          <span className="font-semibold text-white">{them}</span>
          <span className="text-body-700"> — that&apos;s how you found each other.</span>
        </p>
      </div>

      <button
        type="button"
        onClick={onStayAnonymous}
        className="mx-auto mt-3 block text-[12px] text-body-700 underline-offset-4 transition hover:text-body-300 hover:underline"
      >
        Keep chatting anonymously instead
      </button>
    </div>
  );
}
