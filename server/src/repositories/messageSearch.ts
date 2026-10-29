import { Types } from 'mongoose';
import { Message } from '../models/message.js';
import { escapeRegex } from '../utils/normalize.js';
import type { MessageRecord } from '../types/message.js';

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
    isDeleted: { $ne: true },
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
    isDeleted: { $ne: true },
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
    isDeleted: { $ne: true },
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
        isDeleted: { $ne: true },
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
    isDeleted: { $ne: true },
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
