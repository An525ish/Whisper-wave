import AttachmentMenu from "@/components/attachment-menu/AttachmentMenu";
import FilePreview from "@/components/attachment-menu/FilePreview";
import EmojiMenu from "@/components/emoji-menu/EmojiMenu";
import ClipIcon from "@/components/icons/Clip";
import EmojiIcon from "@/components/icons/Emoji";
import MicrophoneIcon from "@/components/icons/Microphone";
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
    <div className="absolute bottom-10 p-1 bg-background-alt rounded-lg flex flex-wrap mb-2">
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


    return (
        <div className="relative w-full">
            {attachments.length > 0 && renderFilePreviews(attachments, handleRemoveFile)}
            <div className="relative flex w-full items-center">
                {isAttachmentClicked && (
                    <AttachmentMenu
                        onClose={() => setIsAttachmentClicked(false)}
                        onFileSelect={handleFileSelect}
                        clipIconRef={clipIconRef}
                    />
                )}
                {isEmojiClicked && <div className="absolute bottom-12">
                    <EmojiMenu
                        width={350}
                        height={350}
                        onClose={() => setIsEmojiClicked(false)}
                        emojiIconRef={emojiIconRef}
                        setMessage={setMessage}
                    />
                </div>}
                <div className="flex gap-2 items-center border border-border rounded-3xl px-2 flex-1 min-w-0">
                    <span ref={emojiIconRef}>
                        <EmojiIcon
                            className={'w-7 h-7 p-1 hover:fill-body cursor-pointer transition'}
                            onClick={() => setIsEmojiClicked(prev => !prev)}
                        />
                    </span>
                    <input
                        type={'text'}
                        value={message}

                        {...props}
                        className={`px-2 py-2 bg-transparent w-full outline-none ${className}`}
                    />
                    <MicrophoneIcon className={'w-7 h-7 p-1 hover:fill-body cursor-pointer transition'} />
                    <span ref={clipIconRef}>
                        <ClipIcon
                            className={'w-7 h-7 p-1 hover:fill-body cursor-pointer transition inline-block rotate-90'}
                            onClick={toggleAttachmentMenu}
                        />
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="ml-3 w-10 h-10 shrink-0 rounded-full bg-primary grid place-items-center"
                >
                    <SendIcon className={'w-5 h-5 hover:fill-body cursor-pointer transition mr-0.5 mt-0.5'} />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
