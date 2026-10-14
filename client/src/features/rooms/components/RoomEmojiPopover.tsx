import type { Dispatch, RefObject, SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import EmojiMenu from '@/shared/components/ui/emoji/EmojiMenu';
import useEscapeKey from '@/shared/hooks/useEscapeKey';
import { useMediaQuery } from '@/shared/hooks';
import {
  ROOM_EMOJI_HEIGHT_PX,
  ROOM_EMOJI_MIN_WIDTH_PX,
  ROOM_EMOJI_VIEWPORT_PAD_PX,
  ROOM_EMOJI_WIDTH_PX,
} from '../constants';

type Props = {
  anchorRef: RefObject<HTMLElement | null>;
  setDraft: Dispatch<SetStateAction<string>>;
  onClose: () => void;
};

/** Composer emoji picker: a popover on desktop, a bottom tray (with scrim) on phones. Escape closes. */
const RoomEmojiPopover = ({ anchorRef, setDraft, onClose }: Props) => {
  const isDesktop = useMediaQuery('(min-width: 640px)');
  useEscapeKey(onClose);

  if (isDesktop) {
    return (
      <div className="rm-emoji">
        <EmojiMenu
          emojiIconRef={anchorRef}
          setMessage={setDraft}
          onClose={onClose}
          width={ROOM_EMOJI_WIDTH_PX}
          height={ROOM_EMOJI_HEIGHT_PX}
        />
      </div>
    );
  }

  const width = Math.min(
    ROOM_EMOJI_WIDTH_PX,
    Math.max(ROOM_EMOJI_MIN_WIDTH_PX, window.innerWidth - ROOM_EMOJI_VIEWPORT_PAD_PX)
  );
  return createPortal(
    <>
      <div className="fixed inset-0 z-40 bg-black/25" aria-hidden onClick={onClose} />
      <div className="fixed inset-x-2 bottom-[max(4.25rem,calc(env(safe-area-inset-bottom)+3rem))] z-40 flex justify-start">
        <EmojiMenu
          emojiIconRef={anchorRef}
          setMessage={setDraft}
          onClose={onClose}
          width={width}
          height={ROOM_EMOJI_HEIGHT_PX}
        />
      </div>
    </>,
    document.body
  );
};

export default RoomEmojiPopover;
