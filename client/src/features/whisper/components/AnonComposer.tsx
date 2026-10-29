import { useState, type Dispatch, type KeyboardEvent, type SetStateAction } from 'react';
import { ChatInput } from '@/features/chat';
import { ANON_COMPOSER_ID, MAX_MESSAGE_LENGTH } from '../constants';

type Props = {
  draft: string;
  overLimit: boolean;
  /** No live connection to them: nothing can be typed or sent, and nothing is lost. */
  disabled: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  /** Sends staged photos; the draft becomes the first one's caption. */
  onSendImages: (files: File[]) => void;
  /** A GIF or meme picked from the emoji panel. */
  onSendGif: (url: string) => void;
};

/** Anonymous chat offers emoji, GIFs, memes and photos (no video, audio or files). */
const ANON_MEDIA = ['image', 'gif', 'meme'] as const;
const ANON_IMAGE_ACCEPT = 'image/jpeg, image/png, image/webp';

/**
 * The anonymous composer is the main chat's `ChatInput`, so the two look and behave
 * the same. This wrapper only wires it to the anon store and policy: images only,
 * no link previews (the preview request would send pasted URLs to our server), and
 * no send while the connection is down.
 */
export default function AnonComposer({ draft, overLimit, disabled, onDraftChange, onSend, onSendImages, onSendGif }: Props) {
  const [files, setFiles] = useState<File[]>([]);

  const setMessage: Dispatch<SetStateAction<string>> = (value) =>
    onDraftChange(typeof value === 'function' ? value(draft) : value);

  const submit = () => {
    if (disabled || overLimit) return;
    if (files.length > 0) {
      onSendImages(files);
      setFiles([]);
    } else onSend();
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter confirms an IME candidate (CJK etc.) — it must not also send.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <footer className="acr-composer-wrap relative z-40">
      {overLimit && (
        <p className="acr-limit" role="alert">
          {draft.length}/{MAX_MESSAGE_LENGTH} — trim it a little
        </p>
      )}
      <ChatInput
        id={ANON_COMPOSER_ID}
        message={draft}
        setMessage={setMessage}
        attachments={files}
        setAttachments={setFiles}
        handleSubmit={submit}
        allowedMedia={ANON_MEDIA}
        imageAccept={ANON_IMAGE_ACCEPT}
        onGifSelect={(gif) => onSendGif(gif.url)}
        linkPreview={false}
        disabled={disabled}
        onKeyDown={handleKey}
        className="text-body-700 placeholder:text-body-300"
        placeholder={disabled ? 'Reconnecting…' : 'Whisper something…'}
        aria-label="Message"
      />
    </footer>
  );
}
