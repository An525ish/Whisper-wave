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

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export type SearchMessagesFilter = {
  chatId: string;
  query?: string;
  scope?: 'all' | 'text' | 'media' | 'links';
  senderId?: string;
  excludeSenderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
};

export const searchInChat = async (
  input: SearchMessagesFilter
): Promise<MessageRecord[]> => {
  const query = (input.query ?? '').trim();
  const hasQuery = query.length >= 1;
  const hasDate = Boolean(input.dateFrom || input.dateTo);
  if (!hasQuery && !hasDate && input.scope !== 'media' && input.scope !== 'links') {
    return [];
  }

  const limit = Math.min(Math.max(input.limit ?? 40, 1), 80);
  const filter: Record<string, unknown> = {
    chat: input.chatId,
    status: { $ne: 'failed' },
  };

  if (input.senderId) {
    filter.sender = input.senderId;
  } else if (input.excludeSenderId) {
    filter.sender = { $ne: input.excludeSenderId };
  }

  if (input.dateFrom || input.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (input.dateFrom) createdAt.$gte = input.dateFrom;
    if (input.dateTo) createdAt.$lte = input.dateTo;
    filter.createdAt = createdAt;
  }

  const scope = input.scope ?? 'all';
  if (hasQuery) {
    const escaped = escapeRegex(query);
    const textMatch = { content: { $regex: escaped, $options: 'i' } };
    const attachmentMatch = {
      'attachments.name': { $regex: escaped, $options: 'i' },
    };

    if (scope === 'text') {
      filter.content = { $regex: escaped, $options: 'i' };
    } else if (scope === 'media') {
      Object.assign(filter, {
        attachments: { $exists: true, $not: { $size: 0 } },
        $or: [textMatch, attachmentMatch],
      });
    } else if (scope === 'links') {
      Object.assign(filter, {
        $and: [
          { content: { $regex: 'https?:\\/\\/', $options: 'i' } },
          { content: { $regex: escaped, $options: 'i' } },
        ],
      });
    } else {
      filter.$or = [textMatch, attachmentMatch];
    }
  } else if (scope === 'media') {
    filter.attachments = { $exists: true, $not: { $size: 0 } };
  } else if (scope === 'links') {
    filter.content = { $regex: 'https?:\\/\\/', $options: 'i' };
  }

  return Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name avatar')
    .lean<MessageRecord[]>();
};

/** First message on/after date — lean `_id`/`createdAt` only (jump-to-date). */
export const findFirstOnOrAfter = async (
  chatId: string,
  dateFrom: Date
): Promise<{ _id: { toString(): string }; createdAt: Date } | null> =>
  Message.findOne({
    chat: chatId,
    status: { $ne: 'failed' },
    createdAt: { $gte: dateFrom },
  })
    .sort({ createdAt: 1 })
    .select('_id createdAt')
    .lean();

/** First message within a calendar day only. */
export const findFirstInDay = async (
  chatId: string,
  dayStart: Date,
  dayEnd: Date
): Promise<{ _id: { toString(): string }; createdAt: Date } | null> =>
  Message.findOne({
    chat: chatId,
    status: { $ne: 'failed' },
    createdAt: { $gte: dayStart, $lte: dayEnd },
  })
    .sort({ createdAt: 1 })
    .select('_id createdAt')
    .lean();

/** Distinct local calendar days (YYYY-MM-DD) that have messages in range. */
export const listActiveDatesInRange = async (
  chatId: string,
  from: Date,
  to: Date,
  timeZone: string
): Promise<string[]> => {
  if (!Types.ObjectId.isValid(chatId)) return [];

  const rows = await Message.aggregate<{ date: string }>([
    {
      $match: {
        chat: new Types.ObjectId(chatId),
        status: { $ne: 'failed' },
        createdAt: { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
            timezone: timeZone || 'UTC',
          },
        },
      },
    },
    { $project: { _id: 0, date: '$_id' } },
  ]);

  return rows.map((row) => row.date).filter(Boolean);
};

/** Oldest message in a chat — O(1) index seek on { chat, createdAt: 1 }. */
export const findOldestMessage = async (
  chatId: string
): Promise<{ createdAt: Date } | null> =>
  Message.findOne({
    chat: chatId,
    status: { $ne: 'failed' },
  })
    .sort({ createdAt: 1 })
    .select('createdAt')
    .lean();

/** First message on/after day start; `exactDay` if it falls within the day. */
export const findJumpTargetForDay = async (
  chatId: string,
  dayStart: Date,
  dayEnd: Date
): Promise<{
  _id: { toString(): string };
  createdAt: Date;
  exactDay: boolean;
} | null> => {
  const inDay = await findFirstInDay(chatId, dayStart, dayEnd);
  if (!inDay) return null;
  return { ...inDay, exactDay: true };
};
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
