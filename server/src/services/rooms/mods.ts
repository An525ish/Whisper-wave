import { hideMessage, membersOf, onInstanceClosed, unhideMessage } from './registry.js';
import { notifySeatChange } from './store.js';
import * as roomBanRepo from '../../repositories/roomBan.js';
import type { LiveRoomMessage, RoomRole } from '../../types/room.js';

const MOD_ROLES: RoomRole[] = ['mod', 'host', 'admin'];

/** instanceId → (key → expiry). Pruned on instance close and by `pruneExpiredMods`. */
type ExpiryStore = Map<string, Map<string, number>>;
const mutes: ExpiryStore = new Map();
const shadowed: ExpiryStore = new Map();

onInstanceClosed((instanceId) => {
  mutes.delete(instanceId);
  shadowed.delete(instanceId);
});

const setExpiry = (store: ExpiryStore, instanceId: string, key: string, minutes: number): void => {
  const inner = store.get(instanceId) ?? new Map<string, number>();
  inner.set(key, Date.now() + minutes * 60 * 1000);
  store.set(instanceId, inner);
};

const active = (store: ExpiryStore, instanceId: string, key: string): boolean => {
  const until = store.get(instanceId)?.get(key);
  if (until === undefined) return false;
  if (until <= Date.now()) {
    store.get(instanceId)?.delete(key);
    return false;
  }
  return true;
};

/** Drop expired mutes/shadow-mutes (called from the namespace sweep). */
export const pruneExpiredMods = (now: number = Date.now()): void => {
  for (const store of [mutes, shadowed]) {
    for (const [instanceId, inner] of store) {
      for (const [key, until] of inner) if (until <= now) inner.delete(key);
      if (inner.size === 0) store.delete(instanceId);
    }
  }
};

/** Whether this identity may moderate this instance. */
export const canModerate = (instanceId: string, key: string): boolean => {
  const member = membersOf(instanceId).find((m) => m.key === key);
  return member !== undefined && (MOD_ROLES as string[]).includes(member.role);
};

/**
 * Role hierarchy for punitive actions (mute, shadow-mute, kick): a moderator
 * outranks only plain members. Mods cannot touch the host or each other; the
 * host (and admins) can act on mods. Nobody acts on themselves.
 */
export const canActOn = (instanceId: string, modKey: string, targetKey: string): boolean => {
  if (modKey === targetKey || !canModerate(instanceId, modKey)) return false;
  const members = membersOf(instanceId);
  const actor = members.find((m) => m.key === modKey);
  const target = members.find((m) => m.key === targetKey);
  if (!actor || !target) return false;
  if (!(MOD_ROLES as string[]).includes(target.role)) return true;
  return actor.role === 'host' || actor.role === 'admin';
};

export const isMuted = (instanceId: string, key: string): boolean => active(mutes, instanceId, key);

/**
 * Shadow-mute: the sender's posts ack as sent and echo back to them, but
 * nobody else ever sees them. For spammers who adapt the moment they notice
 * a mute — and for cases where a visible punishment escalates. Same expiry
 * rules as a mute.
 */
export const isShadowMuted = (instanceId: string, key: string): boolean =>
  active(shadowed, instanceId, key);

export const shadowMuteMember = (
  instanceId: string,
  modKey: string,
  targetKey: string,
  minutes: number
): boolean => {
  if (!canActOn(instanceId, modKey, targetKey)) return false;
  setExpiry(shadowed, instanceId, targetKey, minutes);
  return true;
};

/** Remove one message from history (evidence survives in reports). */
export const deleteRoomMessage = (instanceId: string, modKey: string, messageId: string): boolean => {
  if (!canModerate(instanceId, modKey)) return false;
  return hideMessage(instanceId, messageId);
};

/** Restore a hidden message. Returns the message, or null (not mod / not hidden / gone). */
export const unhideRoomMessage = (
  instanceId: string,
  modKey: string,
  messageId: string
): LiveRoomMessage | null => {
  if (!canModerate(instanceId, modKey)) return null;
  return unhideMessage(instanceId, messageId);
};

/** Silence one identity for `minutes` (1–1440, validated at the boundary). */
export const muteMember = (
  instanceId: string,
  modKey: string,
  targetKey: string,
  minutes: number
): boolean => {
  if (!canActOn(instanceId, modKey, targetKey)) return false;
  setExpiry(mutes, instanceId, targetKey, minutes);
  // A muted mod no longer counts as present (listening-room gate) — and counts
  // again when the mute lapses, which fires no event of its own, so re-evaluate then.
  const slug = instanceId.split('#')[0] ?? instanceId;
  notifySeatChange(slug);
  setTimeout(() => notifySeatChange(slug), minutes * 60 * 1000 + 1_000).unref();
  return true;
};

/**
 * Eject one identity with a short room ban (15 min) so kick means something
 * but is not a sentence — longer bans go through the admin surface.
 */
export const kickMember = async (params: {
  slug: string;
  instanceId: string;
  modKey: string;
  modAlias: string;
  targetKey: string;
  targetGid?: string;
  targetUserId?: string;
}): Promise<boolean> => {
  const { slug, instanceId, modKey, modAlias, targetKey, targetGid, targetUserId } = params;
  if (!canActOn(instanceId, modKey, targetKey)) return false;
  await roomBanRepo.ban({
    roomSlug: slug,
    gid: targetGid ?? null,
    userId: targetUserId ?? null,
    minutes: 15,
    reason: `Kicked by ${modAlias}`,
    by: modAlias,
  });
  return true;
};
