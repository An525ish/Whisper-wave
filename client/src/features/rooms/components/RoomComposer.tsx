import { useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import EmojiMenu from '@/features/chat/components/conversation/composer/emoji-menu/EmojiMenu';
import ReplyBar from '@/features/chat/components/conversation/composer/ReplyBar';
import EmojiIcon from '@/shared/components/ui/icons/Emoji';
import SendIcon from '@/shared/components/ui/icons/Send';
import { useAutoGrowTextarea, useMediaQuery } from '@/shared/hooks';
import {
  COMPOSER_ROW_MIN_CLASS,
  COMPOSER_SEND_SIZE_CLASS,
  COMPOSER_SHELL_CLASS,
} from '@/shared/constants/app';
import { useRoomStore } from '../stores/roomStore';
import './rooms.css';

type Props = {
  replyTo: { id: string; alias: string; preview: string } | null;
  onClearReply: () => void;
  onSend: (text: string, opts?: { replyTo?: string }) => void;
};

/**
 * Room composer built from the same shared geometry as the main chat
 * (`COMPOSER_*` classes) — same shell, same row floor, same send size.
 * Enter sends, Shift+Enter breaks the line. Slow-mode and rate verdicts
 * toast from the socket hook. Rooms are text-only, so GIF/attachments stay
 * out — emoji ride as text.
 */
const RoomComposer = ({ replyTo, onClearReply, onSend }: Props) => {
  const [draft, setDraft] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useAutoGrowTextarea({ value: draft });
  const socketConnected = useRoomStore((s) => s.socketConnected);
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const pickerWidth =
    typeof window === 'undefined'
      ? 280
      : Math.min(280, Math.max(260, window.innerWidth - 16));

  const canSend = draft.trim().length > 0 && socketConnected;

  const submit = () => {
    const text = draft.trim();
    if (!text || !socketConnected) return;
    onSend(text, replyTo ? { replyTo: replyTo.id } : undefined);
    setDraft('');
    if (replyTo) onClearReply();
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter confirms an IME candidate (CJK etc.) — it must not also send.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="rm-composer">
      <div className="relative">
        {replyTo && (
          <div className="mb-1.5">
            <ReplyBar
              senderName={replyTo.alias}
              previewText={replyTo.preview}
              onCancel={onClearReply}
            />
          </div>
        )}
        <div className="flex min-w-0 items-end gap-2">
          <div className={`relative min-w-0 flex-1 ${COMPOSER_SHELL_CLASS}`}>
            <div className={`flex w-full min-w-0 items-center gap-0.5 px-1.5 md:gap-1 md:px-2 ${COMPOSER_ROW_MIN_CLASS}`}>
              <span className="shrink-0">
                <button
                  type="button"
                  ref={emojiBtnRef}
                  className={`grid h-10 w-10 place-items-center rounded-full transition active:bg-background/40${emojiOpen ? ' text-green' : ''}`}
                  onClick={() => setEmojiOpen((v) => !v)}
                  aria-label="Emoji"
                  aria-expanded={emojiOpen}
                  disabled={!socketConnected}
                >
                  <EmojiIcon className="h-5 w-5 hover:fill-body" />
                </button>
              </span>
              <textarea
                ref={textareaRef}
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKey}
                placeholder={socketConnected ? 'Message…' : 'Connecting…'}
                disabled={!socketConnected}
                maxLength={1000}
                enterKeyHint="send"
                autoComplete="off"
                aria-label="Message"
                className="max-h-32 w-full min-w-0 resize-none overflow-y-auto bg-transparent px-1 outline-none placeholder:text-body-300/65 min-h-11 text-[16px] leading-[22px] py-[11px] md:px-2 md:text-sm"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            className={`grid shrink-0 place-items-center rounded-full bg-gradient-green text-white shadow-md transition enabled:active:scale-95 disabled:opacity-40 ${COMPOSER_SEND_SIZE_CLASS}`}
            aria-label="Send message"
          >
            <SendIcon className="mt-0.5 mr-0.5 h-5 w-5 fill-white" />
          </button>
        </div>
        {emojiOpen &&
          (isDesktop ? (
            <div className="rm-emoji">
              <EmojiMenu
                emojiIconRef={emojiBtnRef}
                setMessage={setDraft}
                onClose={() => setEmojiOpen(false)}
                width={280}
                height={320}
              />
            </div>
          ) : (
            createPortal(
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/25"
                  aria-hidden
                  onClick={() => setEmojiOpen(false)}
                />
                <div className="fixed inset-x-2 bottom-[max(4.25rem,calc(env(safe-area-inset-bottom)+3rem))] z-40 flex justify-start">
                  <EmojiMenu
                    emojiIconRef={emojiBtnRef}
                    setMessage={setDraft}
                    onClose={() => setEmojiOpen(false)}
                    width={pickerWidth}
                    height={320}
                  />
                </div>
              </>,
              document.body
            )
          ))}
      </div>
    </div>
  );
};

export default RoomComposer;
