import { useCallback, useId, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';
import { useProfileUiStore } from '@/features/profile/store';
import { useChatDetailsQuery, useGetMediaQuery } from '@/features/chat';
import useErrors from '@/shared/hooks/useError';
import useFileDownload from '@/shared/hooks/useFileDownload';
import { useSocket } from '@/shared/lib/socket/SocketProvider';
import useSocketEvent from '@/shared/hooks/useSocketEvent';
import { fileFormat } from '@/shared/utils/fileFormat';
import { resolveAvatarSrc } from '@/shared/utils/helpers';
import { SOCKET_EVENTS } from '@/shared/constants/socket';
import { useProfileEditing } from '@/features/profile/hooks/useProfileEditing';
import { useProfileMediaViewer } from '@/features/profile/hooks/useProfileMediaViewer';
import type { SharedContentTab, MediaFile, SharedLink } from '@/features/profile/components/shared-content/types';
import type { ProfileMember, ProfileDetailsData, ProfileDetailsResponse, MediaResponse, ViewerMediaFile } from '@/features/profile/types';

// Single source of truth for these lives in features/profile/types.ts; re-exported
// here so existing consumers importing from useProfilePanel keep resolving.
export type { ViewerMediaFile };

const normalizeSharedContent = (
  data: MediaResponse['data'],
): { attachments: MediaFile[]; links: SharedLink[] } => {
  if (!data) return { attachments: [], links: [] };
  if (Array.isArray(data)) return { attachments: data, links: [] };
  return { attachments: data.attachments ?? [], links: data.links ?? [] };
};

export type UseProfilePanelReturn = {
  showSelfProfile: boolean
  isOwnProfile: boolean
  canEdit: boolean
  isSaving: boolean
  groupChat: boolean | undefined
  name: string | undefined
  bio: string | undefined
  avatarSrc: string | undefined
  creator: ProfileDetailsData['creator'] | undefined
  members: ProfileMember[] | undefined
  chatId: string | undefined
  mediaFiles: MediaFile[]
  docFiles: MediaFile[]
  sharedLinks: SharedLink[]
  isMediaLoading: boolean
  viewerMediaFiles: ViewerMediaFile[]
  editingName: boolean
  editingBio: boolean
  nameDraft: string
  bioDraft: string
  setNameDraft: (v: string) => void
  setBioDraft: (v: string) => void
  nameMaxLength: number
  bioMaxLength: number
  sharedSheetOpen: boolean
  sharedSheetTab: SharedContentTab
  viewerOpen: boolean
  initialImageIndex: number
  showSelfExitActions: boolean
  isSheet: boolean
  avatarInputId: string
  avatarInputRef: React.RefObject<HTMLInputElement | null>
  openSharedSheet: (tab: SharedContentTab) => void
  openImageViewerForFile: (file: MediaFile) => void
  handleFileAction: (e: MouseEvent, url: string | undefined, fileName: string | undefined) => Promise<void>
  viewerForwardMsgId: string | null
  viewerDeleteMsgId: string | null
  handleViewerForward: (messageId: string) => void
  handleViewerDelete: (messageId: string) => void
  confirmViewerDelete: () => Promise<void>
  handleViewerForwardToChat: (targetChatIds: string[]) => Promise<void>
  forwardIsPending: boolean
  setViewerForwardMsgId: (id: string | null) => void
  setViewerDeleteMsgId: (id: string | null) => void
  startNameEdit: () => void
  cancelNameEdit: () => void
  saveName: () => Promise<boolean>
  startBioEdit: () => void
  cancelBioEdit: () => void
  saveBio: () => Promise<boolean>
  handleCancelSelfProfile: () => void
  handleAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  setViewerOpen: (v: boolean) => void
  setSharedSheetOpen: (v: boolean) => void
  isLoading: boolean
  viewSelfProfile: boolean
}

/**
 * Composes the profile panel's data fetching and derived fields with the two
 * focused sub-hooks (editing + media viewer), returning a single flat shape so
 * ProfilePanel.tsx stays a thin consumer. See features/profile/hooks for the parts.
 */
export const useProfilePanel = (
  variant: 'column' | 'sheet' = 'column',
  forceSelf = false,
): UseProfilePanelReturn => {
  const { chatId } = useParams();
  const socket = useSocket();
  const isSheet = variant === 'sheet';
  const avatarInputId = useId();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const user = useAuthStore((s) => s.user);
  const viewSelfProfile = useProfileUiStore((s) => s.viewSelfProfile);
  const closeSelfProfile = useProfileUiStore((s) => s.closeSelfProfile);
  const showSelfProfile = forceSelf || viewSelfProfile || !chatId;

  const [sharedSheetOpen, setSharedSheetOpen] = useState(false);
  const [sharedSheetTab, setSharedSheetTab] = useState<SharedContentTab>('photos');
  const { downloadFile } = useFileDownload();

  const openSharedSheet = useCallback((tab: SharedContentTab) => {
    setSharedSheetTab(tab);
    setSharedSheetOpen(true);
  }, []);

  const { data: profileDetails, isLoading, error, isError } = useChatDetailsQuery(
    { id: chatId, populate: true },
    { skip: !chatId || showSelfProfile },
  );
  const { data: media, isLoading: isMediaLoading, error: mediaError, isError: isMediaError, refetch } = useGetMediaQuery(
    { chatId },
    { skip: !chatId || showSelfProfile },
  );

  useErrors([{ error, isError }, { error: mediaError, isError: isMediaError }]);

  const newAttachmentListener = useCallback((...args: unknown[]) => {
    const res = args[0] as { chatId?: string } | undefined;
    // Only refetch if the attachment belongs to the currently open chat
    if (res?.chatId && res.chatId === chatId) refetch();
  }, [refetch, chatId]);
  useSocketEvent(socket, { [SOCKET_EVENTS.NEW_ATTACHMENT]: newAttachmentListener });

  // Derive the displayed profile fields from either the live user or chat details.
  const typedProfile = profileDetails as ProfileDetailsResponse | undefined;
  const profileData = showSelfProfile ? user : typedProfile?.data;
  const name = profileData && 'name' in profileData ? profileData.name : undefined;
  const bio = profileData && 'bio' in profileData ? profileData.bio : undefined;
  const groupChat = showSelfProfile ? false : (profileData && 'groupChat' in profileData ? profileData.groupChat : undefined);
  const creator = showSelfProfile ? undefined : (profileData && 'creator' in profileData ? profileData.creator : undefined);
  const members = showSelfProfile ? undefined : (profileData && 'members' in profileData ? profileData.members as ProfileMember[] | undefined : undefined);
  const rawAvatar = profileData && 'avatar' in profileData ? profileData.avatar : undefined;

  const userId = user?._id ? String(user._id) : '';
  const isOwnProfile = showSelfProfile;
  const isGroupCreator = Boolean(groupChat) && (
    (members ?? []).some((m) => m.isCreator && String(m._id) === userId) ||
    (creator?._id != null && String(creator._id) === userId)
  );
  const isGroupAdmin = Boolean(groupChat) && (members ?? []).some((m) => m.isAdmin && String(m._id) === userId);
  const canEdit = isOwnProfile || isGroupCreator || isGroupAdmin;

  const { attachments: mediaData, links: sharedLinks } = useMemo(
    () => normalizeSharedContent((media as MediaResponse | undefined)?.data),
    [media],
  );
  const mediaFiles = useMemo(() => mediaData.filter((f) => f.fileType !== 'document'), [mediaData]);
  const docFiles   = useMemo(() => mediaData.filter((f) => f.fileType === 'document'),  [mediaData]);

  const viewer = useProfileMediaViewer({ chatId, mediaFiles });

  const editing = useProfileEditing({
    isOwnProfile, canEdit, chatId, name, bio, groupChat,
    user, showSelfProfile,
    showSelfExitActions: viewSelfProfile && Boolean(chatId),
    closeSelfProfile,
  });

  const showSelfExitActions = viewSelfProfile && Boolean(chatId);

  const handleFileAction = useCallback(async (e: MouseEvent, url: string | undefined, fileName: string | undefined) => {
    e.preventDefault();
    if (!url) return;
    if (fileFormat(url) === 'pdf') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      await downloadFile(url, fileName);
    }
  }, [downloadFile]);

  const avatarSrc = editing.avatarPreview ?? resolveAvatarSrc(rawAvatar);

  return {
    showSelfProfile, isOwnProfile, canEdit, isSaving: editing.isSaving, groupChat, name, bio, avatarSrc, creator, members, chatId,
    mediaFiles, docFiles, sharedLinks, isMediaLoading, viewerMediaFiles: viewer.viewerMediaFiles,
    editingName: editing.editingName, editingBio: editing.editingBio,
    nameDraft: editing.nameDraft, bioDraft: editing.bioDraft,
    setNameDraft: editing.setNameDraft, setBioDraft: editing.setBioDraft,
    nameMaxLength: groupChat ? 60 : 50, bioMaxLength: 70,
    sharedSheetOpen, sharedSheetTab,
    viewerOpen: viewer.viewerOpen, initialImageIndex: viewer.initialImageIndex,
    showSelfExitActions, isSheet, avatarInputId, avatarInputRef,
    openSharedSheet, openImageViewerForFile: viewer.openImageViewerForFile, handleFileAction,
    startNameEdit: editing.startNameEdit, cancelNameEdit: editing.cancelNameEdit, saveName: editing.saveName,
    startBioEdit: editing.startBioEdit, cancelBioEdit: editing.cancelBioEdit, saveBio: editing.saveBio,
    handleCancelSelfProfile: editing.handleCancelSelfProfile, handleAvatarChange: editing.handleAvatarChange,
    setViewerOpen: viewer.setViewerOpen, setSharedSheetOpen, isLoading, viewSelfProfile,
    viewerForwardMsgId: viewer.viewerForwardMsgId, viewerDeleteMsgId: viewer.viewerDeleteMsgId,
    handleViewerForward: viewer.handleViewerForward, handleViewerDelete: viewer.handleViewerDelete,
    confirmViewerDelete: viewer.confirmViewerDelete, handleViewerForwardToChat: viewer.handleViewerForwardToChat,
    forwardIsPending: viewer.forwardIsPending,
    setViewerForwardMsgId: viewer.setViewerForwardMsgId, setViewerDeleteMsgId: viewer.setViewerDeleteMsgId,
  };
};
