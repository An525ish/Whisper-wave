import SendIcon from '@/shared/components/ui/icons/Send';
import { useAutoGrowTextarea } from '@/shared/hooks';
import {
  COMPOSER_ROW_MIN_CLASS,
  COMPOSER_SEND_SIZE_CLASS,
  COMPOSER_SHELL_CLASS,
} from '@/shared/constants/app';
import { MAX_MESSAGE_LENGTH } from '../constants';
import type { KeyboardEvent } from 'react';

type Props = {
  draft: string;
  overLimit: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
};

/**
 * The composer. Geometry deliberately mirrors the logged-in chat's non-floating
 * `ChatInput` (rounded-3xl shell, min-h-11 row, same send-button size) so the two
 * chats read as one product — autosize and the length guard live in a shared hook
 * and a feature constant, so this stays a description of the UI.
 *
 * What this keeps that the logged-in composer has no use for: the 2000-char
 * counter with its over-limit alert, and Enter-to-send with Shift+Enter for a
 * newline.
 */
export default function AnonComposer({ draft, overLimit, onDraftChange, onSend }: Props) {
  const textareaRef = useAutoGrowTextarea({ value: draft });

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter confirms an IME candidate (CJK etc.) — it must not also send.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <footer className="acr-composer-wrap relative z-40">
      {overLimit && (
        <p className="acr-limit" role="alert">
          {draft.length}/{MAX_MESSAGE_LENGTH} — trim it a little
        </p>
      )}
      <div className="flex min-w-0 items-end gap-2">
        <div className="relative min-w-0 flex-1">
          {/* focus-within carries the visible focus ring the UA outline can't
              paint over this glassy shell. */}
          <div className={COMPOSER_SHELL_CLASS}>
            <div
              className={`flex w-full min-w-0 items-center gap-0.5 px-1.5 md:gap-1 md:px-2 ${COMPOSER_ROW_MIN_CLASS}`}
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={draft}
                enterKeyHint="send"
                autoComplete="off"
                onChange={(e) => onDraftChange(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Whisper something…"
                aria-label="Message"
                className="max-h-32 w-full min-w-0 min-h-11 resize-none overflow-y-auto bg-transparent px-1 py-[11px] text-[16px] leading-[22px] text-body outline-none md:px-2 md:text-sm"
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={!draft.trim() || overLimit}
          className={`grid ${COMPOSER_SEND_SIZE_CLASS} shrink-0 place-items-center rounded-full bg-gradient-green text-white shadow-md transition enabled:active:scale-95 disabled:opacity-40`}
          aria-label="Send message"
        >
          <SendIcon aria-hidden className="mt-0.5 mr-0.5 h-5 w-5 fill-white" />
        </button>
      </div>
    </footer>
  );
}