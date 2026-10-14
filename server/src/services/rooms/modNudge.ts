import { sendPushIntents } from '../push/index.js';
import { liveCounts } from './registry.js';
import { isStaffed } from './modPresence.js';
import type { RealtimeNotify } from '../../types/chat.js';
import type { IRoomFields } from '../../types/room.js';

type NudgeTemplate = Pick<IRoomFields, 'slug' | 'title' | 'mods' | 'requiresModPresence'>;

/**
 * The push intent for "a member arrived and nobody is moderating". Null when
 * the room needs no nudge (not a listening room, already staffed, no mods to
 * ask). Carries a head count only — never identities or message text.
 */
export const buildModNeededNotify = (
  template: NudgeTemplate,
  staffed: boolean,
  waiting: number
): RealtimeNotify | null => {
  const mods = (template.mods ?? []).map(String);
  if (!template.requiresModPresence || staffed || mods.length === 0) return null;
  return {
    event: 'mod-needed',
    members: mods,
    push: { kind: 'mod-needed', slug: template.slug, title: template.title, waiting },
  };
};

/**
 * Called after a plain member is seated. Mods are pushed even if online
 * elsewhere in the app (`isOnline = () => false`, like room-open reminders);
 * the per-(mod, room) throttle lives in the push dispatcher.
 */
export const nudgeModsIfWaiting = (template: NudgeTemplate): void => {
  if (!template.requiresModPresence || isStaffed(template.slug)) return;
  const waiting = liveCounts(template.slug).reduce((sum, c) => sum + c.online, 0);
  const notify = buildModNeededNotify(template, false, waiting);
  if (notify) sendPushIntents([notify], () => false);
};
