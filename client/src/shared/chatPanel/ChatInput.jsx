import AttachmentMenu from "@/components/attachment-menu/AttachmentMenu";
import FilePreview from "@/components/attachment-menu/FilePreview";
import EmojiMenu from "@/components/emoji-menu/EmojiMenu";
import ClipIcon from "@/components/icons/Clip";
import EmojiIcon from "@/components/icons/Emoji";
import MicrophoneIcon from "@/components/icons/Microphone";
import SendIcon from "@/components/icons/Send";
import { MAX_FILES } from "@/lib/constants";
import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";

const renderFilePreviews = (attachments, handleRemoveFile) => (
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
    ...props }) => {

    const [isAttachmentClicked, setIsAttachmentClicked] = useState(false);
    const [isEmojiClicked, setIsEmojiClicked] = useState(false);

    const clipIconRef = useRef(null);
    const emojiIconRef = useRef(null);

    const toggleAttachmentMenu = () => {
        setIsAttachmentClicked(prev => !prev);
    };

    const handleFileSelect = useCallback((type, files) => {
        setAttachments(prevSelectedFiles => {
            const newFiles = [...prevSelectedFiles, ...files];
            if (newFiles.length > MAX_FILES) {
                toast.error(`You can only upload up to ${MAX_FILES} ${type}`);
                return prevSelectedFiles;
            }
            return newFiles;
        });
    }, []);

    const handleRemoveFile = useCallback((fileToRemove) => {
        setAttachments(prev => prev.filter(file => file !== fileToRemove));
    }, []);


    return (
        <div className="relative">
            {attachments.length > 0 && renderFilePreviews(attachments, handleRemoveFile)}
            <div className="relative flex items-center">
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
                <div className="flex gap-1 items-center border border-border rounded-3xl px-2 w-[95%]">
                    <span ref={emojiIconRef}>
                        <EmojiIcon
                            className={'w-7 h-7 p-1 hover:fill-white cursor-pointer transition'}
                            onClick={() => setIsEmojiClicked(prev => !prev)}
                        />
                    </span>
                    <input
                        type={'text'}
                        value={message}

                        {...props}
                        className={`px-2 py-2 bg-transparent w-full outline-none ${className}`}
                    />
                    <MicrophoneIcon className={'w-7 h-7 p-1 hover:fill-white cursor-pointer transition'} />
                    <span ref={clipIconRef}>
                        <ClipIcon
                            className={'w-7 h-7 p-1 hover:fill-white cursor-pointer transition inline-block rotate-90'}
                            onClick={toggleAttachmentMenu}
                        />
                    </span>
                </div>
                <button
                    onClick={handleSubmit}
                    className="ml-4 w-10 h-10 rounded-full bg-primary grid place-items-center"
                >
                    <SendIcon className={'w-5 h-5 hover:fill-white cursor-pointer transition mr-0.5 mt-0.5'} />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;