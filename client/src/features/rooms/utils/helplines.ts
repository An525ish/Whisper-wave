import type { RoomHelpline } from '../types';

const IN: RoomHelpline[] = [
  { name: 'Tele-MANAS (India, 24x7)', contact: '14416', href: 'tel:14416' },
  { name: 'iCall', contact: '9152987821', href: 'tel:+919152987821' },
];
const US_CA: RoomHelpline[] = [{ name: 'Suicide & Crisis Lifeline (US, Canada)', contact: '988', href: 'tel:988' }];
const UK_IE: RoomHelpline[] = [{ name: 'Samaritans (UK, Ireland)', contact: '116 123', href: 'tel:116123' }];
const AU: RoomHelpline[] = [{ name: 'Lifeline (Australia)', contact: '13 11 14', href: 'tel:131114' }];

/** Always offered last: a directory covering every country. */
const DIRECTORY: RoomHelpline = {
  name: 'Find a helpline in your country',
  contact: 'findahelpline.com',
  href: 'https://findahelpline.com',
};

const BY_REGION: Record<string, RoomHelpline[]> = {
  IN, US: US_CA, CA: US_CA, GB: UK_IE, IE: UK_IE, AU,
};

/** Region from the locale (`en-IN`), else a few unambiguous timezones. Null when unknown. */
export const regionOf = (locale: string, timeZone: string): string | null => {
  const fromLocale = /[-_]([A-Za-z]{2})\b/.exec(locale)?.[1]?.toUpperCase();
  if (fromLocale && fromLocale in BY_REGION) return fromLocale;
  if (/^Asia\/(Kolkata|Calcutta)$/.test(timeZone)) return 'IN';
  if (timeZone === 'Europe/London') return 'GB';
  if (/^Australia\//.test(timeZone)) return 'AU';
  return null;
};

/** Local helplines first (when the region is known), then the worldwide directory. Pure. */
export const helplinesFor = (locale: string, timeZone: string): RoomHelpline[] => {
  const region = regionOf(locale, timeZone);
  return [...(region ? (BY_REGION[region] ?? []) : []), DIRECTORY];
};

/** Helplines for this browser. */
export const browserHelplines = (): RoomHelpline[] =>
  helplinesFor(navigator.language, Intl.DateTimeFormat().resolvedOptions().timeZone);
