import { Types } from 'mongoose';
import { Message } from '../models/message.js';
import type {
  CreateMessageInput,
  MessageRecord,
  UpdateMessagePatch,
} from '../types/message.js';
import type { DayCount } from '../types/user.js';

export const findByChatPage = async (
  chatId: string,
  skip: number,
  limit: number
) =>
  Message.find({ chat: chatId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean()
    .populate('sender', 'name avatar')
    .populate('chat', 'groupChat');

export const countByChat = async (chatId: string): Promise<number> =>
  Message.countDocuments({ chat: chatId });

export const create = async (
  input: CreateMessageInput
): Promise<MessageRecord> => {
  const message = await Message.create({
    content: input.content,
    attachments: input.attachments ?? [],
    sender: input.sender,
    chat: input.chat,
    status: input.status ?? 'sent',
  });

  return message.toObject() as MessageRecord;
};

export const updateById = async (
  id: string | Types.ObjectId,
  patch: UpdateMessagePatch
): Promise<MessageRecord | null> =>
  Message.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean<MessageRecord>();

export const deleteById = async (
  id: string | Types.ObjectId
): Promise<boolean> => {
  const result = await Message.findByIdAndDelete(id);
  return Boolean(result);
};

export const deleteByChatId = async (chatId: string): Promise<void> => {
  await Message.deleteMany({ chat: chatId });
};

export const findAttachmentsByChat = async (chatId: string) =>
  Message.find({
    chat: chatId,
    attachments: { $exists: true, $not: { $size: 0 } },
  })
    .sort({ updatedAt: -1 })
    .lean<MessageRecord[]>();

/** Text messages that likely contain URLs (for shared-links panel). */
export const findTextContentsByChat = async (chatId: string) =>
  Message.find({
    chat: chatId,
    content: { $regex: /https?:\/\//i },
  })
    .select('_id content createdAt')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean<Array<{ _id: Types.ObjectId; content?: string; createdAt: Date }>>();

export const countAll = async (): Promise<number> => Message.countDocuments();

/** Unread = messages from others after lastReadAt; missing cursor counts all from others. */
export const countUnreadByChats = async (
  userId: string,
  chatIds: Array<string | Types.ObjectId>,
  lastReadByChat: Map<string, Date>
): Promise<Map<string, number>> => {
  const counts = new Map<string, number>();
  if (chatIds.length === 0) return counts;

  const userOid = new Types.ObjectId(userId);
  const chatOids = chatIds.map((id) =>
    typeof id === 'string' ? new Types.ObjectId(id) : id
  );

  await Promise.all(
    chatOids.map(async (chatOid) => {
      const chatKey = chatOid.toString();
      const lastReadAt = lastReadByChat.get(chatKey);
      const filter: Record<string, unknown> = {
        chat: chatOid,
        sender: { $ne: userOid },
      };
      if (lastReadAt) {
        filter.createdAt = { $gt: lastReadAt };
      }

      const count = await Message.countDocuments(filter);
      counts.set(chatKey, count);
    })
  );

  return counts;
};

export const findLatestInChat = async (
  chatId: string
): Promise<MessageRecord | null> =>
  Message.findOne({ chat: chatId })
    .sort({ createdAt: -1 })
    .lean<MessageRecord>();

/** Mark others' messages as read up to lastReadAt. */
export const markReadByUser = async (
  chatId: string,
  userId: string,
  lastReadAt: Date
): Promise<void> => {
  await Message.updateMany(
    {
      chat: chatId,
      sender: { $ne: userId },
      createdAt: { $lte: lastReadAt },
      readBy: { $ne: userId },
    },
    { $addToSet: { readBy: userId } }
  );
};

export const listForAdmin = async () =>
  Message.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('sender', 'name username avatar')
    .populate('chat', 'name groupChat')
    .lean();

export const countCreatedByDay = async (
  start: Date,
  end: Date
): Promise<DayCount[]> =>
  Message.aggregate<DayCount>([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
