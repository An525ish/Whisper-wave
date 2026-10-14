import dayjs from 'dayjs';
import { ROOM_GROUP_WINDOW_MS, ROOM_PREVIEW_MAX } from '../constants';
import type { RoomMessage } from '../types';

/** Same author as the message above, within the grouping window — no repeated head. */
export const isJoinedAbove = (prev: RoomMessage | undefined, message: RoomMessage): boolean =>
  !message.system &&
  prev !== undefined &&
  !prev.system &&
  prev.from.alias === message.from.alias &&
  message.ts - prev.ts < ROOM_GROUP_WINDOW_MS;

export const previewText = (text: string): string =>
  text.length > ROOM_PREVIEW_MAX ? `${text.slice(0, ROOM_PREVIEW_MAX)}…` : text;

/** Quote shown above a reply; null when the target is gone or a bot line. */
export const quoteOf = (
  messages: RoomMessage[],
  id: string | undefined
): { alias: string; preview: string } | null => {
  if (!id) return null;
  const target = messages.find((m) => m.id === id);
  if (!target || target.system) return null;
  return { alias: target.from.alias, preview: previewText(target.text) };
};

export const timeLabel = (ts: number): string => dayjs(ts).format('hh:mm A');
