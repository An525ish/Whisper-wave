import AttachmentMenu from "@/components/chat/conversation/composer/attachment-menu/AttachmentMenu";
import FilePreview from "@/components/chat/conversation/composer/attachment-menu/FilePreview";
import ComposerLinkPreview from "@/components/chat/conversation/composer/ComposerLinkPreview";
import ComposerPicker from "@/components/chat/conversation/composer/ComposerPicker";
import ClipIcon from "@/components/ui/icons/Clip";
import EmojiIcon from "@/components/ui/icons/Emoji";
import SendIcon from "@/components/ui/icons/Send";
import type { GifItem } from "@/api/gif";
import { MAX_FILES } from "@/constants/app";
import { MAX_TEXTAREA_HEIGHT } from "@/constants/chat";
import { readFilesFromClipboardEvent } from "@/utils/chat";
import { extractLinksFromText, type ParsedLink } from "@/utils/linkParser";
import { useChatClipboardStore } from "@/stores/chat/clipboard";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ClipboardEvent,
    type Dispatch,
    type ReactNode,
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
    onGifSelect?: (gif: GifItem) => void;
    editMode?: boolean;
    /** Hide the attachment (clip) icon — useful when the upload flow isn't available */
    showAttachment?: boolean;
    /** Reduce height/padding for compact contexts (e.g. inline reply bars) */
    compact?: boolean;
    /** Glass pill for overlays (e.g. image viewer reply) */
    floating?: boolean;
    /** Renders above the input pill only (same width, excludes send button) */
    replySlot?: ReactNode;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'className'>;

const renderFilePreviews = (
    attachments: File[],
    handleRemoveFile: (file: File) => void,
) => (
    <div className="absolute bottom-14 left-0 right-0 z-50 mb-2 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain rounded-lg border border-border/70 bg-background-alt p-2 shadow-lg scrollbar-hide md:right-auto md:max-w-md">
        {attachments.map((file) => (
            <FilePreview
                key={`${file.name}-${file.size}-${file.lastModified}`}
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
    onGifSelect,
    editMode = false,
    showAttachment = true,
    compact = false,
    floating = false,
    replySlot,
    ...props }: ChatInputProps) => {

    const [isAttachmentClicked, setIsAttachmentClicked] = useState(false);
    const [isEmojiClicked, setIsEmojiClicked] = useState(false);

    const clipIconRef = useRef<HTMLSpanElement | null>(null);
    const emojiIconRef = useRef<HTMLSpanElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Link preview state
    const [detectedLink, setDetectedLink] = useState<ParsedLink | null>(null);
    const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!editMode) return;
        setIsAttachmentClicked(false);
        setIsEmojiClicked(false);
    }, [editMode]);

    // Debounced URL detection — 400ms after the user stops typing
    useEffect(() => {
        if (editMode) return;
        const id = setTimeout(() => {
            const links = extractLinksFromText(message);
            setDetectedLink(links[0] ?? null);
        }, 400);
        return () => clearTimeout(id);
    }, [message, editMode]);

    // Clear dismissed state when message changes to a different URL
    useEffect(() => {
        if (!detectedLink || detectedLink.url !== dismissedUrl) {
            setDismissedUrl(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detectedLink?.url]);

    useEffect(() => {
        const node = textareaRef.current;
        if (!node) return;
        node.style.height = 'auto';
        const minH = compact ? 28 : 40;
        node.style.height = `${Math.max(minH, Math.min(node.scrollHeight, MAX_TEXTAREA_HEIGHT))}px`;
        if (editMode) {
            node.focus();
            const len = node.value.length;
            node.setSelectionRange(len, len);
        }
    }, [message, editMode, compact]);

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
    const hasReply = Boolean(replySlot);

    const inputShellClass = editMode
        ? 'border-green/45 bg-green/10'
        : floating
          ? 'border-white/15 bg-black/45 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-md md:bg-black/45'
          : 'border-border bg-primary/40 md:bg-transparent';

    return (
        <div className="relative w-full">
            {!editMode && attachments.length > 0 && renderFilePreviews(attachments, handleRemoveFile)}
            {!editMode && attachments.length === 0 && detectedLink && detectedLink.url !== dismissedUrl && (
                <ComposerLinkPreview
                    key={detectedLink.url}
                    link={detectedLink}
                    onDismiss={() => setDismissedUrl(detectedLink.url)}
                />
            )}
            <div className="relative flex w-full items-end gap-2">
                <div className={`flex min-w-0 flex-1 flex-col ${hasReply ? 'overflow-hidden rounded-3xl shadow-[0_10px_36px_rgba(0,0,0,0.28),0_0_0_1px_rgba(1,195,109,0.14)]' : ''}`}>
                    {replySlot}
                    <div className="relative min-w-0">
                {!editMode && isAttachmentClicked && (
                    <AttachmentMenu
                        onClose={() => setIsAttachmentClicked(false)}
                        onFileSelect={handleFileSelect}
                        clipIconRef={clipIconRef}
                    />
                )}
                {!editMode && isEmojiClicked && (
                    <div className="absolute bottom-14 left-0 z-30 max-w-[calc(100vw-1rem)]">
                        <ComposerPicker
                            triggerRef={emojiIconRef}
                            setMessage={setMessage}
                            onClose={() => setIsEmojiClicked(false)}
                            onGifSelect={(gif) => {
                                onGifSelect?.(gif);
                                setIsEmojiClicked(false);
                            }}
                        />
                    </div>
                )}
                <div className={`flex w-full min-w-0 items-center gap-0.5 border px-1.5 py-0.5 md:gap-1 md:px-2 ${compact ? 'min-h-8' : 'min-h-10'} ${
                    hasReply ? 'rounded-b-3xl rounded-t-none border-t-0 border-green/15 bg-primary/50 md:bg-primary/30' : 'rounded-3xl'
                } ${hasReply && !editMode && !floating ? '' : inputShellClass}`}>
                    {!editMode ? (
                        <span ref={emojiIconRef} className="shrink-0">
                            <button
                                type="button"
                                className={`grid place-items-center rounded-full transition active:bg-background/40 ${compact ? 'h-7 w-7' : 'h-10 w-10'}`}
                                onClick={() => setIsEmojiClicked(prev => !prev)}
                                aria-label="Emoji"
                            >
                                <EmojiIcon className={compact ? 'h-4 w-4 hover:fill-body' : 'h-5 w-5 hover:fill-body'} />
                            </button>
                        </span>
                    ) : null}
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        enterKeyHint={editMode ? 'done' : 'send'}
                        autoComplete="off"
                        {...props}
                        onPaste={handlePaste}
                        className={`max-h-32 w-full min-w-0 resize-none overflow-y-auto bg-transparent px-1 outline-none md:px-2 ${compact ? 'text-sm min-h-7' : 'text-[16px] md:text-sm min-h-10'} ${
                            isMultiline
                                ? 'py-2 leading-snug'
                                : compact ? 'py-0 leading-7' : 'py-0 leading-10'
                        } ${className ?? ''}`}
                    />
                    {!editMode && showAttachment ? (
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
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSend}
                    className={`grid shrink-0 place-items-center rounded-full bg-gradient-green text-white shadow-md transition enabled:active:scale-95 disabled:opacity-40 ${compact ? 'h-8 w-8' : 'h-11 w-11 md:h-10 md:w-10'}`}
                    aria-label={editMode ? 'Save edit' : 'Send message'}
                >
                    <SendIcon className="mt-0.5 mr-0.5 h-5 w-5 fill-white" />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
