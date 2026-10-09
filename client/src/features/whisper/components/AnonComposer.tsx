import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import SendIcon from '@/shared/components/ui/icons/Send';
import { useAutoGrowTextarea } from '@/shared/hooks';
import SparkDeck from './SparkDeck';
import { ANON_COMPOSER_ID, MAX_MESSAGE_LENGTH } from '../constants';
import type { Spark } from '../types';

type Props = {
  draft: string;
  overLimit: boolean;
  /** Openers for the menu on the left. */
  sparks: Spark[];
  /** The thread is young — the menu says "break the ice". */
  fresh: boolean;
  /** No live connection to them: nothing can be typed or sent, and nothing is lost. */
  disabled: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  /** Fills the composer; never sends. */
  onPickSpark: (text: string) => void;
};

/** The ring around send only appears once the message is getting long. */
const RING_FROM = 0.7;

/**
 * The composer — a transmitter.
 *
 * - A **spark** button opens a small menu of openers right where you're typing, so
 *   an empty box is never the only option (the profile panel has them too, but on
 *   a phone it's behind a sheet).
 * - **Send** carries a ring that fills as you approach the length limit, instead of
 *   a counter that appears only after you've already gone over.
 * - Enter sends, Shift+Enter breaks the line.
 * - While the connection to them is down the whole control is disabled. A send
 *   with no socket is a silent no-op, so leaving it enabled would clear the draft
 *   and lose the message.
 *
 * Autosize and the length guard live in a shared hook and a feature constant, so
 * this stays a description of the UI.
 */
export default function AnonComposer({
  draft,
  overLimit,
  sparks,
  fresh,
  disabled,
  onDraftChange,
  onSend,
  onPickSpark,
}: Props) {
  const textareaRef = useAutoGrowTextarea({ value: draft });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [menuOpen]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter confirms an IME candidate (CJK etc.) — it must not also send.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSend();
    }
  };

  const ratio = Math.min(1, draft.length / MAX_MESSAGE_LENGTH);
  const canSend = draft.trim().length > 0 && !overLimit && !disabled;
  const menuShown = menuOpen && !disabled;

  return (
    <footer className="acr-composer-wrap relative z-40">
      {overLimit && (
        <p className="acr-limit" role="alert">
          {draft.length}/{MAX_MESSAGE_LENGTH} — trim it a little
        </p>
      )}

      <div className={`acr-composer${disabled ? ' acr-composer--disabled' : ''}`} ref={menuRef}>
        {menuShown && (
          <div className="acr-composer__menu" role="group" aria-label="Opener ideas">
            <SparkDeck
              sparks={sparks}
              fresh={fresh}
              disabled={false}
              onPick={(text) => {
                onPickSpark(text);
                setMenuOpen(false);
              }}
            />
          </div>
        )}

        <button
          type="button"
          className={`acr-composer__spark${menuShown ? ' acr-composer__spark--open' : ''}`}
          onClick={() => setMenuOpen((open) => !open)}
          disabled={disabled}
          aria-expanded={menuShown}
          aria-haspopup="true"
          aria-label="Opener ideas"
          title="Need an opener?"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          id={ANON_COMPOSER_ID}
          rows={1}
          value={draft}
          disabled={disabled}
          enterKeyHint="send"
          autoComplete="off"
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={disabled ? 'Reconnecting…' : 'Whisper something…'}
          aria-label="Message"
          className="acr-composer__input"
        />

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className={`acr-send${canSend ? ' acr-send--ready' : ''}`}
          aria-label="Send message"
        >
          {ratio >= RING_FROM && (
            <svg className="acr-send__ring" viewBox="0 0 44 44" fill="none" aria-hidden>
              <circle
                className={`acr-send__arc${ratio >= 0.9 ? ' acr-send__arc--hot' : ''}`}
                cx="22"
                cy="22"
                r="20"
                pathLength={100}
                style={{ strokeDasharray: `${Math.round(ratio * 100)} 100` }}
              />
            </svg>
          )}
          <SendIcon aria-hidden className="acr-send__icon" />
        </button>
      </div>
    </footer>
  );
}
