import { v4 as uuid } from 'uuid';
import { AppError } from '../../utils/AppError.js';
import { ROOM_ERROR_CODES } from '../../constants/room-events.js';
import { aliasKey, normalizeAlias } from './automod.js';
import { dropInstance, instanceCounters, instances, nextInstanceNumber, notifySeatChange } from './store.js';
import type {
  IRoomFields,
  LiveRoomMember,
  RoomInstance,
  RoomMemberIdentity,
  RoomRole,
} from '../../types/room.js';

const keyFor = (identity: RoomMemberIdentity): string => {
  const key = identity.userId ?? identity.gid;
  if (!key) throw new AppError(401, 'Room identity required — join with a gid or an account');
  return key;
};

/**
 * Alias collisions get a short disambiguator — two "NightOwl"s stay distinct.
 * Compared case-insensitively on the NFKC form, so "nightowl" and "ＮｉｇｈｔＯｗｌ"
 * cannot impersonate each other.
 */
const uniqueAlias = (members: Map<string, LiveRoomMember>, rawAlias: string): string => {
  const alias = normalizeAlias(rawAlias);
  const taken = new Set([...members.values()].map((m) => aliasKey(m.alias)));
  if (!taken.has(aliasKey(alias))) return alias;
  const suffixed = `${alias}·${uuid().slice(0, 4)}`;
  return taken.has(aliasKey(suffixed)) ? `${alias}·${uuid().slice(0, 8)}` : suffixed;
};

const instancesOf = (slug: string): RoomInstance[] =>
  [...instances.values()].filter((i) => i.slug === slug).sort((a, b) => a.createdAt - b.createdAt);

/**
 * Place an identity into an instance of this template's room.
 *
 * Fills the first UNLOCKED instance under the soft cap; overflows to the
 * fullest non-full unlocked one; opens `#n` past the hard cap. Locked
 * instances are invisible to placement — and when every live instance is
 * locked, members are refused instead of opening a fresh one (that would
 * defeat the lock). Mods, hosts and admins always pass.
 */
export const joinInstance = (params: {
  template: Pick<IRoomFields, 'slug' | 'title' | 'capSoft' | 'capHard' | 'requiresModPresence'>;
  identity: RoomMemberIdentity;
  alias: string;
  color: string;
  role?: RoomRole;
  trust?: LiveRoomMember['trust'];
}): { instanceId: string; member: LiveRoomMember; online: number } => {
  const { template, identity, alias, color, role = 'member', trust } = params;
  const key = keyFor(identity);

  // Rejoin is idempotent: same identity, same instance, fresh alias claim.
  for (const inst of instancesOf(template.slug)) {
    const existing = inst.members.get(key);
    if (existing) {
      existing.role = role;
      inst.requiresModPresence = template.requiresModPresence === true;
      if (aliasKey(existing.alias) !== aliasKey(alias)) {
        const others = new Map(inst.members);
        others.delete(key);
        existing.alias = uniqueAlias(others, alias);
      }
      notifySeatChange(template.slug);
      return { instanceId: inst.id, member: existing, online: inst.members.size };
    }
  }

  const privileged = role !== 'member';
  const live = instancesOf(template.slug);
  const pool = privileged ? live : live.filter((i) => !i.locked);
  let target = pool.find((i) => i.members.size < template.capSoft);
  if (!target) {
    const fullest = pool.at(-1);
    target = fullest && fullest.members.size < template.capHard ? fullest : undefined;
  }
  if (!target && !privileged && live.length > 0 && live.every((i) => i.locked)) {
    // Every live instance is locked — opening a fresh one would defeat the lock.
    throw new AppError(403, ROOM_ERROR_CODES.LOCKED);
  }
  if (!target) {
    const n = nextInstanceNumber(template.slug);
    target = {
      id: `${template.slug}#${n}`,
      slug: template.slug,
      title: template.title,
      capSoft: template.capSoft,
      capHard: template.capHard,
      locked: false,
      members: new Map(),
      ring: [],
      createdAt: Date.now(),
    };
    instances.set(target.id, target);
  }
  target.requiresModPresence = template.requiresModPresence === true;

  const member: LiveRoomMember = {
    key,
    alias: uniqueAlias(target.members, alias),
    color,
    role,
    ...(identity.userId ? { userId: identity.userId } : {}),
    ...(identity.gid ? { gid: identity.gid } : {}),
    ...(trust ? { trust } : {}),
    joinedAt: Date.now(),
  };
  target.members.set(key, member);
  notifySeatChange(template.slug);
  return { instanceId: target.id, member, online: target.members.size };
};

