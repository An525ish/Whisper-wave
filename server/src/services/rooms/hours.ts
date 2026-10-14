import type { RoomHours } from '../../types/room.js';

const DAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Whether a room's hours admit `now`.
 *
 * No hours means always open. Overnight ranges (end earlier than start) belong
 * to the day they start in — a 1am visit checks the previous day. Pure and
 * timezone-explicit: days and clock are read in the template's `tz`, never the
 * server's, so a deploy in another region keeps IST room hours.
 */
export const isRoomOpen = (hours: RoomHours | null | undefined, now: Date = new Date()): boolean => {
  if (!hours) return true;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: hours.tz,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  const day = DAY_INDEX[get('weekday')] ?? 0;
  const mins = Number(get('hour')) * 60 + Number(get('minute'));

  const start = toMinutes(hours.start);
  const end = toMinutes(hours.end);

  if (end <= start) {
    // Overnight: evening belongs to today, small hours to yesterday's session.
    if (mins >= start) return hours.days.includes(day);
    if (mins < end) return hours.days.includes((day + 6) % 7);
    return false;
  }
  return mins >= start && mins < end && hours.days.includes(day);
};
