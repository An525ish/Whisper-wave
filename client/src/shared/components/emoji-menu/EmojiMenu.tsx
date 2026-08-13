import {
  useEffect,
  useRef,
  type CSSProperties,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import EmojiPicker, {
  Theme,
  EmojiStyle,
  type EmojiClickData,
  type PickerProps,
} from 'emoji-picker-react';

type EmojiMenuProps = {
  emojiIconRef: RefObject<HTMLElement | null>;
  setMessage: Dispatch<SetStateAction<string>>;
  onClose: () => void;
} & Omit<PickerProps, 'onEmojiClick' | 'theme' | 'emojiStyle'>;

const EmojiMenu = ({
  emojiIconRef,
  setMessage,
  onClose,
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
    <div ref={menuRef}>
      <EmojiPicker
        autoFocusSearch={false}
        theme={Theme.DARK}
        onEmojiClick={(e: EmojiClickData) =>
          setMessage((input) => input + e.emoji)
        }
        previewConfig={{ showPreview: false }}
        emojiStyle={EmojiStyle.FACEBOOK}
        lazyLoadEmojis
        style={
          {
            '--epr-bg-color': 'rgba(33, 26, 42, 1)',
            '--epr-category-label-bg-color': 'rgba(33, 26, 42, 1)',
            '--epr-text-color': '#FFFFFF',
            '--epr-hover-bg-color': 'rgba(255, 255, 255, 0.1)',
            '--epr-focus-bg-color': 'rgba(255, 255, 255, 0.2)',
            '--epr-highlight-color': 'rgba(255, 255, 255, 0.2)',
            '--epr-search-bg-color': 'rgba(35, 29, 44, 1)',
            '--epr-font-family': "'DM Sans', sans-serif",
            '--epr-scrollbar-width': '4px',
            '--epr-scrollbar-thumb-color': '#EBECEC4D',
          } as CSSProperties
        }
        {...props}
      />
      <style>
        {`
          .EmojiPickerReact {
            border-radius: 10px;
            font-family: var(--epr-font-family);
          }
          .EmojiPickerReact .epr-category-nav {
            font-weight: var(--epr-category-label-font-weight);
            padding : 5px 1rem;
          }
          .EmojiPickerReact .epr-emoji-category-label {
            font-weight: var(--epr-category-label-font-weight);
            font-size : .9rem;
            padding : 8px 1rem;
            height : fit-content;
          }
          .EmojiPickerReact .epr-body::-webkit-scrollbar {
            width: var(--epr-scrollbar-width);
          }
          .EmojiPickerReact .epr-body::-webkit-scrollbar-track {
            display : none;
          }
          .EmojiPickerReact .epr-body::-webkit-scrollbar-thumb {
            background-color: var(--epr-scrollbar-thumb-color);
            border-radius: 20px;
          }
          .EmojiPickerReact .epr-search-container input{
            background-color: var(--epr-search-bg-color);
            padding : 0 2.1rem;
            height : 2rem;
            border-radius : 1rem;
            color : 'grey'
          }
        `}
      </style>
    </div>
  );
};

export default EmojiMenu;
