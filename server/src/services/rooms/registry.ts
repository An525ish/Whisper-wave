import { v4 as uuid } from 'uuid';
import { AppError } from '../../utils/AppError.js';
import { ROOM_ERROR_CODES } from '../../constants/room-events.js';
import { ROOM_MSG_RING } from '../../constants/rooms.js';
import type {
  IRoomFields,
  LiveRoomMember,
  LiveRoomMessage,
  RoomMemberIdentity,
  RoomRole,
} from '../../types/room.js';

type Instance = {
  id: string;
  slug: string;
  title: string;
  capSoft: number;
  capHard: number;
  /** Locked rooms refuse new member joins (mods/hosts always pass). */
  locked: boolean;
  /** Per-instance slow-mode override (ms). Falls back to role defaults. */
  slowOverrideMs?: number;
  members: Map<string, LiveRoomMember>;
  ring: LiveRoomMessage[];
  createdAt: number;
};

/**
 * Live room state — in-process, never Redis, never Mongo.
 *
 * Redis commands are the scarcest free resource and a room message is the
 * highest-frequency event in the system, so room messages cost zero Redis
 * commands. The stated trade-off: a restart drops every instance (clients
 * auto-rejoin; rings start empty). Single-node only — a second node needs the
 * Socket.IO Redis adapter plus a shared instance directory.
 */
const instances = new Map<string, Instance>();

const instanceNumber = (slug: string): number => {
  let n = 0;
  for (const inst of instances.values()) {
    if (inst.slug === slug) n += 1;
  }
  return n + 1;
};

const keyFor = (identity: RoomMemberIdentity): string => {
  const key = identity.userId ?? identity.gid;
  if (!key) throw new AppError(401, 'Room identity required — join with a gid or an account');
  return key;
};

/** Alias collisions get a short disambiguator — two "NightOwl"s stay distinct. */
const uniqueAlias = (members: Map<string, LiveRoomMember>, alias: string): string => {
  const taken = new Set([...members.values()].map((m) => m.alias));
  if (!taken.has(alias)) return alias;
  const suffix = uuid().slice(0, 4);
  return taken.has(`${alias}·${suffix}`) ? `${alias}·${uuid().slice(0, 8)}` : `${alias}·${suffix}`;
};

const instancesOf = (slug: string): Instance[] =>
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
  template: Pick<IRoomFields, 'slug' | 'title' | 'capSoft' | 'capHard'>;
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
      if (existing.alias !== alias) {
        const others = new Map(inst.members);
        others.delete(key);
        existing.alias = uniqueAlias(others, alias);
      }
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
    const n = instanceNumber(template.slug);
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
  return { instanceId: target.id, member, online: target.members.size };
};

/** Leave an instance. Empty instances vanish — ephemerality is the promise. */
export const leaveInstance = (instanceId: string, identity: RoomMemberIdentity): number => {
  const inst = instances.get(instanceId);
  if (!inst) return 0;
  inst.members.delete(keyFor(identity));
  if (inst.members.size === 0) instances.delete(instanceId);
  return inst.members.size;
};

/** Remove one seat by key (kick path — the identity is already resolved). */
export const removeMember = (instanceId: string, key: string): number => {
  const inst = instances.get(instanceId);
  if (!inst) return 0;
  inst.members.delete(key);
  if (inst.members.size === 0) instances.delete(instanceId);
  return inst.members.size;
};

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
): { locked: boolean; slowOverrideMs?: number } | null => {
  const inst = instances.get(instanceId);
  if (!inst) return null;
  return { locked: inst.locked, ...(inst.slowOverrideMs !== undefined ? { slowOverrideMs: inst.slowOverrideMs } : {}) };
};

export const appendMessage = (
  instanceId: string,
  message: Omit<LiveRoomMessage, 'id' | 'ts'> & { id?: string; ts?: number }
): LiveRoomMessage | null => {
  const inst = instances.get(instanceId);
  if (!inst) return null;
  const full: LiveRoomMessage = {
    ...message,
    id: message.id ?? uuid(),
    ts: message.ts ?? Date.now(),
  };
  inst.ring.push(full);
  if (inst.ring.length > ROOM_MSG_RING) {
    inst.ring.splice(0, inst.ring.length - ROOM_MSG_RING);
  }
  return full;
};

export const recentMessages = (instanceId: string, limit = ROOM_MSG_RING): LiveRoomMessage[] => {
  const inst = instances.get(instanceId);
  if (!inst) return [];
  // Hidden messages leave history for everyone (mods included) — the audit
  // trail is the report evidence snapshot, not the thread.
  return inst.ring.filter((m) => !m.hidden).slice(-limit);
};

/** Mod-remove (or auto-hide) a message. Never deletes — evidence survives. */
export const hideMessage = (instanceId: string, messageId: string): boolean => {
  const inst = instances.get(instanceId);
  const target = inst?.ring.find((m) => m.id === messageId);
  if (!inst || !target || target.hidden) return false;
  target.hidden = true;
  return true;
};

export const findMessage = (instanceId: string, messageId: string): LiveRoomMessage | null => {
  const inst = instances.get(instanceId);
  return inst?.ring.find((m) => m.id === messageId) ?? null;
};

/** Which live instance of this room holds the message (report path). */
export const findMessageInstance = (
  slug: string,
  messageId: string
): string | null => {
  for (const inst of instancesOf(slug)) {
    if (inst.ring.some((m) => m.id === messageId)) return inst.id;
  }
  return null;
};

/**
 * Toggle one curated reaction. Returns per-reaction counts, or null when the
 * message is gone. Who-holds-what stays server-side — clients get counts.
 */
export const toggleReaction = (
  instanceId: string,
  key: string,
  messageId: string,
  reaction: string
): Record<string, number> | null => {
  const target = findMessage(instanceId, messageId);
  if (!target || target.hidden) return null;
  const holders = new Set(target.reactions?.[reaction] ?? []);
  if (holders.has(key)) holders.delete(key);
  else holders.add(key);
  target.reactions = { ...target.reactions, [reaction]: [...holders] };
  if (target.reactions[reaction]?.length === 0) delete target.reactions[reaction];
  const counts: Record<string, number> = {};
  for (const [name, members] of Object.entries(target.reactions)) {
    counts[name] = members.length;
  }
  return counts;
};

export const membersOf = (instanceId: string): LiveRoomMember[] => {
  const inst = instances.get(instanceId);
  if (!inst) return [];
  return [...inst.members.values()];
};

export const liveCounts = (slug: string): Array<{ instanceId: string; online: number }> =>
  instancesOf(slug).map((i) => ({ instanceId: i.id, online: i.members.size }));

/** Remove a whole instance (admin close). Returns the evicted member keys. */
export const clearInstance = (instanceId: string): string[] => {
  const inst = instances.get(instanceId);
  if (!inst) return [];
  const keys = [...inst.members.keys()];
  instances.delete(instanceId);
  return keys;
};

/** Every live instance id — the Wave bot sweep and admin close iterate this. */
export const allInstanceIds = (): string[] => [...instances.keys()];

/** Test + shutdown escape hatch. Production code never calls this. */
export const clearRegistry = (): void => {
  instances.clear();
};
