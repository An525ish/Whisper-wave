import { Types } from 'mongoose';
import type {
  ChatAvatar,
  ChatLastMessage,
  ChatListLastMessage,
  ChatSharedLink,
  PopulatedMember,
} from '../../types/chat.js';
import type { UploadableFile } from '../../types/message.js';
import { uploadAvatarFromFile } from '../../utils/avatar.js';

export const URL_IN_TEXT =
  /https?:\/\/[^\s<>"'`{}|\\^[\]]+/gi;

export const senderIdOf = (sender: unknown): string => {
  if (!sender) return '';
  if (typeof sender === 'string') return sender;
  if (typeof sender === 'object' && sender !== null && '_id' in sender) {
    return String((sender as { _id: unknown })._id);
  }
  return String(sender);
};

export const senderNameOf = (sender: unknown): string | undefined => {
  if (sender && typeof sender === 'object' && 'name' in sender) {
    const name = (sender as { name?: unknown }).name;
    return typeof name === 'string' ? name : undefined;
  }
  return undefined;
};

export const toListLastMessage = (
  lastMessage: ChatLastMessage | undefined,
  userId: string,
  readBy: string[],
  opts?: { groupChat?: boolean; memberIds?: string[] }
): ChatListLastMessage | null => {
  if (!lastMessage) return null;

  const senderId = senderIdOf(lastMessage.sender);
  const isOwn = senderId === userId;

  let isRead = false;
  if (isOwn && senderId) {
    if (opts?.groupChat && opts.memberIds) {
      const others = opts.memberIds.filter((id) => id !== senderId);
      isRead =
        others.length > 0 && others.every((id) => readBy.includes(id));
    } else {
      isRead = readBy.some((id) => id !== userId);
    }
  }

  return {
    _id: lastMessage._id ? String(lastMessage._id) : undefined,
    content: lastMessage.content,
    createdAt: lastMessage.createdAt?.toISOString(),
    type: lastMessage.type,
    sender: senderId
      ? { _id: senderId, name: senderNameOf(lastMessage.sender) }
      : undefined,
    isRead,
  };
};

export const extractUniqueLinks = (
  messages: Array<{ _id: Types.ObjectId; content?: string; createdAt: Date }>
): ChatSharedLink[] => {
  const seen = new Set<string>();
  const links: ChatSharedLink[] = [];

  for (const message of messages) {
    if (!message.content) continue;
    const matches = message.content.match(URL_IN_TEXT);
    if (!matches) continue;

    for (const raw of matches) {
      const url = raw.replace(/[),.;!?]+$/g, '');
      if (seen.has(url)) continue;
      seen.add(url);

      let host = url;
      try {
        host = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        /* keep raw */
      }

      links.push({
        url,
        host,
        messageId: message._id.toString(),
        createdAt: message.createdAt,
      });
    }
  }

  return links;
};

export const resolveGroupAvatarUrls = (
  groupAvatar: ChatAvatar | undefined,
  members: PopulatedMember[]
): Array<string | undefined> => {
  if (groupAvatar?.url) return [groupAvatar.url];
  return members
    .slice(0, 3)
    .map((member) => member.avatar?.url)
    .filter(Boolean);
};

export const uploadAvatarOrThrow = async (
  avatarFile: UploadableFile
): Promise<ChatAvatar> => uploadAvatarFromFile(avatarFile);
