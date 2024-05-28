import ClipIcon from "@/components/icons/Clip"
import EmojiIcon from "@/components/icons/Emoji"
import MicrophoneIcon from "@/components/icons/Microphone"
import SendIcon from "@/components/icons/Send"

const ChatInput = ({ className, ...props }) => {
    return (
        <div className="flex items-center">
            <div className="flex gap-1 items-center border border-border rounded-3xl px-2 w-[95%]">
                <EmojiIcon className={'w-7 h-7 p-1 hover:fill-white cursor-pointer transition'} />

                <input
                    type={'text'}
                    {...props}
                    className={`px-2 py-2 bg-transparent w-full outline-none ${className}`}
                />
                <MicrophoneIcon className={'w-7 h-7 p-1 hover:fill-white cursor-pointer transition'} />

                <ClipIcon className={'w-7 h-7 p-1 hover:fill-white cursor-pointer transition inline-block rotate-90'} />

            </div>

            <div className="ml-4 w-10 h-10 rounded-full bg-primary grid place-items-center">
                <SendIcon className={'w-5 h-5 hover:fill-white cursor-pointer transition mr-0.5 mt-0.5'} />
            </div>
        </div>
    )
}

export default ChatInput