/** Leave an instance. Empty instances vanish — ephemerality is the promise. */
export const leaveInstance = (instanceId: string, identity: RoomMemberIdentity): number => {
  const inst = instances.get(instanceId);
  if (!inst) return 0;
  inst.members.delete(keyFor(identity));
  if (inst.members.size === 0) dropInstance(instanceId);
  notifySeatChange(inst.slug);
  return inst.members.size;
};

/** Remove one seat by key (kick path — the identity is already resolved). */
export const removeMember = (instanceId: string, key: string): number => {
  const inst = instances.get(instanceId);
  if (!inst) return 0;
  inst.members.delete(key);
  if (inst.members.size === 0) dropInstance(instanceId);
  notifySeatChange(inst.slug);
  return inst.members.size;
};

/** Whether this seat key currently holds a seat in the instance. */
export const isSeated = (instanceId: string, key: string): boolean =>
  instances.get(instanceId)?.members.has(key) ?? false;

/** The live instance of `slug` this seat key sits in, if any. */
export const seatInstanceOf = (slug: string, key: string): string | null =>
  instancesOf(slug).find((i) => i.members.has(key))?.id ?? null;

/** Lock, unlock, or retune one instance. Returns false when gone. */
export const setLocked = (instanceId: string, locked: boolean): boolean => {
  const inst = instances.get(instanceId);
  if (!inst) return false;
  inst.locked = locked;
  return true;
};

export const setSlowOverride = (instanceId: string, ms: number | undefined): boolean => {
  const inst = instances.get(instanceId);
  if (!inst) return false;
  if (ms === undefined) delete inst.slowOverrideMs;
  else inst.slowOverrideMs = ms;
  return true;
};

export const instanceSettings = (
  instanceId: string
): { locked: boolean; slowOverrideMs?: number; requiresModPresence?: boolean } | null => {
  const inst = instances.get(instanceId);
  if (!inst) return null;
  return {
    locked: inst.locked,
    ...(inst.slowOverrideMs !== undefined ? { slowOverrideMs: inst.slowOverrideMs } : {}),
    ...(inst.requiresModPresence ? { requiresModPresence: true } : {}),
  };
};

export {
  appendMessage,
  findMessage,
  findMessageInstance,
  getEvidenceWindow,
  hideMessage,
  recentMessages,
  toggleReaction,
  unhideMessage,
} from './ring.js';
export { onInstanceClosed } from './store.js';

export const membersOf = (instanceId: string): LiveRoomMember[] => {
  const inst = instances.get(instanceId);
  if (!inst) return [];
  return [...inst.members.values()];
};

/** Live instances of a template (read-only view for mod-presence). */
export const liveInstancesOf = (slug: string): readonly RoomInstance[] => instancesOf(slug);

export const liveCounts = (slug: string): Array<{ instanceId: string; online: number }> =>
  instancesOf(slug).map((i) => ({ instanceId: i.id, online: i.members.size }));

/** Remove a whole instance (admin close). Returns the evicted member keys. */
export const clearInstance = (instanceId: string): string[] => {
  const inst = instances.get(instanceId);
  if (!inst) return [];
  const keys = [...inst.members.keys()];
  dropInstance(instanceId);
  notifySeatChange(inst.slug);
  return keys;
};

/** Every live instance id — the Wave bot sweep and admin close iterate this. */
export const allInstanceIds = (): string[] => [...instances.keys()];

/** Test + shutdown escape hatch. Production code never calls this. */
export const clearRegistry = (): void => {
  for (const id of [...instances.keys()]) dropInstance(id);
  instanceCounters.clear();
};
