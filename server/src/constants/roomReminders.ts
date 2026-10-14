/** One-shot "remind me when it opens" subscriptions expire if the room never opens. */
export const ROOM_REMINDER_TTL_SECONDS = 8 * 24 * 60 * 60;
export const MAX_ROOM_REMINDERS_PER_USER = 20;
/** How often pending reminders are checked against room hours. */
export const ROOM_REMINDER_TICK_MS = 60_000;

export const roomOpenTag = (slug: string): string => `room-${slug}`;
export const roomOpenUrl = (slug: string): string => `/rooms/${slug}`;
export const roomOpenBody = (title: string): string => `${title} is open now`;

export const modNeededTag = (slug: string): string => `room-mod-${slug}`;
export const modNeededTitle = (title: string): string => `${title} needs a moderator`;
export const modNeededBody = (waiting: number): string => `${waiting} waiting`;
