import { ROOM_REMINDER_TICK_MS } from '../../constants/roomReminders.js';
import * as roomRepo from '../../repositories/room.js';
import * as reminderRepo from '../../repositories/roomReminder.js';
import type { ReminderDispatchDeps } from '../../types/roomReminder.js';
import { logger } from '../../utils/logger.js';
import { sendPushIntents } from '../push/index.js';
import { isRoomOpen } from './hours.js';

/**
 * One pass: every slug with pending reminders whose room is open NOW gets its
 * subscribers notified, and those reminders are consumed (taken before the
 * push is sent, so a slow send can never double-fire). Reminders can only be
 * created while a room is closed, so "pending + open" means it just opened.
 * Rooms deleted since subscribing drop their reminders silently; unreadable
 * hours are logged and skipped (the TTL cleans up). Returns slugs dispatched.
 */
export const runReminderTick = async (
  deps: ReminderDispatchDeps,
  now: Date = new Date()
): Promise<string[]> => {
  const dispatched: string[] = [];
  for (const slug of await deps.distinctSlugs()) {
    try {
      const room = await deps.findRoom(slug);
      if (!room) {
        await deps.takeUserIds(slug);
        continue;
      }
      if (!room.hours || !deps.isOpen(room.hours, now)) continue;
      const userIds = await deps.takeUserIds(slug);
      if (userIds.length === 0) continue;
      deps.notify(slug, room.title, userIds);
      dispatched.push(slug);
    } catch (err) {
      logger.warn({ err, slug }, 'Room reminder skipped — hours unreadable or read failed');
    }
  }
  return dispatched;
};

const liveDeps: ReminderDispatchDeps = {
  distinctSlugs: reminderRepo.distinctSlugs,
  findRoom: roomRepo.findBySlug,
  takeUserIds: reminderRepo.takeBySlug,
  isOpen: isRoomOpen,
  // Lobby polls (not live), so presence is not a signal: every subscriber is pushed.
  notify: (slug, title, userIds) =>
    sendPushIntents(
      [{ event: 'room-open', members: userIds, push: { kind: 'room-open', slug, title } }],
      () => false
    ),
};

let timer: NodeJS.Timeout | null = null;
let running = false;

/** Single unref'd interval; no Redis. Safe to call twice. */
export const startReminderDispatcher = (): void => {
  if (timer) return;
  timer = setInterval(() => {
    if (running) return;
    running = true;
    runReminderTick(liveDeps)
      .catch((err: unknown) => logger.warn({ err }, 'Room reminder tick failed'))
      .finally(() => {
        running = false;
      });
  }, ROOM_REMINDER_TICK_MS);
  timer.unref();
};

export const stopReminderDispatcher = (): void => {
  if (timer) clearInterval(timer);
  timer = null;
};
