import AttachmentMenu from "@/components/chat/conversation/composer/attachment-menu/AttachmentMenu";
import FilePreview from "@/components/chat/conversation/composer/attachment-menu/FilePreview";
import ComposerLinkPreview from "@/components/chat/conversation/composer/ComposerLinkPreview";
import ComposerPicker from "@/components/chat/conversation/composer/ComposerPicker";
import ClipIcon from "@/components/ui/icons/Clip";
import EmojiIcon from "@/components/ui/icons/Emoji";
import SendIcon from "@/components/ui/icons/Send";
import type { GifItem } from "@/api/gif";
import { MAX_FILES } from "@/constants/app";
import { MAX_TEXTAREA_HEIGHT, COMPOSER_ROW_MIN_PX, COMPOSER_ROW_MIN_PX_COMPACT, COMPOSER_ROW_MIN_CLASS, COMPOSER_ROW_MIN_CLASS_COMPACT, COMPOSER_SEND_SIZE_CLASS, COMPOSER_SEND_SIZE_CLASS_COMPACT } from "@/constants/chat";
import { readFilesFromClipboardEvent } from "@/utils/chat";
import { extractLinksFromText, splitTextByUrls, type ParsedLink } from "@/utils/linkParser";
import { useChatClipboardStore } from "@/stores/chat/clipboard";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ClipboardEvent,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
    type TextareaHTMLAttributes,
} from "react";
import toast from "react-hot-toast";

type ImageQuality = 'standard' | 'hd';

