/** Room open-hours labels ("10pm", "Kolkata"). Pure. */

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
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
