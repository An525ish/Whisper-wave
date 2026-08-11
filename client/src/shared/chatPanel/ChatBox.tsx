import { fileFormat, type FileFormatKind } from '@/lib/features';
import dayjs from 'dayjs';
import RenderAttachments from './RenderAttachments';
import { useAuthStore } from '@/stores/auth';
import Image from '@/components/ui/Image';
import toast from 'react-hot-toast';
import type { Avatar } from '@/types';
import type { MouseEvent } from 'react';

type ChatAttachment = {
    url?: string;
    tempUrl?: string;
    name?: string;
    type?: string;
    size?: number;
    public_id?: string;
    uploading?: boolean;
};

type ChatSender = {
    _id: string;
    name?: string;
    avatar?: string | Avatar;
};

export type ChatBoxData = {
    content?: string;
    sender: ChatSender;
    attachments?: ChatAttachment[];
    createdAt?: string;
};

type ChatBoxProps = {
    chatData: ChatBoxData;
    isGroupChat?: boolean;
};

const ChatBox = ({ chatData, isGroupChat }: ChatBoxProps) => {
    const { content, sender, attachments = [], createdAt } = chatData

    const user = useAuthStore((s) => s.user);
    const sameSender = String(sender._id) === String(user?._id ?? '');
    const currentTime = dayjs(createdAt).format('hh:mm A');
    const displayName = sameSender
        ? (user?.name || sender.name || 'You')
        : (sender.name || 'Unknown');

    const handleFileAction = async (e: MouseEvent, attachment: ChatAttachment) => {
        e.preventDefault();
        const url = attachment.url || attachment.tempUrl;
        if (!url) return;
        const fileType: FileFormatKind = fileFormat(url);

        if (['image', 'video', 'pdf'].includes(fileType)) {
            // Open in a new tab for supported formats
            window.open(url, '_blank');
        } else {
            // Download for unsupported formats
            try {
                const file = await fetch(url)
                const blob = await file.blob()
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = attachment.name ?? 'download';
                link.click();
                window.URL.revokeObjectURL(url);
            } catch {
                toast.error('Download Failed')
            }
        }
    };

    const avatarSrc =
        typeof sender.avatar === 'string' ? sender.avatar : sender.avatar?.url;

    return (
        <>
            {attachments.length > 0 &&
                <div className={`w-fit flex flex-col gap-3`}>
                    {attachments.map((attachment, index) => {
                        const url = attachment.url || attachment.tempUrl;
                        const fileType = fileFormat(url);
                        const isUploading = attachment.uploading

                        return (
                            <div
                                key={attachment.public_id || index}
                                onClick={(e) => handleFileAction(e, attachment)}
                                className="cursor-pointer"
                            >
                                <div className='relative grid place-items-center rounded-lg'>
                                    <RenderAttachments
                                        fileType={fileType}
                                        url={url ?? ''}
                                        name={attachment.name}
                                        type={attachment.type}
                                        size={attachment.size}
                                        isUploading={isUploading}
                                    />
                                    <time
                                        dateTime={createdAt}
                                        className="pointer-events-none absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium leading-none tracking-wide text-white-pure tabular-nums shadow-sm backdrop-blur-[1px]"
                                    >
                                        {currentTime}
                                    </time>
                                </div>
                            </div>
                        );
                    })}
                </div>
            }

            {(attachments.length === 0 || content) && (
                <div
                    className={`w-fit max-w-full flex gap-2 items-end pt-2 pb-2.5 pl-3.5 pr-3.5 shadow-[0_4px_18px_rgba(0,0,0,0.28)] ${
                        sameSender
                            ? 'bubble-out self-end border border-green/35 bg-green-dark/55'
                            : 'bubble-in self-start border border-border bg-primary/90'
                    }`}
                >
                    {isGroupChat && (
                        <div className="border border-border/60 w-9 h-9 shrink-0 rounded-full overflow-hidden self-end ring-1 ring-white/5">
                            <Image
                                src={avatarSrc}
                                alt={sender.name ?? ''}
                                className={'w-full h-full object-cover'}
                            />
                        </div>
                    )}

                    <div className="relative min-w-0 max-w-full">
                        {isGroupChat ? (
                            <p
                                className={`mb-0.5 pr-1 text-xs font-medium capitalize tracking-wide ${
                                    sameSender ? 'text-green/80' : 'text-green'
                                }`}
                            >
                                {displayName}
                            </p>
                        ) : null}

                        {/*
                          WhatsApp Web technique:
                          - Invisible twin of the timestamp flows with the text
                            (widens short bubbles; wraps under long last lines).
                          - Visible timestamp is pinned to the bubble bottom-right,
                            sitting in that reserved space with no extra gap.
                        */}
                        <p className="m-0 text-sm text-body break-words whitespace-pre-wrap leading-snug">
                            {content}
                            <span
                                aria-hidden
                                className="inline-block whitespace-nowrap text-[11px] leading-[15px] ml-4 opacity-0 select-none pointer-events-none align-bottom"
                            >
                                {currentTime}
                            </span>
                        </p>
                        <time
                            dateTime={createdAt}
                            className={`absolute bottom-0 right-0 translate-y-[3px] text-[11px] leading-[15px] whitespace-nowrap pointer-events-none select-none ${
                                sameSender ? 'text-body-700' : 'text-body-300'
                            }`}
                        >
                            {currentTime}
                        </time>
                    </div>
                </div>
            )}

        </>
    )
}

export default ChatBox
