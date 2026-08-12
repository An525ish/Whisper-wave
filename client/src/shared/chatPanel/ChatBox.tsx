import { fileFormat, type FileFormatKind } from '@/lib/features';
import { extractLinksFromText, isLinkOnlyMessage } from '@/lib/links';
import dayjs from 'dayjs';
import RenderAttachments from './RenderAttachments';
import LinkPreview from './LinkPreview';
import MessageContent from './MessageContent';
import { useAuthStore } from '@/stores/auth';
import Image from '@/components/ui/Image';
import ReadReceipt from '@/components/icons/ReadReceipt';
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
    showReadReceipt?: boolean;
    isRead?: boolean;
    highlightQuery?: string;
    searchHighlight?: boolean;
};

const ChatBox = ({
    chatData,
    isGroupChat,
    showReadReceipt = false,
    isRead = false,
    highlightQuery,
    searchHighlight = false,
}: ChatBoxProps) => {
    const { content, sender, attachments = [], createdAt } = chatData
    const links = content ? extractLinksFromText(content) : [];
    const linkOnly = content ? isLinkOnlyMessage(content) : false;

    const user = useAuthStore((s) => s.user);
    const sameSender = String(sender._id) === String(user?._id ?? '');
    const currentTime = dayjs(createdAt).format('hh:mm A');
    const displayName = sameSender
        ? (user?.name || sender.name || 'You')
        : (sender.name || 'Unknown');

    const renderReceipt = (hidden = false) => {
        if (!showReadReceipt) return null;

        return (
            <span
                className={`ml-1 inline-flex shrink-0 items-end pb-px ${hidden ? 'opacity-0' : ''}`}
                aria-label={isRead ? 'Read' : 'Sent'}
            >
                <ReadReceipt read={isRead} />
            </span>
        );
    };

    const renderTimestamp = (className: string) => (
        <time
            dateTime={createdAt}
            className={`inline-flex items-end ${className}`}
        >
            <span>{currentTime}</span>
            {renderReceipt()}
        </time>
    );

    const timeReserve = (
        <span
            aria-hidden
            className="inline-block whitespace-nowrap text-[11px] leading-[15px] ml-4 opacity-0 select-none pointer-events-none align-bottom"
        >
            {currentTime}
            {renderReceipt(true)}
        </span>
    );

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
    const linkVariant = sameSender ? 'outgoing' : 'incoming';

    return (
        <>
            {attachments.length > 0 &&
                <div className={`w-fit flex flex-col gap-3 ${searchHighlight ? 'search-focus-blink rounded-xl' : ''}`}>
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
                                    {renderTimestamp(
                                        `pointer-events-none absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium leading-none tracking-wide tabular-nums text-white-pure shadow-sm backdrop-blur-[1px]`,
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            }

            {(attachments.length === 0 || content) && (
                <div
                    className={`w-fit max-w-[min(100%,19rem)] flex gap-2 items-end shadow-[0_4px_18px_rgba(0,0,0,0.28)] ${
                        linkOnly
                            ? 'px-1.5 pb-2 pt-1.5'
                            : 'px-3.5 pb-2.5 pt-2'
                    } ${
                        sameSender
                            ? 'bubble-out self-end border border-green/35 bg-green-dark/55'
                            : 'bubble-in self-start border border-border bg-primary/90'
                    } ${searchHighlight ? 'search-focus-blink' : ''}`}
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
                        {linkOnly ? (
                            <div className="relative min-w-0 w-full">
                                {links.map((link, index) => (
                                    <LinkPreview
                                        key={link.url}
                                        link={link}
                                        variant={linkVariant}
                                        lead={index === 0}
                                    />
                                ))}
                                <div className="mt-1 text-right leading-none">
                                    {timeReserve}
                                </div>
                            </div>
                        ) : (
                            <>
                                {content ? (
                                    <p className="m-0 text-sm text-body break-words whitespace-pre-wrap leading-snug">
                                        <MessageContent
                                            content={content}
                                            highlightQuery={highlightQuery}
                                        />
                                        {links.length === 0 ? timeReserve : null}
                                    </p>
                                ) : null}
                                {links.length > 0 ? (
                                    <>
                                        {links.map((link, index) => (
                                            <LinkPreview
                                                key={link.url}
                                                link={link}
                                                variant={linkVariant}
                                                lead={index === 0 && !content}
                                            />
                                        ))}
                                        <div className="mt-1 text-right leading-none">
                                            {timeReserve}
                                        </div>
                                    </>
                                ) : null}
                            </>
                        )}
                        {renderTimestamp(
                            `absolute bottom-0 right-0 translate-y-[3px] text-[11px] leading-[15px] whitespace-nowrap pointer-events-none select-none ${
                                sameSender ? 'text-body-700' : 'text-body-300'
                            }`,
                        )}
                    </div>
                </div>
            )}

        </>
    )
}

export default ChatBox
