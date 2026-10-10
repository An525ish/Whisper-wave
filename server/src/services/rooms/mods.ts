import { hideMessage, membersOf } from './registry.js';
import * as roomBanRepo from '../../repositories/roomBan.js';
import type { RoomRole } from '../../types/room.js';

const MOD_ROLES: RoomRole[] = ['mod', 'host', 'admin'];

/** instanceId:key → mute expiry. Lazy-pruned; restarts clear it (fine). */
const mutes = new Map<string, number>();

/** instanceId:key → shadow-mute expiry. Same lifecycle as mutes. */
const shadowed = new Map<string, number>();

const muteKey = (instanceId: string, key: string): string => `${instanceId}:${key}`;

const expired = (store: Map<string, number>, instanceId: string, key: string): boolean => {
  const until = store.get(muteKey(instanceId, key));
  if (until === undefined) return false;
  if (until <= Date.now()) {
    store.delete(muteKey(instanceId, key));
    return false;
  }
  return true;
};

/** Whether this identity may moderate this instance. */
export const canModerate = (instanceId: string, key: string): boolean => {
  const member = membersOf(instanceId).find((m) => m.key === key);
  return member !== undefined && (MOD_ROLES as string[]).includes(member.role);
};

export const isMuted = (instanceId: string, key: string): boolean =>
  expired(mutes, instanceId, key);

/**
 * Shadow-mute: the sender's posts ack as sent and echo back to them, but
 * nobody else ever sees them. For spammers who adapt the moment they notice
 * a mute — and for cases where a visible punishment escalates. Same expiry
 * rules as a mute; unmute applies to both.
 */
export const isShadowMuted = (instanceId: string, key: string): boolean =>
  expired(shadowed, instanceId, key);

export const shadowMuteMember = (
  instanceId: string,
  modKey: string,
  targetKey: string,
  minutes: number
): boolean => {
  if (!canModerate(instanceId, modKey)) return false;
  if (modKey === targetKey) return false;
  shadowed.set(muteKey(instanceId, targetKey), Date.now() + minutes * 60 * 1000);
  return true;
};

/** Remove one message from history (evidence survives in reports). */
export const deleteRoomMessage = (
  instanceId: string,
  modKey: string,
  messageId: string
): boolean => {
  if (!canModerate(instanceId, modKey)) return false;
  return hideMessage(instanceId, messageId);
};

/** Silence one identity for `minutes` (1–1440, validated at the boundary). */
export const muteMember = (
  instanceId: string,
  modKey: string,
  targetKey: string,
  minutes: number
): boolean => {
  if (!canModerate(instanceId, modKey)) return false;
  if (modKey === targetKey) return false;
  mutes.set(muteKey(instanceId, targetKey), Date.now() + minutes * 60 * 1000);
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
  if (!canModerate(instanceId, modKey)) return false;
  if (modKey === targetKey) return false;
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