type ChatInputProps = {
    className?: string;
    message: string;
    setMessage: Dispatch<SetStateAction<string>>;
    attachments: File[];
    setAttachments: Dispatch<SetStateAction<File[]>>;
    handleSubmit: () => void | Promise<void>;
    onGifSelect?: (gif: GifItem) => void;
    editMode?: boolean;
    showAttachment?: boolean;
    compact?: boolean;
    floating?: boolean;
    replySlot?: ReactNode;
    /** Fired when the composer height changes (e.g. link preview dock). */
    onComposerResize?: () => void;
    imageQuality?: ImageQuality;
    setImageQuality?: Dispatch<SetStateAction<ImageQuality>>;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'className'>;

const renderFilePreviews = (
    attachments: File[],
    handleRemoveFile: (file: File) => void,
    imageQuality: ImageQuality,
    setImageQuality: Dispatch<SetStateAction<ImageQuality>> | undefined,
) => {
    const hasCompressibleImage = attachments.some(
        (f) => f.type.startsWith('image/') && f.type !== 'image/gif',
    );
    return (
        <div className="absolute bottom-14 left-0 right-auto z-50 mb-2 flex max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-border/70 bg-background-alt shadow-lg md:max-w-md">
            {/* Vertical HD strip — left edge of the panel */}
            {hasCompressibleImage && setImageQuality ? (
                <button
                    type="button"
                    role="switch"
                    aria-checked={imageQuality === 'hd'}
                    aria-label={imageQuality === 'hd' ? 'HD on' : 'HD off'}
                    onClick={() => setImageQuality(imageQuality === 'hd' ? 'standard' : 'hd')}
                    className={`relative flex w-7 shrink-0 flex-col items-center justify-center gap-2.5 overflow-hidden border-r transition-all duration-300 active:opacity-70 ${
                        imageQuality === 'hd'
                            ? 'border-green/20 bg-gradient-to-b from-green/20 via-green/10 to-transparent'
                            : 'border-border/30 bg-transparent'
                    }`}
                >
                    {/* Left-edge glow bar */}
                    <span className={`absolute inset-y-5 left-0 w-[2px] rounded-r-full transition-all duration-300 ${
                        imageQuality === 'hd'
                            ? 'bg-green shadow-[0_0_8px_3px_rgba(1,195,109,0.5)] opacity-100'
                            : 'opacity-0'
                    }`} />

                    {/* Dot indicator */}
                    <span className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                        imageQuality === 'hd'
                            ? 'bg-green shadow-[0_0_6px_2px_rgba(1,195,109,0.7)]'
                            : 'bg-white/15'
                    }`} />

                    {/* "HD" — vertical writing mode, reads top → bottom */}
                    <span
                        style={{ writingMode: 'vertical-lr' }}
                        className={`text-[11px] font-black tracking-[0.12em] leading-none transition-all duration-300 ${
                            imageQuality === 'hd' ? 'text-green' : 'text-white/25'
                        }`}
                    >
                        HD
                    </span>
                </button>
            ) : null}
            {/* Thumbnail scroll row */}
            <div className="flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain p-2 scrollbar-hide">
                {attachments.map((file) => (
                    <FilePreview
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                        file={file}
                        onRemove={handleRemoveFile}
                    />
                ))}
            </div>
        </div>
    );
};

/** Mirror layer — stacked in the same grid cell as the textarea. Typography only; no min-height. */
const TextHighlightMirror = ({ parts, className }: { parts: ReturnType<typeof splitTextByUrls>; className: string }) => (
    <div
        aria-hidden
        className={`pointer-events-none col-start-1 row-start-1 overflow-hidden whitespace-pre-wrap wrap-break-word ${className}`}
    >
        {parts.map((part, i) =>
            part.type === 'url' ? (
                <span key={i} className="text-[#53bdeb]">{part.value}</span>
            ) : (
                <span key={i} className="text-transparent">{part.value}</span>
            ),
        )}
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
    onComposerResize,
    imageQuality = 'standard',
    setImageQuality,
    onChange: onChangeProp,
    ...props }: ChatInputProps) => {

    const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);

    // Menus are always closed in editMode — derived, not synced via effect
    const isAttachmentClicked = !editMode && isAttachmentOpen;
    const isEmojiClicked = !editMode && isEmojiOpen;

    const clipIconRef = useRef<HTMLSpanElement | null>(null);
    const emojiIconRef = useRef<HTMLSpanElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);

    const [detectedLink, setDetectedLink] = useState<ParsedLink | null>(null);
    const [dismissedLink, setDismissedLink] = useState<{ url: string; raw: string } | null>(null);

    // Parse once per message change — used for URL highlight, link preview, and mirror
    const parsedParts = useMemo(() => splitTextByUrls(message), [message]);
    const currentLinkRaw = parsedParts.find((part) => part.type === 'url')?.value ?? null;

    const syncDismissWithMessage = useCallback((next: string) => {
        setDismissedLink((dismissed) => {
            if (!dismissed) return dismissed;
            const nextRaw =
                splitTextByUrls(next).find((part) => part.type === 'url')?.value ?? null;
            return nextRaw === dismissed.raw ? dismissed : null;
        });
    }, []);

    const setMessageWithDismissSync = useCallback<Dispatch<SetStateAction<string>>>((value) => {
        if (typeof value === 'function') {
            setMessage((prev) => {
                const next = value(prev);
                syncDismissWithMessage(next);
                return next;
            });
            return;
        }
        syncDismissWithMessage(value);
        setMessage(value);
    }, [setMessage, syncDismissWithMessage]);

    // Debounced URL detection
    useEffect(() => {
        if (editMode) return;
        const id = setTimeout(() => {
            const links = extractLinksFromText(message);
            setDetectedLink(links[0] ?? null);
        }, 400);
        return () => clearTimeout(id);
    }, [message, editMode]);

    const activeUrl = detectedLink?.url ?? null;
    const isDismissed =
        dismissedLink !== null &&
        activeUrl === dismissedLink.url &&
        currentLinkRaw === dismissedLink.raw;

    useEffect(() => {
        const node = textareaRef.current;
        if (!node) return;
        node.style.height = 'auto';
        const minH = compact ? COMPOSER_ROW_MIN_PX_COMPACT : COMPOSER_ROW_MIN_PX;
        node.style.height = `${Math.max(minH, Math.min(node.scrollHeight, MAX_TEXTAREA_HEIGHT))}px`;
        if (editMode) {
            node.focus();
            const len = node.value.length;
            node.setSelectionRange(len, len);
        }
    }, [message, editMode, compact]);

    useEffect(() => {
        const node = rootRef.current;
        if (!node || !onComposerResize) return;
        const observer = new ResizeObserver(() => onComposerResize());
        observer.observe(node);
        return () => observer.disconnect();
    }, [onComposerResize]);

    const toggleAttachmentMenu = useCallback(() => {
        if (editMode) return;
        setIsAttachmentOpen(prev => !prev);
    }, [editMode]);

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
            setMessageWithDismissSync((prev) => (prev.trim() ? prev : textToApply));
        }
    }, [editMode, setAttachments, setMessageWithDismissSync]);

    const canSend = Boolean(message.trim()) || (!editMode && attachments.length > 0);
    const hasReply = Boolean(replySlot);
    const hasUrlHighlight = parsedParts.some((part) => part.type === 'url');

    const showLinkPreview = !editMode && attachments.length === 0 && detectedLink && !isDismissed;

    const inputShellClass = editMode
        ? 'border-green/45 bg-green/10'
        : floating
          ? 'border-white/15 bg-black/45 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-md md:bg-black/45'
          : 'border-border bg-primary/40 md:bg-transparent';

    const rowMinClass = compact ? COMPOSER_ROW_MIN_CLASS_COMPACT : COMPOSER_ROW_MIN_CLASS;
    const sendSizeClass = compact ? COMPOSER_SEND_SIZE_CLASS_COMPACT : COMPOSER_SEND_SIZE_CLASS;
    const textareaMinClass = compact ? 'min-h-8' : 'min-h-11';

    // Match line-height + vertical padding to COMPOSER_ROW_MIN_PX* so placeholder sits
    // centered in one row; unlike leading-11, a fixed ~22px line-height stays natural when wrapped.
    const textareaTypographyClass = compact
        ? 'px-1 md:px-2 text-sm leading-5 py-1.5'
        : 'px-1 md:px-2 text-[16px] md:text-sm leading-[22px] py-[11px]';

    const textareaClassName = [
        'max-h-32 w-full min-w-0 resize-none overflow-y-auto bg-transparent outline-none',
        textareaTypographyClass,
        textareaMinClass,
        hasUrlHighlight ? 'col-start-1 row-start-1 text-transparent' : '',
        className ?? '',
    ].join(' ');

    return (
        <div ref={rootRef} className="relative w-full">
            {!editMode && attachments.length > 0 && renderFilePreviews(attachments, handleRemoveFile, imageQuality, setImageQuality)}
            <div className={`flex min-w-0 flex-1 flex-col ${hasReply ? 'overflow-hidden rounded-3xl shadow-[0_10px_36px_rgba(0,0,0,0.28),0_0_0_1px_rgba(1,195,109,0.14)]' : ''}`}>
                {replySlot}
                <div className="flex min-w-0 items-end gap-2">
                    <div className="relative min-w-0 flex-1">
                        {!editMode && isAttachmentClicked && (
                            <AttachmentMenu
                                onClose={() => setIsAttachmentOpen(false)}
                                onFileSelect={handleFileSelect}
                                clipIconRef={clipIconRef}
                            />
                        )}
                        {!editMode && isEmojiClicked && (
                            <div className="absolute bottom-14 left-0 z-30 max-w-[calc(100vw-1rem)]">
                                <ComposerPicker
                                    triggerRef={emojiIconRef}
                                    setMessage={setMessageWithDismissSync}
                                    onClose={() => setIsEmojiOpen(false)}
                                    onGifSelect={(gif) => {
                                        onGifSelect?.(gif);
                                        setIsEmojiOpen(false);
                                    }}
                                />
                            </div>
                        )}
                        <div className={`flex h-full w-full min-w-0 flex-col overflow-hidden border ${
                            hasReply ? 'rounded-b-3xl rounded-t-none border-t-0 border-green/15 bg-primary/50 md:bg-primary/30' : 'rounded-3xl'
                        } ${hasReply && !editMode && !floating ? '' : inputShellClass}`}>
                            {showLinkPreview && detectedLink ? (
                                <ComposerLinkPreview
                                    key={detectedLink.url}
                                    link={detectedLink}
                                    hasReplyAbove={hasReply}
                                    onDismiss={() => {
                                        if (!detectedLink || !currentLinkRaw) return;
                                        setDismissedLink({ url: detectedLink.url, raw: currentLinkRaw });
                                    }}
                                />
                            ) : null}
                            <div className={`flex w-full min-w-0 items-center gap-0.5 px-1.5 md:gap-1 md:px-2 ${rowMinClass} ${
                                showLinkPreview ? 'border-t border-border/25' : ''
                            }`}>
                            {!editMode ? (
                                <span ref={emojiIconRef} className="shrink-0">
                                    <button
                                        type="button"
                                        className={`grid place-items-center rounded-full transition active:bg-background/40 ${compact ? 'h-7 w-7' : 'h-10 w-10'}`}
                                        onClick={() => setIsEmojiOpen(prev => !prev)}
                                        aria-label="Emoji"
                                    >
                                        <EmojiIcon className={compact ? 'h-4 w-4 hover:fill-body' : 'h-5 w-5 hover:fill-body'} />
                                    </button>
                                </span>
                            ) : null}

                            <div className={`min-w-0 w-full ${hasUrlHighlight ? 'grid' : 'contents'}`}>
                                {hasUrlHighlight ? (
                                    <TextHighlightMirror parts={parsedParts} className={textareaTypographyClass} />
                                ) : null}
                                <textarea
                                    ref={textareaRef}
                                    rows={1}
                                    value={message}
                                    enterKeyHint={editMode ? 'done' : 'send'}
                                    autoComplete="off"
                                    {...props}
                                    onPaste={handlePaste}
                                    onChange={(e) => {
                                        syncDismissWithMessage(e.target.value);
                                        if (onChangeProp) {
                                            onChangeProp(e);
                                        } else {
                                            setMessage(e.target.value);
                                        }
                                    }}
                                    style={hasUrlHighlight ? { caretColor: 'var(--color-body)' } : undefined}
                                    className={textareaClassName}
                                />
                            </div>

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
                        className={`grid shrink-0 place-items-center rounded-full bg-gradient-green text-white shadow-md transition enabled:active:scale-95 disabled:opacity-40 ${sendSizeClass}`}
                        aria-label={editMode ? 'Save edit' : 'Send message'}
                    >
                        <SendIcon className="mt-0.5 mr-0.5 h-5 w-5 fill-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
