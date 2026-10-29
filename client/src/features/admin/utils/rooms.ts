import { z } from 'zod';
import { ROOM_MAX_MODS, ROOM_MEDIA_KINDS, ROOM_MAX_RULES, ROOM_VISIBILITIES } from '../constants/rooms';
import type { AdminRoomMedia, AdminRoomRow, AdminRoomUpsert, RoomEditForm } from '../types';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
export const OBJECT_ID = /^[a-f\d]{24}$/i;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const splitClean = (text: string, separator: string | RegExp): string[] =>
  text.split(separator).map((part) => part.trim()).filter(Boolean);

export const parseRules = (text: string): string[] => splitClean(text, '\n');
export const parseModIds = (text: string): string[] => splitClean(text, ',');

const isValidTimeZone = (tz: string): boolean => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

export const roomEditSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(60, 'Title is 60 characters at most'),
    description: z.string().trim().min(1, 'Description is required').max(280, 'Description is 280 characters at most'),
    rulesText: z
      .string()
      .refine((t) => parseRules(t).length <= ROOM_MAX_RULES, `Up to ${ROOM_MAX_RULES} rules`)
      .refine((t) => parseRules(t).every((r) => r.length <= 140), 'Each rule is 140 characters at most'),
    lang: z.string().trim().min(1, 'Language is required').max(20),
    official: z.boolean(),
    requiresModPresence: z.boolean(),
    media: z.array(z.string()).refine((m) => m.every((k) => (ROOM_MEDIA_KINDS as readonly string[]).includes(k))),
    visibility: z.enum(ROOM_VISIBILITIES),
    hoursEnabled: z.boolean(),
    days: z.array(z.string()),
    start: z.string(),
    end: z.string(),
    tz: z.string().trim(),
    modsText: z
      .string()
      .refine((t) => parseModIds(t).length <= ROOM_MAX_MODS, `Up to ${ROOM_MAX_MODS} mods`)
      .refine((t) => parseModIds(t).every((id) => OBJECT_ID.test(id)), 'Mods must be 24-character ids, comma separated'),
  })
  .superRefine((v, ctx) => {
    if (!v.hoursEnabled) return;
    if (v.days.length === 0) ctx.addIssue({ code: 'custom', path: ['days'], message: 'Pick at least one day' });
    if (!HHMM.test(v.start)) ctx.addIssue({ code: 'custom', path: ['start'], message: 'Use HH:MM' });
    if (!HHMM.test(v.end)) ctx.addIssue({ code: 'custom', path: ['end'], message: 'Use HH:MM' });
    if (!v.tz || !isValidTimeZone(v.tz)) ctx.addIssue({ code: 'custom', path: ['tz'], message: 'Unknown timezone (IANA, e.g. Asia/Kolkata)' });
  });

export const roomToForm = (room: AdminRoomRow): RoomEditForm => ({
  title: room.title,
  description: room.description,
  rulesText: room.rules.join('\n'),
  lang: room.lang,
  official: room.official,
  requiresModPresence: room.requiresModPresence,
  media: room.media ?? [],
  visibility: room.visibility,
  hoursEnabled: room.hours !== null,
  days: (room.hours?.days ?? [1, 2, 3, 4, 5]).map(String),
  start: room.hours?.start ?? '18:00',
  end: room.hours?.end ?? '22:00',
  tz: room.hours?.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  modsText: room.mods.map((m) => m.id).join(', '),
});

/** Always sends the full object: the server overwrites rules/hours when omitted. */
export const formToUpsert = (slug: string, v: RoomEditForm): AdminRoomUpsert => {
  return {
    slug,
    title: v.title.trim(),
    description: v.description.trim(),
    rules: parseRules(v.rulesText),
    lang: v.lang.trim(),
    official: v.official,
    requiresModPresence: v.requiresModPresence,
    media: v.media as AdminRoomMedia[],
    visibility: v.visibility,
    hours: v.hoursEnabled
      ? { days: v.days.map(Number).sort((a, b) => a - b), start: v.start, end: v.end, tz: v.tz }
      : null,
    mods: parseModIds(v.modsText),
  };
};

/** Re-send a template unchanged except for `patch` (e.g. approve for the lobby). */
export const roomToUpsert = (room: AdminRoomRow, patch: Partial<AdminRoomUpsert>): AdminRoomUpsert => ({
  slug: room.slug,
  title: room.title,
  description: room.description,
  rules: room.rules,
  lang: room.lang,
  official: room.official,
  hours: room.hours,
  visibility: room.visibility,
  requiresModPresence: room.requiresModPresence,
  ...patch,
});
