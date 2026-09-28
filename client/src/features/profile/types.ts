import type {
  MediaFile,
  SharedLink,
} from '@/features/profile/components/shared-content/types';

/**
 * Profile-detail shapes. These are a deliberately narrower view than chat's
 * ChatDetailsData/ChatMember (members are always objects here, and avatar may
 * also arrive as a `{ url }` object), so they are modeled separately rather than
 * reusing the chat types — they can diverge for different reasons.
 */
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

export type ProfileDetailsResponse = { data?: ProfileDetailsData };

export type MediaResponse = {
  data?: MediaFile[] | { attachments?: MediaFile[]; links?: SharedLink[] };
};

export type ViewerMediaFile = {
  _id: string;
  url: string;
  name?: string;
  publicId?: string;
  fileType?: string;
  messageId?: string;
  senderId?: string;
};
