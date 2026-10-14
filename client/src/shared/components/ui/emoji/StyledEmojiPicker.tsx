import EmojiPicker, {
  Theme,
  EmojiStyle,
  type EmojiClickData,
  type PickerProps,
} from 'emoji-picker-react';
import type { CSSProperties } from 'react';

export const emojiPickerStyles: CSSProperties = {
  '--epr-bg-color': 'transparent',
  '--epr-category-label-bg-color': 'rgba(33, 26, 42, 1)',
  '--epr-text-color': '#FFFFFF',
  '--epr-hover-bg-color': 'rgba(255, 255, 255, 0.08)',
  '--epr-focus-bg-color': 'rgba(255, 255, 255, 0.12)',
  '--epr-highlight-color': 'rgba(1, 195, 109, 0.45)',
  '--epr-search-bg-color': 'rgba(0, 0, 0, 0.22)',
  '--epr-search-border-color': 'rgba(255, 255, 255, 0.1)',
  '--epr-header-padding': '6px 10px 0',
  '--epr-font-family': "'DM Sans', sans-serif",
  '--epr-scrollbar-width': '4px',
  '--epr-scrollbar-thumb-color': '#EBECEC4D',
  '--epr-search-input-bg-color': 'rgba(0, 0, 0, 0.22)',
} as CSSProperties;

export const emojiPickerCss = `
  .EmojiPickerReact {
    border-radius: 0;
    border: none !important;
    background: transparent !important;
  }
  .EmojiPickerReact .epr-header {
    padding: var(--epr-header-padding);
  }
  .EmojiPickerReact .epr-search-container {
    margin: 0;
    padding: 0;
  }
  .EmojiPickerReact .epr-search-container input {
    height: 2rem;
    border-radius: 9999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(0, 0, 0, 0.22) !important;
    padding: 0 2.25rem 0 2.1rem;
    font-size: 0.75rem;
    color: #fff;
    box-shadow: none;
  }
  .EmojiPickerReact .epr-search-container input::placeholder {
    color: rgba(235, 236, 236, 0.45);
  }
  .EmojiPickerReact .epr-search-container input:focus {
    border-color: rgba(1, 195, 109, 0.5);
    background-color: rgba(0, 0, 0, 0.3) !important;
    outline: none;
  }
  .EmojiPickerReact .epr-icn-search {
    opacity: 0.5;
  }
  .EmojiPickerReact .epr-category-nav {
    padding: 0.15rem 0.75rem 0.2rem;
    margin-top: 0.15rem;
  }
  .EmojiPickerReact .epr-emoji-category-label {
    font-size: 0.8rem;
    padding: 4px 0.75rem;
    height: fit-content;
  }
  .EmojiPickerReact .epr-body::-webkit-scrollbar { width: 4px; }
  .EmojiPickerReact .epr-body::-webkit-scrollbar-track { display: none; }
  .EmojiPickerReact .epr-body::-webkit-scrollbar-thumb {
    background-color: #EBECEC4D;
    border-radius: 20px;
  }
`;

/** Shared emoji grid — same search bar, scrollbar, and chrome as the chat composer picker. */
export const emojiPickerShellClass =
  'flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[rgba(33,26,42,1)] shadow-2xl';

type StyledEmojiPickerProps = {
  width?: number;
  height?: number;
  onEmojiClick: (data: EmojiClickData) => void;
  searchPlaceHolder?: string;
} & Omit<
  PickerProps,
  'onEmojiClick' | 'theme' | 'emojiStyle' | 'width' | 'height' | 'style'
>;

const StyledEmojiPicker = ({
  width = 312,
  height = 328,
  onEmojiClick,
  searchPlaceHolder = 'Search emoji…',
  ...props
}: StyledEmojiPickerProps) => (
  <>
    <EmojiPicker
      autoFocusSearch={false}
      theme={Theme.DARK}
      width={width}
      height={height}
      onEmojiClick={onEmojiClick}
      previewConfig={{ showPreview: false }}
      emojiStyle={EmojiStyle.FACEBOOK}
      lazyLoadEmojis
      searchPlaceHolder={searchPlaceHolder}
      style={emojiPickerStyles}
      {...props}
    />
    <style>{emojiPickerCss}</style>
  </>
);

export default StyledEmojiPicker;
