import { MAX_MESSAGE_LENGTH } from '../constants';
import { useAutoGrowTextarea } from '../hooks/useAutoGrowTextarea';
import type { KeyboardEvent } from 'react';

type Props = {
  draft: string;
  overLimit: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
};

/**
 * The composer. Autosize and the length guard live in hooks/constants so this
 * stays a description of the UI.
 */
export default function AnonComposer({ draft, overLimit, onDraftChange, onSend }: Props) {
  const textareaRef = useAutoGrowTextarea(draft);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <footer className="acr-composer-wrap">
      {overLimit && (
        <p className="acr-limit" role="alert">
          {draft.length}/{MAX_MESSAGE_LENGTH} — trim it a little
        </p>
      )}
      <div className="acr-composer">
        <div className="acr-composer__field">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Whisper something…"
            aria-label="Message"
            rows={1}
            className="acr-composer__input"
          />
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={!draft.trim() || overLimit}
          className="acr-send"
          aria-label="Send message"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </footer>
  );
}
