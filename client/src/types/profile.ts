import type { ChangeEvent, MouseEvent, RefObject } from 'react';
import type { MediaFile, SharedLink, SharedContentTab } from '@/components/profile/shared-content/types';

export type ProfileMember = {
  _id?: string;
  name?: string;
  avatar?: string;
  isCreator?: boolean;
  isAdmin?: boolean;
};

export type ProfileDetailsData = {
  name?: string;
  avatar?: string | string[] | { url?: string };
  bio?: string;
  creator?: { _id?: string; name?: string; avatar?: string };
  members?: ProfileMember[];
  groupChat?: boolean;
};

export type ChatDetailsResponse = { data?: ProfileDetailsData };

export type MediaResponse = {
  data?: MediaFile[] | { attachments?: MediaFile[]; links?: SharedLink[] };
};

export type ViewerMediaFile = {
  _id: string;
  url: string;
  name?: string;
  publicId?: string;
  fileType?: string;
};

export type UseProfilePanelReturn = {
  showSelfProfile: boolean;
  isOwnProfile: boolean;
  canEdit: boolean;
  isSaving: boolean;
  groupChat: boolean | undefined;
  name: string | undefined;
  bio: string | undefined;
  avatarSrc: string | undefined;
  creator: ProfileDetailsData['creator'] | undefined;
  members: ProfileMember[] | undefined;
  chatId: string | undefined;
  mediaFiles: MediaFile[];
  docFiles: MediaFile[];
  sharedLinks: SharedLink[];
  isMediaLoading: boolean;
  viewerMediaFiles: ViewerMediaFile[];
  editingName: boolean;
  editingBio: boolean;
  nameDraft: string;
  bioDraft: string;
  setNameDraft: (v: string) => void;
  setBioDraft: (v: string) => void;
  nameMaxLength: number;
  bioMaxLength: number;
  sharedSheetOpen: boolean;
  sharedSheetTab: SharedContentTab;
  viewerOpen: boolean;
  initialImageIndex: number;
  showSelfExitActions: boolean;
  isSheet: boolean;
  avatarInputId: string;
  avatarInputRef: RefObject<HTMLInputElement | null>;
  openSharedSheet: (tab: SharedContentTab) => void;
  openImageViewerForFile: (file: MediaFile) => void;
  handleFileAction: (e: MouseEvent, url: string | undefined, fileName: string | undefined) => Promise<void>;
  startNameEdit: () => void;
  cancelNameEdit: () => void;
  saveName: () => Promise<boolean>;
  startBioEdit: () => void;
  cancelBioEdit: () => void;
  saveBio: () => Promise<boolean>;
  handleCancelSelfProfile: () => void;
  handleAvatarChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  setViewerOpen: (v: boolean) => void;
  setSharedSheetOpen: (v: boolean) => void;
  isLoading: boolean;
  viewSelfProfile: boolean;
};
