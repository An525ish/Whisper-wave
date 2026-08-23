import * as messageRepo from '../../repositories/message.js';
import { AppError } from '../../utils/AppError.js';
import { assertChatMember } from './shared.js';

export const searchMessages = async (
  userId: string,
  chatId: string,
  query: string,
  options?: {
    scope?: 'all' | 'text' | 'media' | 'links';
    from?: 'anyone' | 'me' | 'others';
    senderId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }
): Promise<{
  data: Array<{
    _id: string;
    content?: string;
    attachments?: Array<{ name?: string; fileType?: string; url?: string }>;
    createdAt: string;
    sender: { _id: string; name: string; avatar: string };
  }>;
  total: number;
}> => {
  const isMember = await assertChatMember(userId, chatId);
  if (!isMember) {
    throw new AppError(401, 'You are not authenticated to access the resource');
  }

  const trimmed = query.trim();
  const dateFrom = options?.dateFrom ? new Date(options.dateFrom) : undefined;
  const dateTo = options?.dateTo ? new Date(options.dateTo) : undefined;
  const validDateFrom =
    dateFrom && !Number.isNaN(dateFrom.getTime()) ? dateFrom : undefined;
  const validDateTo =
    dateTo && !Number.isNaN(dateTo.getTime()) ? dateTo : undefined;

  type PopulatedSender = {
    _id: unknown;
    name?: string;
    avatar?: string | { url?: string };
  };

  const mapRow = (message: {
    _id: { toString(): string };
    content?: string;
    attachments?: Array<{ name?: string; fileType?: string; url?: string }>;
    createdAt: Date;
    sender: unknown;
  }) => {
    const sender = message.sender as PopulatedSender;
    const avatar =
      typeof sender.avatar === 'string'
        ? sender.avatar
        : sender.avatar?.url || '';

    return {
      _id: String(message._id),
      content: message.content,
      attachments: (message.attachments ?? []).map((att) => ({
        name: att.name,
        fileType: att.fileType,
        url: att.url,
      })),
      createdAt: new Date(message.createdAt).toISOString(),
      sender: {
        _id: String(sender._id),
        name: sender.name || 'Unknown',
        avatar,
      },
    };
  };

  const rows = await messageRepo.searchInChat({
    chatId,
    query: trimmed,
    scope: options?.scope,
    senderId:
      options?.senderId ||
      (options?.from === 'me' ? userId : undefined),
    excludeSenderId: options?.from === 'others' ? userId : undefined,
    dateFrom: validDateFrom,
    dateTo: validDateTo,
    limit: options?.limit,
  });

  const data = rows.map(mapRow);
  return { data, total: data.length };
};

/** Resolve the first message on a calendar day — no list fetch, no fall-through. */
export const jumpToDate = async (
  userId: string,
  chatId: string,
  dateFromIso: string,
  dateToIso?: string
): Promise<{
  _id: string;
  createdAt: string;
  exactDay: boolean;
} | null> => {
  const isMember = await assertChatMember(userId, chatId);
  if (!isMember) {
    throw new AppError(401, 'You are not authenticated to access the resource');
  }

  const dayStart = new Date(dateFromIso);
  if (Number.isNaN(dayStart.getTime())) {
    throw new AppError(400, 'Invalid date');
  }

  const dayEnd = dateToIso
    ? new Date(dateToIso)
    : new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  if (Number.isNaN(dayEnd.getTime())) {
    throw new AppError(400, 'Invalid date');
  }

  const target = await messageRepo.findJumpTargetForDay(
    chatId,
    dayStart,
    dayEnd
  );
  if (!target) return null;

  return {
    _id: String(target._id),
    createdAt: new Date(target.createdAt).toISOString(),
    exactDay: target.exactDay,
  };
};

/** Calendar days in range that have at least one message (local YYYY-MM-DD),
 *  plus `minYear` derived from the oldest message (O(1) index seek). */
export const listActiveDates = async (
  userId: string,
  chatId: string,
  dateFromIso: string,
  dateToIso: string,
  timeZone: string
): Promise<{ dates: string[]; minYear: number | null }> => {
  const isMember = await assertChatMember(userId, chatId);
  if (!isMember) {
    throw new AppError(401, 'You are not authenticated to access the resource');
  }

  const from = new Date(dateFromIso);
  const to = new Date(dateToIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new AppError(400, 'Invalid date range');
  }

  const [dates, oldest] = await Promise.all([
    messageRepo.listActiveDatesInRange(chatId, from, to, timeZone || 'UTC'),
    messageRepo.findOldestMessage(chatId),
  ]);

  const minYear = oldest
    ? new Date(oldest.createdAt).getFullYear()
    : null;

  return { dates, minYear };
};
