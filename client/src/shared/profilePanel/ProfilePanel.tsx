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
import {
    useChatDetailsQuery,
    useGetMediaQuery,
    useUpdateGroupDetailsMutation,
    useUpdateProfileMutation,
} from '@/features/api/hooks'
import useAsyncMutation from '@/hooks/asyncMutation'
import { getFirstName } from '@/utils/helper'
import {
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
    type ChangeEvent,
    type MouseEvent,
} from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/auth'
import { useProfileUiStore } from '@/stores/profileUi'
import { useParams } from 'react-router-dom'
import SharedContentSheet, {
    type SharedContentTab,
} from '@/shared/profilePanel/SharedContentSheet'
import ImagesIcon from '@/components/icons/Images'
import FilesIcon from '@/components/icons/FilesIcon'
import LinkIcon from '@/components/icons/Link'
import PencilIcon from '@/components/icons/Pencil'

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
    avatar?: string | string[] | { url?: string };
    bio?: string;
    creator?: { _id?: string; name?: string; avatar?: string };
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

const resolveAvatarSrc = (
    rawAvatar: ProfileDetailsData['avatar'] | undefined
): string | undefined => {
    if (!rawAvatar) return undefined;
    if (typeof rawAvatar === 'string') return rawAvatar;
    if (Array.isArray(rawAvatar)) {
        const first = rawAvatar.find((item) => typeof item === 'string' && item);
        return typeof first === 'string' ? first : undefined;
    }
    if (typeof rawAvatar === 'object' && 'url' in rawAvatar) {
        return rawAvatar.url;
    }
    return undefined;
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

type ProfilePanelProps = {
    variant?: 'column' | 'sheet';
    /** When true, show the signed-in user (editable) even if a chat is open. */
    forceSelf?: boolean;
};

const ProfilePanel = ({ variant = 'column', forceSelf = false }: ProfilePanelProps) => {
    const { chatId } = useParams()
    const socket = useSocket()
    const isSheet = variant === 'sheet'
    const avatarInputId = useId()
    const avatarInputRef = useRef<HTMLInputElement | null>(null)

    const user = useAuthStore((s) => s.user)
    const viewSelfProfile = useProfileUiStore((s) => s.viewSelfProfile)
    const closeSelfProfile = useProfileUiStore((s) => s.closeSelfProfile)
    const showSelfProfile = forceSelf || viewSelfProfile || !chatId

    const [viewerOpen, setViewerOpen] = useState(false);
    const [initialImageIndex, setInitialImageIndex] = useState(0);
    const [sharedSheetOpen, setSharedSheetOpen] = useState(false);
    const [sharedSheetTab, setSharedSheetTab] =
        useState<SharedContentTab>('photos');
    const [editingBio, setEditingBio] = useState(false);
    const [bioDraft, setBioDraft] = useState('');
    const [editingName, setEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState('');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const [updateProfile, { isLoading: isUpdatingProfile }] = useAsyncMutation(
        useUpdateProfileMutation,
    );
    const [updateGroup, { isLoading: isUpdatingGroup }] = useAsyncMutation(
        useUpdateGroupDetailsMutation,
    );

    const openSharedSheet = (tab: SharedContentTab) => {
        setSharedSheetTab(tab);
        setSharedSheetOpen(true);
    };


    const { data: profileDetails, isLoading, error, isError } = useChatDetailsQuery({
        id: chatId,
        populate: true
    }, { skip: !chatId || showSelfProfile })

    const { data: media, isLoading: isMediaLoading, error: mediaError, isError: isMediaError, refetch } = useGetMediaQuery({ chatId }, { skip: !chatId || showSelfProfile })

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

    useEffect(() => {
        return () => {
            if (avatarPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    useEffect(() => {
        if (!showSelfProfile) return;
        setNameDraft(user?.name ?? '');
        setBioDraft(user?.bio ?? '');
        setEditingName(false);
        setEditingBio(false);
    }, [showSelfProfile, user?.name, user?.bio]);

    if (chatId && !showSelfProfile) {
        if (isLoading) return <></>
        if (!profileDetails || !(profileDetails as ChatDetailsResponse).data) return <div>No profile data available</div>
    }

    const typedProfile = profileDetails as ChatDetailsResponse | undefined
    const profileData = showSelfProfile ? user : typedProfile?.data
    const name = profileData && 'name' in profileData ? profileData.name : undefined
    const bio = profileData && 'bio' in profileData ? profileData.bio : undefined
    const groupChat = showSelfProfile
        ? false
        : profileData && 'groupChat' in profileData
          ? profileData.groupChat
          : undefined
    const creator = showSelfProfile
        ? undefined
        : profileData && 'creator' in profileData
          ? profileData.creator
          : undefined
    const members = showSelfProfile
        ? undefined
        : profileData && 'members' in profileData
          ? profileData.members
          : undefined
    const rawAvatar = profileData && 'avatar' in profileData ? profileData.avatar : undefined

    const creatorName = creator ? getFirstName(creator.name) : 'Unknown'
    const otherMembers = (members ?? []).filter((m) => !m.isCreator)
    const userId = user?._id ? String(user._id) : ''
    const isOwnProfile = showSelfProfile
    const isGroupCreator =
        Boolean(groupChat) &&
        ((members ?? []).some(
            (member) => member.isCreator && String(member._id) === userId,
        ) ||
            (creator?._id != null && String(creator._id) === userId))
    const canEdit = isOwnProfile || isGroupCreator
    const isSaving = isUpdatingProfile || isUpdatingGroup

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
            window.open(url, '_blank');
        } else {
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

    const avatarSrc = avatarPreview ?? resolveAvatarSrc(rawAvatar);
    const nameMaxLength = groupChat ? 60 : 50;
    const bioMaxLength = 70;
    const showSelfExitActions = viewSelfProfile && Boolean(chatId);
    const savedName = (name ?? '').trim();
    const savedBio = (bio ?? '').trim();
    const nameDirty = nameDraft.trim() !== savedName;
    const bioDirty = bioDraft.trim() !== savedBio;
    const profileDirty = nameDirty || bioDirty;

    const startNameEdit = () => {
        setNameDraft(name ?? '');
        setEditingName(true);
        setEditingBio(false);
    };

    const cancelNameEdit = () => {
        setEditingName(false);
        setNameDraft(name ?? '');
    };

    const saveName = async () => {
        const nextName = nameDraft.trim();
        if (!nextName) {
            toast.error(groupChat ? 'Group name is required' : 'Name is required');
            return false;
        }

        if (isOwnProfile) {
            const formData = new FormData();
            formData.append('name', nextName);
            const result = await updateProfile('Updating name...', formData);
            if (result) {
                setEditingName(false);
                return true;
            }
            return false;
        }

        if (!chatId) return false;
        const formData = new FormData();
        formData.append('name', nextName);
        const result = await updateGroup('Updating group name...', {
            chatId,
            body: formData,
        });
        if (result !== null) {
            setEditingName(false);
            return true;
        }
        return false;
    };

    const startBioEdit = () => {
        setBioDraft(bio ?? '');
        setEditingBio(true);
        setEditingName(false);
    };

    const cancelBioEdit = () => {
        setEditingBio(false);
        setBioDraft(bio ?? '');
    };

    const saveBio = async () => {
        const nextBio = bioDraft.trim();
        if (isOwnProfile) {
            const formData = new FormData();
            formData.append('bio', nextBio);
            const result = await updateProfile('Updating bio...', formData);
            if (result) {
                setEditingBio(false);
                return true;
            }
            return false;
        }

        if (!chatId) return false;
        const formData = new FormData();
        formData.append('bio', nextBio);
        const result = await updateGroup('Updating group bio...', {
            chatId,
            body: formData,
        });
        if (result !== null) {
            setEditingBio(false);
            return true;
        }
        return false;
    };

    const handleCancelSelfProfile = () => {
        setNameDraft(name ?? '');
        setBioDraft(bio ?? '');
        setEditingName(false);
        setEditingBio(false);
        if (showSelfExitActions) closeSelfProfile();
    };

    const handleDoneSelfProfile = async () => {
        if (editingName || nameDirty) {
            const ok = await saveName();
            if (!ok) return;
        }
        if (editingBio || bioDirty) {
            const ok = await saveBio();
            if (!ok) return;
        }
        if (showSelfExitActions) closeSelfProfile();
    };

    const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || !canEdit) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please choose an image file');
            return;
        }

        if (avatarPreview?.startsWith('blob:')) {
            URL.revokeObjectURL(avatarPreview);
        }
        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);

        const formData = new FormData();
        formData.append('avatar', file);

        if (isOwnProfile) {
            await updateProfile('Updating photo...', formData);
            setAvatarPreview(null);
            URL.revokeObjectURL(previewUrl);
            return;
        }

        if (!chatId) return;
        await updateGroup('Updating group photo...', {
            chatId,
            body: formData,
        });
        setAvatarPreview(null);
        URL.revokeObjectURL(previewUrl);
    };

    // Self + group: display text with pencil; edit in place with ✓ / ✕
    const bioWidthClass =
        'w-[78%] max-w-[18rem] sm:max-w-[19.5rem] md:w-[72%] md:max-w-[17.5rem]';

    const nameBlock = (
        <div
            className={`flex min-h-10 w-full max-w-[18rem] shrink-0 items-center justify-center gap-1 px-3 sm:max-w-[20rem] ${
                isSheet ? '' : 'mx-auto mt-10'
            }`}
        >
            {editingName ? (
                <>
                    <input
                        value={nameDraft}
                        onChange={(e) =>
                            setNameDraft(e.target.value.slice(0, nameMaxLength))
                        }
                        maxLength={nameMaxLength}
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                void saveName();
                            }
                            if (e.key === 'Escape') cancelNameEdit();
                        }}
                        placeholder={
                            showSelfProfile || !groupChat ? 'Your name' : 'Group name'
                        }
                        className={`min-w-0 flex-1 border-0 border-b border-green/45 bg-transparent px-1 py-1 text-center font-medium capitalize text-body outline-none ${
                            isSheet ? 'text-lg' : 'text-xl'
                        }`}
                    />
                    <button
                        type="button"
                        onClick={cancelNameEdit}
                        disabled={isSaving}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-body-300 hover:text-body disabled:opacity-50"
                        aria-label="Cancel name edit"
                    >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => void saveName()}
                        disabled={isSaving}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-green hover:bg-green/15 disabled:opacity-50"
                        aria-label="Save name"
                    >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                            <path d="M5 12.5 10 17.5 19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </>
            ) : (
                <>
                    <p
                        className={`min-w-0 truncate text-center font-medium capitalize ${
                            isSheet ? 'text-lg' : 'text-xl'
                        }`}
                    >
                        {name}
                    </p>
                    {canEdit || showSelfProfile ? (
                        <button
                            type="button"
                            onClick={startNameEdit}
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-body-300 transition hover:text-green"
                            aria-label={
                                groupChat && !showSelfProfile
                                    ? 'Edit group name'
                                    : 'Edit name'
                            }
                        >
                            <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                    ) : null}
                </>
            )}
        </div>
    );

    const bioSection = (
        <div className="mt-4 flex min-h-[5.5rem] w-full flex-col items-center px-3 pb-2 text-center sm:min-h-[6.5rem] sm:px-4">
            <div className="flex w-fit items-center gap-1.5 border-0 border-b full-border px-6 pb-1 sm:px-8">
                <p className="text-body-700 capitalize">Bio</p>
                {(canEdit || showSelfProfile) && !editingBio ? (
                    <button
                        type="button"
                        onClick={startBioEdit}
                        className="grid h-6 w-6 place-items-center rounded-full text-body-300 transition hover:text-green"
                        aria-label="Edit bio"
                    >
                        <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                ) : null}
            </div>
            {editingBio ? (
                <div
                    className={`mt-3 rounded-xl border border-border bg-primary/35 p-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] focus-within:border-green/50 ${bioWidthClass}`}
                >
                    <textarea
                        value={bioDraft}
                        onChange={(e) =>
                            setBioDraft(e.target.value.slice(0, bioMaxLength))
                        }
                        rows={isSheet ? 2 : 3}
                        maxLength={bioMaxLength}
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') cancelBioEdit();
                        }}
                        placeholder={
                            groupChat && !showSelfProfile
                                ? 'Add a group bio'
                                : 'Write something about yourself'
                        }
                        className="w-full resize-none bg-transparent px-1.5 py-1 text-sm leading-relaxed text-body outline-none placeholder:text-body-300"
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2 px-0.5">
                        <span className="text-[11px] text-body-300">
                            {bioDraft.length}/{bioMaxLength}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={cancelBioEdit}
                                disabled={isSaving}
                                className="grid h-7 w-7 place-items-center rounded-full text-body-300 hover:text-body disabled:opacity-50"
                                aria-label="Cancel bio edit"
                            >
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                                    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => void saveBio()}
                                disabled={isSaving}
                                className="grid h-7 w-7 place-items-center rounded-full text-green hover:bg-green/15 disabled:opacity-50"
                                aria-label="Save bio"
                            >
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                                    <path d="M5 12.5 10 17.5 19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <p className={`mt-2 break-words text-sm leading-relaxed ${bioWidthClass}`}>
                    {bio?.trim() || 'No bio available'}
                </p>
            )}
        </div>
    );

    const selfProfileFooter = showSelfProfile ? (
        <div className="mt-auto flex min-h-0 flex-1 flex-col px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-4 sm:pb-5">
            <div className="flex min-h-0 flex-1 items-center justify-center py-2 sm:py-3">
                <img
                    src="/images/profile-illustration.svg"
                    alt=""
                    className="pointer-events-none h-auto w-full max-h-[34vh] max-w-[16rem] select-none object-contain opacity-85 sm:max-h-[40vh] sm:max-w-[19rem] md:max-w-[21rem]"
                />
            </div>
            <div className="flex w-full max-w-[17.5rem] shrink-0 items-center gap-2 self-center sm:max-w-xs">
                <button
                    type="button"
                    onClick={handleCancelSelfProfile}
                    disabled={isSaving}
                    className="flex-1 rounded-xl border border-border/70 px-3 py-2.5 text-sm font-medium text-body-300 transition hover:border-border hover:bg-primary/40 hover:text-body disabled:opacity-40"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={() => void handleDoneSelfProfile()}
                    disabled={isSaving || (!profileDirty && !showSelfExitActions)}
                    className="flex-1 rounded-xl bg-green px-3 py-2.5 text-sm font-medium text-black transition hover:bg-green/90 disabled:opacity-40"
                >
                    {profileDirty ? 'Save' : 'Done'}
                </button>
            </div>
        </div>
    ) : null;

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

            <div
                className={
                    isSheet
                        ? 'relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-none bg-background py-2 lg:rounded-2xl lg:bg-background-alt'
                        : 'relative mt-14 flex min-h-0 flex-1 flex-col rounded-2xl bg-background-alt py-2'
                }
            >
                {isSheet ? (
                    <div className="flex shrink-0 flex-col items-center gap-2 px-4 pb-2 pt-1">
                        <div className="relative h-20 w-20 rounded-full border-4 border-background bg-primary">
                            <div className="h-full w-full overflow-hidden rounded-full">
                                <Image
                                    src={avatarSrc}
                                    className="h-full w-full object-cover"
                                    alt={name}
                                />
                            </div>
                            {canEdit ? (
                                <>
                                    <label
                                        htmlFor={avatarInputId}
                                        className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/0 opacity-0 transition duration-200 hover:bg-black/45 hover:opacity-100 ${
                                            isSaving ? 'pointer-events-none' : ''
                                        }`}
                                        title={groupChat ? 'Change group photo' : 'Change photo'}
                                    >
                                        <img
                                            src="https://raw.githubusercontent.com/ThiagoLuizNunes/angular-boilerplate/master/src/assets/imgs/camera-white.png"
                                            alt=""
                                            className="h-8 w-8"
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={isSaving}
                                        className="absolute -bottom-0.5 -right-0.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-green text-black shadow-md ring-2 ring-background disabled:opacity-60"
                                        aria-label={groupChat ? 'Change group photo' : 'Change photo'}
                                    >
                                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                                            <path
                                                d="M4 8.5h2.2l1.1-1.8h5.4L14 8.5H16.5A1.5 1.5 0 0 1 18 10v7.5A1.5 1.5 0 0 1 16.5 19h-9A1.5 1.5 0 0 1 6 17.5V10a1.5 1.5 0 0 1 1.5-1.5"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            <circle cx="12" cy="13.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                                        </svg>
                                    </button>
                                    <input
                                        ref={avatarInputRef}
                                        id={avatarInputId}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                </>
                            ) : null}
                        </div>
                        {nameBlock}
                    </div>
                ) : (
                    <>
                        <div className="absolute -top-14 left-1/2 z-10 h-24 w-24 -translate-x-1/2 rounded-full border-8 border-background bg-primary">
                            <div className="h-full w-full overflow-hidden rounded-full">
                                <Image
                                    src={avatarSrc}
                                    className="w-full"
                                    alt={name}
                                />
                            </div>
                            {canEdit ? (
                                <>
                                    <label
                                        htmlFor={avatarInputId}
                                        className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/0 opacity-0 transition duration-200 hover:bg-black/45 hover:opacity-100 ${
                                            isSaving ? 'pointer-events-none' : ''
                                        }`}
                                        title={groupChat ? 'Change group photo' : 'Change photo'}
                                    >
                                        <img
                                            src="https://raw.githubusercontent.com/ThiagoLuizNunes/angular-boilerplate/master/src/assets/imgs/camera-white.png"
                                            alt=""
                                            className="h-8 w-8"
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={isSaving}
                                        className="absolute bottom-0 right-0 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-green text-black shadow-md ring-2 ring-background disabled:opacity-60"
                                        aria-label={groupChat ? 'Change group photo' : 'Change photo'}
                                    >
                                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                                            <path
                                                d="M4 8.5h2.2l1.1-1.8h5.4L14 8.5H16.5A1.5 1.5 0 0 1 18 10v7.5A1.5 1.5 0 0 1 16.5 19h-9A1.5 1.5 0 0 1 6 17.5V10a1.5 1.5 0 0 1 1.5-1.5"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            <circle cx="12" cy="13.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                                        </svg>
                                    </button>
                                    <input
                                        ref={avatarInputRef}
                                        id={avatarInputId}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                </>
                            ) : null}
                        </div>
                        {nameBlock}
                    </>
                )}

                <div
                    className={`mt-2 flex min-h-0 flex-1 flex-col ${
                        isSheet ? 'overflow-y-auto overscroll-contain scrollbar-hide' : ''
                    }`}
                >
                    <div className="shrink-0">
                        {chatId && groupChat ? (
                            <>
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
                                {bioSection}
                            </>
                        ) : (
                            bioSection
                        )}
                    </div>

                    {/* Photos → Attachments → Links (chat profiles only) */}
                    {!showSelfProfile ? (
                    <div
                        className={
                            isSheet
                                ? 'mt-2 border-t border-border/80 px-3 pb-4 pt-4'
                                : 'mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border/80 px-3 pb-4 pt-4'
                        }
                    >
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
                    ) : null}

                    {selfProfileFooter}
                </div>
            </div>
        </>
    )
}

export default ProfilePanel
