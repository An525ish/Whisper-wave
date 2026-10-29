import { MAX_ROOM_REMINDERS_PER_USER } from '../../constants/roomReminders.js';
import * as roomRepo from '../../repositories/room.js';
import * as reminderRepo from '../../repositories/roomReminder.js';
import { AppError } from '../../utils/AppError.js';
import { getPublicConfig } from '../push/index.js';
import { isRoomOpen } from './hours.js';

/**
 * Subscribe to "it opened" for a closed, lobby-visible room with hours. Needs
 * push on the server (otherwise nothing could ever be delivered).
 */
export const addReminder = async (userId: string, slug: string, now: Date = new Date()): Promise<void> => {
  if (!getPublicConfig().enabled) throw new AppError(409, 'Push notifications are not enabled');
  const room = await roomRepo.findBySlug(slug);
  if (!room || (room.visibility !== 'official' && room.visibility !== 'public')) {
    throw new AppError(404, 'Room not found');
  }
  if (!room.hours) throw new AppError(400, 'This room is always open');
  let open: boolean;
  try {
    open = isRoomOpen(room.hours, now);
  } catch {
    throw new AppError(400, 'This room’s hours are unavailable');
  }
  if (open) throw new AppError(400, 'This room is already open');

  const existing = await reminderRepo.listSlugsForUser(userId);
  if (existing.includes(room.slug)) return;
  if (existing.length >= MAX_ROOM_REMINDERS_PER_USER) {
    throw new AppError(400, `You can have up to ${MAX_ROOM_REMINDERS_PER_USER} room reminders`);
  }
  await reminderRepo.create(userId, room.slug);
};

export const removeReminder = (userId: string, slug: string): Promise<void> =>
  reminderRepo.remove(userId, slug.toLowerCase());

export const listReminderSlugs = (userId: string): Promise<string[]> =>
  reminderRepo.listSlugsForUser(userId);
