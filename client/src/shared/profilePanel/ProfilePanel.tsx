import ImageViewer from '@/components/image-viewer/Image-Viewer'
import SkeletonBox from '@/components/skeletons/SkeletonBox'
import EmptyState from '@/components/ui/EmptyState'
import Image from '@/components/ui/Image'
import {
    RetryableMediaImage,
    RetryableMediaVideo,
} from '@/components/media/RetryableMedia'
import Carousel, { AvatarRing } from '@/components/ui/carousel/Carousel'
import useErrors from '@/hooks/error'
import { useSocket } from '@/socket/SocketProvider'
import useSocketEvent from '@/hooks/socketEvent'
import { fileData, fileFormat, getMediaDisplayName, getMediaKindFromFile } from '@/lib/features'
import { NEW_ATTACHMENT, NEW_MESSAGE } from '@/lib/socketConstants'
import { useChatDetailsQuery, useGetMediaQuery } from '@/features/api/hooks'
import { getFirstName } from '@/utils/helper'
import { useCallback, useState, type MouseEvent } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/auth'
import { useParams } from 'react-router-dom'
import SharedContentSheet, {
    type SharedContentTab,
} from '@/shared/profilePanel/SharedContentSheet'
import ImagesIcon from '@/components/icons/Images'
import FilesIcon from '@/components/icons/FilesIcon'
import LinkIcon from '@/components/icons/Link'

type MediaFile = {
    _id?: string;
    publicId?: string;
    name?: string;
    url?: string;
    fileType?: string;
};

type SharedLink = {
    url: string;
    host: string;
    messageId: string;
};

type ProfileMember = {
    _id?: string;
    name?: string;
    avatar?: string;
    isCreator?: boolean;
};

type ProfileDetailsData = {
    name?: string;
    avatar?: string;
    bio?: string;
    creator?: { name?: string; avatar?: string };
    members?: ProfileMember[];
    groupChat?: boolean;
};

type ChatDetailsResponse = {
    data?: ProfileDetailsData;
};

type MediaResponse = {
    data?:
        | MediaFile[]
        | {
              attachments?: MediaFile[];
              links?: SharedLink[];
          };
};

const normalizeSharedContent = (
    data: MediaResponse['data']
): { attachments: MediaFile[]; links: SharedLink[] } => {
    if (!data) return { attachments: [], links: [] };
    if (Array.isArray(data)) return { attachments: data, links: [] };
    return {
        attachments: data.attachments ?? [],
        links: data.links ?? [],
    };
};

const renderMediaThumbnail = (file: MediaFile) => {
    const kind = getMediaKindFromFile(file)

    switch (kind) {
        case 'image':
            return (
                <RetryableMediaImage
                    url={file.url ?? ''}
                    alt={getMediaDisplayName({ name: file.name, url: file.url, publicId: file.publicId, fileType: file.fileType })}
                    className="w-full aspect-[5/4] bg-primary rounded-lg object-cover"
                    fallbackIconClassName="h-10 w-10"
                />
            )
        case 'video':
            return (
                <RetryableMediaVideo
                    url={file.url ?? ''}
                    className="w-full aspect-[5/4] bg-primary object-cover rounded-lg"
                    fallbackIconClassName="h-10 w-10"
                    muted
                    playsInline
                    preload="metadata"
                />
            )
        case 'audio':
            return (
                <div className="w-full aspect-[5/4] bg-primary rounded-lg flex items-center justify-center">
                    <img src="/icons/music-icon.svg" alt="Audio" className="w-10 h-10 opacity-80" />
                </div>
            )
    }
}


type ShowAllButtonProps = {
    onClick: () => void;
};

const ShowAllButton = ({ onClick }: ShowAllButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        className="group inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-body-300 transition duration-200 hover:text-green"
    >
        <span className="underline-offset-4 group-hover:underline decoration-green/50">
            Show all
        </span>
        <svg
            aria-hidden
            viewBox="0 0 16 16"
            fill="none"
            className="h-3 w-3 translate-x-0 transition duration-200 group-hover:translate-x-0.5"
        >
            <path
                d="M6 3.5 10.5 8 6 12.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </button>
);

const sectionIconClass =
    'h-4 w-4 shrink-0 fill-body-300 stroke-body-300';

