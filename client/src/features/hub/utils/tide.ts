/**
 * Tide-chart math: room open-windows on a 24 h strip, all in minutes.
 * Pure — the strip, the NOW marker and the labels all derive from here.
 */

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Open window as strip segments (overnight ranges split in two). */
export const windowSegments = (
  start: string,
  end: string
): Array<{ from: number; to: number }> => {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (e <= s) return [{ from: s, to: 1440 }, { from: 0, to: e }];
  return [{ from: s, to: e }];
};

/** Current minutes in a timezone (hourCycle h23 — midnight is 0, never 24). */
export const nowMinutesIn = (tz: string, at: number = Date.now()): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const get = (type: string): number =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get('hour') * 60 + get('minute');
};

/** "22:00" → "10pm", "03:00" → "3am", "00:30" → "12:30am". */
export const formatHour = (hhmm: string): string => {
  const mins = toMinutes(hhmm);
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const suffix = h24 < 12 ? 'am' : 'pm';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
};

/** "Asia/Kolkata" → "Kolkata". */
export const tzShort = (tz: string): string => tz.split('/').pop() ?? tz;
