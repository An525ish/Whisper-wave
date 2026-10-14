import type { RoomHours } from '../types';

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** `"22:30"` → `"10:30pm"`, `"22:00"` → `"10pm"`. */
export const formatHour = (hhmm: string): string => {
  const [h, m] = hhmm.split(':').map(Number);
  const h24 = (h || 0) % 24;
  const suffix = h24 < 12 ? 'am' : 'pm';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return (m || 0) === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
};

const minutesOf = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

type ZonedNow = { weekday: number; minutes: number; zoneName: string };

/** Weekday, minutes-of-day and short zone name of `nowMs` in `tz`. */
const zonedNow = (nowMs: number, tz: string): ZonedNow => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).formatToParts(new Date(nowMs));
  const pick = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  return {
    weekday: Math.max(0, WEEKDAY_NAMES.indexOf(pick('weekday') as (typeof WEEKDAY_NAMES)[number])),
    minutes: Number(pick('hour')) * 60 + Number(pick('minute')),
    zoneName: pick('timeZoneName') || tz,
  };
};

/** The zone, spelled so a guest elsewhere can read it (`IST`/`GMT+5:30`). */
const zoneLabel = (hours: RoomHours, nowMs: number): string => {
  try {
    return zonedNow(nowMs, hours.tz).zoneName;
  } catch {
    return hours.tz.split('/').pop() ?? hours.tz;
  }
};

/** "Always open", "Nightly 10pm–2am GMT+5:30" or "10pm–2am Mon, Wed GMT+5:30". */
export const hoursSummary = (hours: RoomHours | null, nowMs: number): string => {
  if (!hours) return 'Always open';
  const span = `${formatHour(hours.start)}–${formatHour(hours.end)}`;
  const zone = zoneLabel(hours, nowMs);
  if (hours.days.length === 7) return `Nightly ${span} ${zone}`;
  const days = [...hours.days].sort((a, b) => a - b).map((d) => WEEKDAY_NAMES[d]).join(', ');
  return `${span} ${days} ${zone}`;
};

/**
 * When a closed room next opens, as day + time + zone: "Opens today at 10pm
 * GMT+5:30", "Opens tomorrow at …", "Opens Fri at …". Falls back to the plain
 * start time when the zone or days can't be resolved.
 */
export const nextOpensLabel = (hours: RoomHours | null, nowMs: number): string => {
  if (!hours) return 'Opens later';
  const time = formatHour(hours.start);
  try {
    const now = zonedNow(nowMs, hours.tz);
    for (let offset = 0; offset <= 7; offset += 1) {
      const weekday = (now.weekday + offset) % 7;
      if (!hours.days.includes(weekday)) continue;
      if (offset === 0 && minutesOf(hours.start) <= now.minutes) continue;
      const day = offset === 0 ? 'today' : offset === 1 ? 'tomorrow' : WEEKDAY_NAMES[weekday];
      return `Opens ${day} at ${time} ${now.zoneName}`;
    }
    return `Opens at ${time} ${now.zoneName}`;
  } catch {
    return `Opens at ${time}`;
  }
};

