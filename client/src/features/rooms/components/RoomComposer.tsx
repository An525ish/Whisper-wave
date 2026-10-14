import { useRef, useState, type KeyboardEvent } from 'react';
import ReplyBar from '@/shared/components/ui/reply/ReplyBar';
import EmojiIcon from '@/shared/components/ui/icons/Emoji';
import SendIcon from '@/shared/components/ui/icons/Send';
import { useAutoGrowTextarea } from '@/shared/hooks';
import { formatCountdown } from '@/shared/utils/duration';
import {
  COMPOSER_ROW_MIN_CLASS,
  COMPOSER_SEND_SIZE_CLASS,
  COMPOSER_SHELL_CLASS,
} from '@/shared/constants/app';
import { ROOM_LIMITS, ROOM_LISTENING_COPY } from '../constants';
import { useRoomComposer } from '../hooks/useRoomComposer';
import type { RoomMessageAck, RoomMessageInput, RoomReplyPreview } from '../types';
import RoomChallengeModal from './RoomChallengeModal';
import RoomEmojiPopover from './RoomEmojiPopover';
import './roomComposer.css';

type Props = {
  replyTo: RoomReplyPreview | null;
  onClearReply: () => void;
  onSend: (input: RoomMessageInput) => Promise<RoomMessageAck>;
};

/**
 * Room composer built from the same shared geometry as the main chat
 * (`COMPOSER_*` classes). Enter sends, Shift+Enter breaks the line. The draft
 * stays until the server acks it; slow mode and mute show as live countdowns;
 * a guest's first post may ask for a quick check inline. Rooms are text-only,
 * so GIF/attachments stay out — emoji ride as text.
 */
const RoomComposer = ({ replyTo, onClearReply, onSend }: Props) => {
  const composer = useRoomComposer({ replyTo, onClearReply, onSend });
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useAutoGrowTextarea({ value: composer.draft });
  const { ready, locked, mutedMs, cooldownMs, paused } = composer;

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter confirms an IME candidate (CJK etc.) — it must not also send.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      composer.submit();
    }
  };

  const placeholder = !ready
    ? 'Reconnecting…'
    : paused
      ? ROOM_LISTENING_COPY.composerPaused
      : mutedMs > 0
        ? `You’re muted — ${formatCountdown(mutedMs)} left`
        : 'Message…';

  return (
    <div className="rm-composer">
      <div className="relative">
        {replyTo && (
          <div className="mb-1.5">
            <ReplyBar senderName={replyTo.alias} previewText={replyTo.preview} onCancel={onClearReply} />
          </div>
        )}
        {composer.challenge && (
          <RoomChallengeModal
            pending={composer.challenge}
            busy={composer.sending}
            answerError={composer.answerError}
            onAnswer={composer.answer}
            onToken={composer.answerToken}
            onCancel={composer.cancelChallenge}
          />
        )}
        {cooldownMs > 0 && (
          <p className="rm-composernote" role="status">
            Slow mode — you can post again in {Math.ceil(cooldownMs / 1000)}s
          </p>
        )}
        <div className="flex min-w-0 items-end gap-2">
          <div className={`relative min-w-0 flex-1 ${COMPOSER_SHELL_CLASS}`}>
            <div className={`flex w-full min-w-0 items-center gap-0.5 px-1.5 md:gap-1 md:px-2 ${COMPOSER_ROW_MIN_CLASS}`}>
              <span className="shrink-0">
                <button
                  type="button"
                  ref={emojiBtnRef}
                  className={`rm-composerbtn grid h-10 w-10 place-items-center rounded-full transition active:bg-background/40${emojiOpen ? ' text-green' : ''}`}
                  onClick={() => setEmojiOpen((v) => !v)}
                  aria-label="Emoji"
                  aria-expanded={emojiOpen}
                  disabled={locked}
                >
                  <EmojiIcon aria-hidden className="h-5 w-5 hover:fill-body" />
                </button>
              </span>
              <textarea
                ref={textareaRef}
                rows={1}
                value={composer.draft}
                onChange={(e) => composer.setDraft(e.target.value)}
                onKeyDown={handleKey}
                placeholder={placeholder}
                disabled={!ready || paused || mutedMs > 0}
                readOnly={composer.challenge !== null}
                maxLength={ROOM_LIMITS.MESSAGE_MAX}
                enterKeyHint="send"
                autoComplete="off"
                aria-label="Message"
                className="max-h-32 w-full min-w-0 resize-none overflow-y-auto bg-transparent px-1 outline-none placeholder:text-body-300/65 min-h-11 text-[16px] leading-[22px] py-[11px] md:px-2 md:text-sm"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={composer.submit}
            disabled={!composer.canSend}
            className={`rm-composerbtn grid shrink-0 place-items-center rounded-full bg-gradient-green text-white shadow-md transition enabled:active:scale-95 disabled:opacity-40 ${COMPOSER_SEND_SIZE_CLASS}`}
            aria-label="Send message"
          >
            <SendIcon aria-hidden className="mt-0.5 mr-0.5 h-5 w-5 fill-white" />
          </button>
        </div>
        {emojiOpen && (
          <RoomEmojiPopover anchorRef={emojiBtnRef} setDraft={composer.setDraft} onClose={() => setEmojiOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default RoomComposer;