const sectionLinkIconClass = 'h-4 w-4 shrink-0 stroke-body-300';

const ProfilePanel = () => {
    const { chatId } = useParams()
    const socket = useSocket()

    const user = useAuthStore((s) => s.user)

    const [viewerOpen, setViewerOpen] = useState(false);
    const [initialImageIndex, setInitialImageIndex] = useState(0);
    const [sharedSheetOpen, setSharedSheetOpen] = useState(false);
    const [sharedSheetTab, setSharedSheetTab] =
        useState<SharedContentTab>('photos');

    const openSharedSheet = (tab: SharedContentTab) => {
        setSharedSheetTab(tab);
        setSharedSheetOpen(true);
    };


    const { data: profileDetails, isLoading, error, isError } = useChatDetailsQuery({
        id: chatId,
        populate: true
    }, { skip: !chatId })

    const { data: media, isLoading: isMediaLoading, error: mediaError, isError: isMediaError, refetch } = useGetMediaQuery({ chatId }, { skip: !chatId })

    useErrors([{ error, isError }, { mediaError, isMediaError }])

    const newAttachmentListener = useCallback(() => {
        refetch()
    }, [refetch],
    )

    const events = {
        [NEW_ATTACHMENT]: newAttachmentListener,
        [NEW_MESSAGE]: newAttachmentListener,
    }

    useSocketEvent(socket, events)

    if (chatId) {
        if (isLoading) return <></>
        if (!profileDetails || !(profileDetails as ChatDetailsResponse).data) return <div>No profile data available</div>
    }

    const typedProfile = profileDetails as ChatDetailsResponse | undefined
    const profileData = chatId ? typedProfile?.data : user
    const name = profileData && 'name' in profileData ? profileData.name : undefined
    const bio = profileData && 'bio' in profileData ? profileData.bio : undefined
    const groupChat = profileData && 'groupChat' in profileData ? profileData.groupChat : undefined
    const creator = profileData && 'creator' in profileData ? profileData.creator : undefined
    const members = profileData && 'members' in profileData ? profileData.members : undefined
    const rawAvatar = profileData && 'avatar' in profileData ? profileData.avatar : undefined

    const creatorName = creator ? getFirstName(creator.name) : 'Unknown'
    const otherMembers = (members ?? []).filter((m) => !m.isCreator)

    const { attachments: mediaData, links: sharedLinks } = normalizeSharedContent(
        (media as MediaResponse | undefined)?.data
    )
    const mediaFiles = mediaData.filter((file) => file.fileType !== 'document')
    const docFiles = mediaData.filter((file) => file.fileType === 'document')

    const viewerMediaFiles = mediaFiles
        .filter((f): f is MediaFile & { url: string } => Boolean(f.url))
        .map((f) => ({
            _id: f._id ?? f.publicId ?? f.url,
            url: f.url,
            name: f.name,
            publicId: f.publicId,
            fileType: f.fileType,
        }));

    const openImageViewerForFile = (file: MediaFile) => {
        const index = viewerMediaFiles.findIndex(
            (item) =>
                item.url === file.url ||
                (file._id && item._id === file._id) ||
                (file.publicId && item._id === file.publicId),
        );
        if (index >= 0) {
            setInitialImageIndex(index);
            setViewerOpen(true);
        }
    };

    const handleFileAction = async (e: MouseEvent, url: string | undefined, fileName: string | undefined) => {
        e.preventDefault();
        if (!url) return;
        const fileType = fileFormat(url);

        if (['pdf'].includes(fileType)) {
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
                link.download = fileName ?? 'download';
                link.click();
                window.URL.revokeObjectURL(url);
            } catch {
                toast.error('Download Failed')
            }
        }
    };

    const avatarSrc =
        typeof rawAvatar === 'string'
            ? rawAvatar
            : rawAvatar && typeof rawAvatar === 'object' && 'url' in rawAvatar
                ? rawAvatar.url
                : undefined;

    return (
        <>
            {sharedSheetOpen ? (
                <SharedContentSheet
                    mediaFiles={mediaFiles}
                    docFiles={docFiles}
                    links={sharedLinks}
                    initialTab={sharedSheetTab}
                    onClose={() => setSharedSheetOpen(false)}
                    onOpenPhoto={openImageViewerForFile}
                    onOpenDocument={handleFileAction}
                />
            ) : null}

            {viewerOpen ? (
                <ImageViewer
                    mediaFiles={viewerMediaFiles}
                    initialIndex={initialImageIndex}
                    onClose={() => setViewerOpen(false)}
                />
            ) : null}

            <div className="relative bg-background-alt rounded-2xl mt-14 flex-1 min-h-0 py-2 flex flex-col">
                <div className="w-24 h-24 rounded-full bg-primary absolute -top-14 left-1/2 -translate-x-1/2 overflow-hidden z-10 border-8 border-background">
                    <Image src={avatarSrc} className={'w-full'} alt={name} />
                </div>

                <p className="mx-auto mt-10 w-full max-w-52 shrink-0 truncate px-2 text-center text-xl font-medium capitalize">{name}</p>

                <div className="flex flex-col flex-1 min-h-0 mt-2">
                    <div className="shrink-0">
                        {chatId && groupChat ? (
                            <section className="mx-3 mt-1 flex flex-col gap-3 rounded-2xl bg-primary/40 px-3.5 py-3.5 ring-1 ring-border/50 sm:grid sm:grid-cols-[6.5rem_1px_1fr] sm:items-center sm:gap-x-4">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="relative">
                                        <AvatarRing tone="green" className="h-[4.75rem] w-[4.75rem]">
                                            <Image
                                                src={creator?.avatar}
                                                alt={creatorName}
                                                className="h-full w-full rounded-full object-cover bg-background-alt"
                                            />
                                        </AvatarRing>
                                        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[4px] bg-black-dark px-1.5 py-[2px] text-[8px] font-semibold uppercase tracking-[0.16em] text-gold ring-1 ring-gold/55">
                                            Creator
                                        </span>
                                    </div>
                                    <p className="mt-1 w-full truncate text-center text-sm font-medium capitalize leading-tight text-body">
                                        {creatorName}
                                    </p>
                                </div>

                                <div
                                    className="h-px w-full self-stretch bg-gradient-to-r from-transparent via-border to-transparent sm:h-full sm:min-h-20 sm:w-auto sm:bg-gradient-to-b"
                                    aria-hidden
                                />

                                <Carousel
                                    members={otherMembers.map((m) => ({
                                        _id: m._id ?? '',
                                        name: m.name ?? '',
                                        avatar: m.avatar ?? null,
                                    }))}
                                    className="min-w-0"
                                />
                            </section>
                        ) : (
                            <div className="px-4 mt-4 text-center pb-2">
                                <p className="text-body-700 w-fit mx-auto px-12 capitalize border-0 border-b full-border pb-1">Bio</p>
                                <p className="mt-2 text-sm">{bio || 'No bio available'}</p>
                            </div>
                        )}
                    </div>

                    {/* Photos → Attachments → Links (scrolls on short screens) */}
                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pt-4 mt-2 border-t border-border/80 pb-4">
                        <section className="rounded-2xl bg-primary/35 px-3 py-3.5">
                            <div className="flex items-center justify-between gap-2 px-0.5 mb-3">
                                <p className="flex items-center gap-2 text-sm text-body-700 tracking-wide">
                                    <ImagesIcon className={sectionIconClass} />
                                    Photos & Multimedia
                                </p>
                                <ShowAllButton onClick={() => openSharedSheet('photos')} />
                            </div>

                            <div className="grid grid-cols-3 gap-1.5">
                                {isMediaLoading
                                    ? Array(6)
                                          .fill(0)
                                          .map((_, i) => (
                                              <SkeletonBox
                                                  key={i}
                                                  className="w-full aspect-[5/4] rounded-lg bg-background-alt"
                                              />
                                          ))
                                    : mediaFiles.length === 0
                                      ? (
                                            <EmptyState
                                              className="col-span-3 py-4"
                                              imageSrc="/images/no-media.svg"
                                              imageAlt="no-media"
                                              imageClassName="w-16 opacity-45"
                                              titleClassName="text-center text-body-300 text-xs mt-2"
                                              title="No media yet"
                                            />
                                        )
                                      : mediaFiles.slice(0, 6).map((file, index) => (
                                            <button
                                                type="button"
                                                key={file._id ?? file.publicId ?? file.url ?? index}
                                                onClick={() => openImageViewerForFile(file)}
                                                className="overflow-hidden rounded-lg ring-1 ring-border/50 hover:ring-green/40 hover:opacity-90 transition duration-200 p-0"
                                            >
                                                {renderMediaThumbnail(file)}
                                            </button>
                                        ))}
                            </div>
                        </section>

                        <section className="mt-3 rounded-2xl bg-primary/35 px-3 py-3.5">
                            <div className="flex items-center justify-between gap-2 px-0.5 mb-3">
                                <p className="flex items-center gap-2 text-sm text-body-700 tracking-wide">
                                    <FilesIcon className={sectionIconClass} />
                                    Attachments
                                </p>
                                <ShowAllButton onClick={() => openSharedSheet('attachments')} />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                {isMediaLoading
                                    ? Array(3)
                                          .fill(0)
                                          .map((_, i) => (
                                              <SkeletonBox
                                                  key={i}
                                                  className="w-full h-10 rounded-xl bg-background-alt"
                                              />
                                          ))
                                    : docFiles.length === 0
                                      ? (
                                            <EmptyState
                                              imageSrc="/images/no-documents.svg"
                                              imageAlt="no-documents"
                                              imageClassName="w-16 opacity-45"
                                              titleClassName="text-center text-body-300 text-xs mt-2"
                                              title="No documents yet"
                                            />
                                        )
                                      : docFiles.slice(0, 3).map(({ _id, publicId, name: docName, url }, index) => {
                                            const fileExtension = fileFormat(docName);
                                            const file = fileData.find(
                                                (item) => item.docType === fileExtension
                                            );
                                            return (
                                                <button
                                                    type="button"
                                                    key={_id ?? publicId ?? url ?? index}
                                                    onClick={(e) =>
                                                        handleFileAction(e, url, docName)
                                                    }
                                                    className="flex w-full items-center gap-3 rounded-xl bg-background-alt/70 px-3 py-2.5 text-left ring-1 ring-border/40 hover:ring-green/35 hover:bg-background-alt transition duration-200"
                                                >
                                                    <img
                                                        src={file?.icon}
                                                        alt=""
                                                        className="w-5 h-5 shrink-0"
                                                    />
                                                    <span className="min-w-0 flex-1 truncate text-sm capitalize text-body-700">
                                                        {docName}
                                                    </span>
                                                </button>
                                            );
                                        })}
                            </div>
                        </section>

                        <section className="mt-3 rounded-2xl bg-primary/35 px-3 py-3.5">
                            <div className="flex items-center justify-between gap-2 px-0.5 mb-3">
                                <p className="flex items-center gap-2 text-sm text-body-700 tracking-wide">
                                    <LinkIcon className={sectionLinkIconClass} />
                                    Links
                                </p>
                                {sharedLinks.length > 0 ? (
                                    <ShowAllButton
                                        onClick={() => openSharedSheet('links')}
                                    />
                                ) : null}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                {isMediaLoading
                                    ? Array(3)
                                          .fill(0)
                                          .map((_, i) => (
                                              <SkeletonBox
                                                  key={i}
                                                  className="w-full h-12 rounded-xl bg-background-alt"
                                              />
                                          ))
                                    : sharedLinks.length === 0
                                      ? (
                                            <EmptyState
                                              className="py-4"
                                              imageSrc="/images/no-link.svg"
                                              imageAlt="no links"
                                              imageClassName="w-20 opacity-45"
                                              titleClassName="text-center text-body-300 text-xs mt-2"
                                              title="No links yet"
                                            />
                                        )
                                      : sharedLinks.slice(0, 3).map((link) => (
                                            <a
                                                key={`${link.messageId}-${link.url}`}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex w-full items-start gap-3 rounded-xl bg-background-alt/70 px-3 py-2.5 text-left ring-1 ring-border/40 hover:ring-green/35 hover:bg-background-alt transition duration-200"
                                            >
                                                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-green-dark/60 ring-1 ring-green/25">
                                                    <LinkIcon className="h-4 w-4 stroke-green" />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm text-body">
                                                        {link.host}
                                                    </span>
                                                    <span className="block truncate text-[11px] text-body-300 mt-0.5">
                                                        {link.url}
                                                    </span>
                                                </span>
                                            </a>
                                        ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProfilePanel
