import AttachmentMenu from "@/components/chat/conversation/composer/attachment-menu/AttachmentMenu";
import FilePreview from "@/components/chat/conversation/composer/attachment-menu/FilePreview";
import EmojiMenu from "@/components/chat/conversation/composer/emoji-menu/EmojiMenu";
import ClipIcon from "@/components/ui/icons/Clip";
import EmojiIcon from "@/components/ui/icons/Emoji";
import SendIcon from "@/components/ui/icons/Send";
import { MAX_FILES } from "@/constants/app";
import { MAX_TEXTAREA_HEIGHT } from "@/constants/chat";
import { readFilesFromClipboardEvent } from "@/utils/chat";
import { useChatClipboardStore } from "@/stores/chat/clipboard";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type Dispatch,
  type SetStateAction,
  type TextareaHTMLAttributes,
} from "react";
import toast from "react-hot-toast";

type ChatInputProps = {
    className?: string;
    message: string;
    setMessage: Dispatch<SetStateAction<string>>;
    attachments: File[];
    setAttachments: Dispatch<SetStateAction<File[]>>;
    handleSubmit: () => void | Promise<void>;
    editMode?: boolean;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'className'>;

const renderFilePreviews = (
    attachments: File[],
    handleRemoveFile: (file: File) => void,
) => (
    <div className="absolute bottom-12 left-0 right-0 z-20 mb-1 flex flex-wrap gap-1 rounded-xl border border-border bg-background-alt p-2 shadow-lg md:right-auto md:max-w-md">
        {attachments.map((file, index) => (
            <FilePreview
                key={index}
                file={file}
                onRemove={handleRemoveFile}
            />
        ))}
    </div>
);


const ChatInput = ({
    className,
    message,
    setMessage,
    attachments,
    setAttachments,
    handleSubmit,
    editMode = false,
    ...props }: ChatInputProps) => {

    const [isAttachmentClicked, setIsAttachmentClicked] = useState(false);
    const [isEmojiClicked, setIsEmojiClicked] = useState(false);

    const clipIconRef = useRef<HTMLSpanElement | null>(null);
    const emojiIconRef = useRef<HTMLSpanElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (!editMode) return;
        setIsAttachmentClicked(false);
        setIsEmojiClicked(false);
    }, [editMode]);

    useEffect(() => {
        const node = textareaRef.current;
        if (!node) return;
        node.style.height = 'auto';
        node.style.height = `${Math.max(40, Math.min(node.scrollHeight, MAX_TEXTAREA_HEIGHT))}px`;
        if (editMode) {
            node.focus();
            const len = node.value.length;
            node.setSelectionRange(len, len);
        }
    }, [message, editMode]);

    const toggleAttachmentMenu = () => {
        if (editMode) return;
        setIsAttachmentClicked(prev => !prev);
    };

    const handleFileSelect = useCallback((type: string, files: File[]) => {
        setAttachments(prevSelectedFiles => {
            const newFiles = [...prevSelectedFiles, ...files];
            if (newFiles.length > MAX_FILES) {
                toast.error(`You can only upload up to ${MAX_FILES} ${type}`);
                return prevSelectedFiles;
            }
            return newFiles;
        });
    }, [setAttachments]);

    const handleRemoveFile = useCallback((fileToRemove: File) => {
        setAttachments(prev => prev.filter(file => file !== fileToRemove));
    }, [setAttachments]);

    const handlePaste = useCallback((event: ClipboardEvent<HTMLTextAreaElement>) => {
        if (editMode) return;

        const stored = useChatClipboardStore.getState().payload;
        const pastedFiles = readFilesFromClipboardEvent(event.clipboardData);
        const storedFiles = stored?.files ?? [];
        const allFiles = [...storedFiles, ...pastedFiles];

        if (allFiles.length === 0) return;

        event.preventDefault();

        if (storedFiles.length > 0) {
            useChatClipboardStore.getState().takePayload();
        }

        setAttachments((prev) => {
            const combined = [...prev, ...allFiles];
            if (combined.length > MAX_FILES) {
                toast.error(`You can only upload up to ${MAX_FILES} files`);
            }
            return combined.slice(0, MAX_FILES);
        });

        const storedText = stored?.text?.trim() ?? '';
        const clipboardText = event.clipboardData.getData('text/plain').trim();
        const textToApply = storedFiles.length > 0 ? storedText : clipboardText;

        if (textToApply) {
            setMessage((prev) => (prev.trim() ? prev : textToApply));
        }
    }, [editMode, setAttachments, setMessage]);

    const canSend = Boolean(message.trim()) || (!editMode && attachments.length > 0);
    const isMultiline = message.includes('\n');

    return (
        <div className="relative w-full">
            {!editMode && attachments.length > 0 && renderFilePreviews(attachments, handleRemoveFile)}
            <div className="relative flex w-full items-center gap-2">
                {!editMode && isAttachmentClicked && (
                    <AttachmentMenu
                        onClose={() => setIsAttachmentClicked(false)}
                        onFileSelect={handleFileSelect}
                        clipIconRef={clipIconRef}
                    />
                )}
                {!editMode && isEmojiClicked && (
                    <div className="absolute bottom-14 left-0 z-30 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl shadow-xl">
                        <EmojiMenu
                            width={280}
                            height={280}
                            onClose={() => setIsEmojiClicked(false)}
                            emojiIconRef={emojiIconRef}
                            setMessage={setMessage}
                        />
                    </div>
                )}
                <div className={`flex min-h-10 min-w-0 flex-1 items-center gap-0.5 rounded-3xl border px-1.5 py-0.5 md:gap-1 md:bg-transparent md:px-2 ${
                    editMode
                        ? 'border-green/45 bg-green/10'
                        : 'border-border bg-primary/40'
                }`}>
                    {!editMode ? (
                        <span ref={emojiIconRef} className="shrink-0">
                            <button
                                type="button"
                                className="grid h-10 w-10 place-items-center rounded-full transition active:bg-background/40"
                                onClick={() => setIsEmojiClicked(prev => !prev)}
                                aria-label="Emoji"
                            >
                                <EmojiIcon className="h-5 w-5 hover:fill-body" />
                            </button>
                        </span>
                    ) : null}
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={message}
                        enterKeyHint={editMode ? 'done' : 'send'}
                        autoComplete="off"
                        {...props}
                        onPaste={handlePaste}
                        className={`max-h-32 w-full min-h-10 min-w-0 resize-none overflow-y-auto bg-transparent px-1 outline-none md:px-2 text-[16px] md:text-sm ${
                            isMultiline
                                ? 'py-2 leading-snug'
                                : 'py-0 leading-10'
                        } ${className ?? ''}`}
                    />
                    {!editMode ? (
                        <span ref={clipIconRef} className="shrink-0">
                            <button
                                type="button"
                                className="grid h-10 w-10 place-items-center rounded-full transition active:bg-background/40"
                                onClick={toggleAttachmentMenu}
                                aria-label="Attach file"
                            >
                                <ClipIcon className="h-5 w-5 rotate-90 hover:fill-body" />
                            </button>
                        </span>
                    ) : null}
                </div>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSend}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-green text-white shadow-md transition enabled:active:scale-95 disabled:opacity-40 md:h-10 md:w-10"
                    aria-label={editMode ? 'Save edit' : 'Send message'}
                >
                    <SendIcon className="mt-0.5 mr-0.5 h-5 w-5 fill-white" />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
