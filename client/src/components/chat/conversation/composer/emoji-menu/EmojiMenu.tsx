import {
  useEffect,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import StyledEmojiPicker, {
  emojiPickerShellClass,
} from '@/components/chat/conversation/composer/StyledEmojiPicker';
import type { PickerProps } from 'emoji-picker-react';

type EmojiMenuProps = {
  emojiIconRef: RefObject<HTMLElement | null>;
  setMessage: Dispatch<SetStateAction<string>>;
  onClose: () => void;
  width?: number;
  height?: number;
} & Omit<
  PickerProps,
  'onEmojiClick' | 'theme' | 'emojiStyle' | 'width' | 'height' | 'style'
>;

const EmojiMenu = ({
  emojiIconRef,
  setMessage,
  onClose,
  width = 312,
  height = 380,
  ...props
}: EmojiMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        emojiIconRef.current &&
        !emojiIconRef.current.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, emojiIconRef]);

  return (
    <div
      ref={menuRef}
      className={emojiPickerShellClass}
      style={{ width, height }}
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <StyledEmojiPicker
          width={width}
          height={height}
          onEmojiClick={(e) => setMessage((input) => input + e.emoji)}
          {...props}
        />
      </div>
    </div>
  );
};

export default EmojiMenu;
