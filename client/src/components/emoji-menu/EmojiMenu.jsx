import { useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';

const EmojiMenu = ({ emojiIconRef, setMessage, onClose, ...props }) => {
    const menuRef = useRef()

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) && emojiIconRef.current && !emojiIconRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);


    return (
        <div ref={menuRef}>
            <EmojiPicker
                autoFocusSearch={false}
                theme="dark"
                onEmojiClick={(e) => setMessage((input) => input + e.emoji)}
                previewConfig={{ showPreview: false }}
                emojiStyle='facebook'
                lazyLoadEmojis
                style={{
                    '--epr-bg-color': 'rgba(33, 26, 42, 1)',
                    '--epr-category-label-bg-color': 'rgba(33, 26, 42, 1)',
                    '--epr-text-color': '#FFFFFF',
                    '--epr-hover-bg-color': 'rgba(255, 255, 255, 0.1)',
                    '--epr-focus-bg-color': 'rgba(255, 255, 255, 0.2)',
                    '--epr-highlight-color': 'rgba(255, 255, 255, 0.2)',
                    '--epr-search-bg-color': 'rgba(35, 29, 44, 1)',
                    '--epr-font-family': "'DM Sans', sans-serif",

                    // Custom scrollbar styles
                    '--epr-scrollbar-width': '4px',
                    '--epr-scrollbar-thumb-color': '#EBECEC4D',
                }}
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