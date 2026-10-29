import type { Dispatch, KeyboardEvent, SetStateAction } from 'react';
import { useAuthStore } from '@/features/auth';
import { ChatInput } from '@/features/chat';
import ReplyBar from '@/shared/components/ui/reply/ReplyBar';
import { formatCountdown } from '@/shared/utils/duration';
import { ROOM_IMAGE, ROOM_LIMITS, ROOM_LISTENING_COPY } from '../constants';
import { useRoomStore } from '../stores/roomStore';
import { useRoomComposer } from '../hooks/useRoomComposer';
import type { RoomAckCode, RoomMessageAck, RoomMessageInput, RoomReplyPreview } from '../types';
import RoomChallengeModal from './RoomChallengeModal';
import './roomComposer.css';

type Props = {
  replyTo: RoomReplyPreview | null;
  onClearReply: () => void;
  onSend: (input: RoomMessageInput) => Promise<RoomMessageAck>;
  onUploadImage: (file: File) => Promise<{ key: string } | { code: RoomAckCode }>;
};

/**
 * Room composer: the main chat's `ChatInput` plus room behaviour. Enter sends,
 * Shift+Enter breaks the line. The draft stays until the server acks it; slow mode
 * and mute show as live countdowns; a guest's first post may ask for a quick check
 * inline. Which media it offers comes from the room (admin-set) and only for signed-in
 * members; the server re-checks every message, so this only decides what to show.
 */

const RoomComposer = ({ replyTo, onClearReply, onSend, onUploadImage }: Props) => {
  const composer = useRoomComposer({ replyTo, onClearReply, onSend, onUploadImage });
  const roomMedia = useRoomStore((s) => s.media);
  const isMember = useAuthStore((s) => s.user !== null);
  const { ready, locked, mutedMs, cooldownMs, paused } = composer;

  // Emoji and typing both go through here; nothing may be added while locked.
  const setMessage: Dispatch<SetStateAction<string>> = (value) => {
    if (!locked) composer.setDraft(value);
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter confirms an IME candidate (CJK etc.) — it must not also send.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void composer.submit();
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
        <ChatInput
          message={composer.draft}
          setMessage={setMessage}
          attachments={composer.files}
          setAttachments={composer.setFiles}
          handleSubmit={composer.submit}
          allowedMedia={isMember ? roomMedia : []}
          imageAccept={ROOM_IMAGE.ACCEPT}
          onGifSelect={(gif) => composer.sendLink(gif.kind, gif.url)}
          linkPreview={false}
          replySlot={
            replyTo ? (
              <ReplyBar senderName={replyTo.alias} previewText={replyTo.preview} onCancel={onClearReply} />
            ) : undefined
          }
          disabled={!ready || paused || mutedMs > 0}
          readOnly={composer.challenge !== null}
          maxLength={ROOM_LIMITS.MESSAGE_MAX}
          onKeyDown={handleKey}
          className="text-body-700 placeholder:text-body-300"
          placeholder={placeholder}
          aria-label="Message"
        />
      </div>
    </div>
  );
};

export default RoomComposer;
