import AttachmentMenu from "@/components/attachment-menu/AttachmentMenu";
import FilePreview from "@/components/attachment-menu/FilePreview";
import EmojiMenu from "@/components/emoji-menu/EmojiMenu";
import ClipIcon from "@/components/icons/Clip";
import EmojiIcon from "@/components/icons/Emoji";
import SendIcon from "@/components/icons/Send";
import { MAX_FILES } from "@/lib/constants";
import { useCallback, useRef, useState, type Dispatch, type InputHTMLAttributes, type SetStateAction } from "react";
import toast from "react-hot-toast";

type ChatInputProps = {
    className?: string;
    message: string;
    setMessage: Dispatch<SetStateAction<string>>;
    attachments: File[];
    setAttachments: Dispatch<SetStateAction<File[]>>;
    handleSubmit: () => void | Promise<void>;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'className'>;

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
    ...props }: ChatInputProps) => {

    const [isAttachmentClicked, setIsAttachmentClicked] = useState(false);
    const [isEmojiClicked, setIsEmojiClicked] = useState(false);

    const clipIconRef = useRef<HTMLSpanElement | null>(null);
    const emojiIconRef = useRef<HTMLSpanElement | null>(null);

    const toggleAttachmentMenu = () => {
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

    const canSend = Boolean(message.trim()) || attachments.length > 0;

    return (
        <div className="relative w-full">
            {attachments.length > 0 && renderFilePreviews(attachments, handleRemoveFile)}
            <div className="relative flex w-full items-end gap-2">
                {isAttachmentClicked && (
                    <AttachmentMenu
                        onClose={() => setIsAttachmentClicked(false)}
                        onFileSelect={handleFileSelect}
                        clipIconRef={clipIconRef}
                    />
                )}
                {isEmojiClicked && (
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
                <div className="flex min-w-0 flex-1 items-center gap-0.5 rounded-[1.5rem] border border-border bg-primary/40 px-1.5 py-0.5 md:gap-1 md:bg-transparent md:px-2">
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
                    <input
                        type={'text'}
                        value={message}
                        enterKeyHint="send"
                        autoComplete="off"
                        {...props}
                        className={`w-full min-w-0 bg-transparent px-1 py-2.5 text-[16px] leading-snug outline-none md:px-2 md:py-2 md:text-sm ${className}`}
                    />
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
                </div>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSend}
                    className="mb-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-green text-white shadow-md transition enabled:active:scale-95 disabled:opacity-40 md:h-10 md:w-10"
                    aria-label="Send message"
                >
                    <SendIcon className="mt-0.5 mr-0.5 h-5 w-5 fill-white" />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
