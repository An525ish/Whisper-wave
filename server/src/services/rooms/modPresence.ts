import { ROOM_MOD_GRACE_MS } from '../../constants/rooms.js';
import { isMuted } from './mods.js';
import { liveInstancesOf } from './registry.js';
import { onSeatChange } from './store.js';
import type { RoomRole, RoomStatus } from '../../types/room.js';

const MOD_ROLES: readonly RoomRole[] = ['mod', 'host', 'admin'];

/**
 * Lobby state. Hours win (closed is closed); otherwise a listening room with
 * no moderator is `waiting_mod` — joinable and readable, but not postable.
 */
export const deriveRoomStatus = (params: {
  hoursOpen: boolean;
  requiresModPresence: boolean;
  staffed: boolean;
}): RoomStatus => {
  if (!params.hoursOpen) return 'closed';
  return params.requiresModPresence && !params.staffed ? 'waiting_mod' : 'open';
};

/** The post gate: a listening room with nobody moderating refuses posts. Pure. */
export const isPostingPaused = (requiresModPresence: boolean | undefined, staffed: boolean): boolean =>
  requiresModPresence === true && !staffed;

/**
 * At least one seated mod/host/admin in ANY live instance of the template.
 * Guests never hold those roles; a muted mod does not count. In-process: no Redis.
 */
export const modPresent = (slug: string): boolean =>
  liveInstancesOf(slug).some((inst) =>
    [...inst.members.values()].some(
      (m) => (MOD_ROLES as readonly string[]).includes(m.role) && !isMuted(inst.id, m.key)
    )
  );

export type ModPresenceDeps = {
  graceMs: number;
  /** Schedule `fn` after `ms`; returns a canceller. Injectable so tests need no real time. */
  schedule: (fn: () => void, ms: number) => () => void;
  hasMod: (slug: string) => boolean;
  /** Does any live instance of this template require a mod? */
  requires: (slug: string) => boolean;
  onChange: (slug: string, state: 'paused' | 'resumed') => void;
};

/**
 * Per-template "staffed" state with a grace period. Staffed starts when a mod
 * seats (resume fires at once) and ends `graceMs` after the LAST mod leaves —
 * so a mod's refresh or flaky network never pauses the room. One timer per
 * template; a returning mod cancels it. When no instance of the template
 * remains, the state resets: nobody is there to pause.
 */
export const createModPresence = (deps: ModPresenceDeps) => {
  const staffed = new Set<string>();
  const timers = new Map<string, () => void>();

  const cancel = (slug: string): void => {
    timers.get(slug)?.();
    timers.delete(slug);
  };

  const sync = (slug: string): void => {
    if (!deps.requires(slug)) {
      cancel(slug);
      staffed.delete(slug);
      return;
    }
    if (deps.hasMod(slug)) {
      cancel(slug);
      if (!staffed.has(slug)) {
        staffed.add(slug);
        deps.onChange(slug, 'resumed');
      }
      return;
    }
    if (!staffed.has(slug) || timers.has(slug)) return;
    timers.set(
      slug,
      deps.schedule(() => {
        timers.delete(slug);
        if (deps.hasMod(slug) || !deps.requires(slug)) return;
        staffed.delete(slug);
        deps.onChange(slug, 'paused');
      }, deps.graceMs)
    );
  };

  return {
    sync,
    /** Staffed now: a mod is seated, or the grace after the last one left is still running. */
    isStaffed: (slug: string): boolean => deps.hasMod(slug) || timers.has(slug),
    /** Shutdown / kill-switch: drop every timer and forget all state. */
    reset: (): void => {
      for (const slug of [...timers.keys()]) cancel(slug);
      staffed.clear();
    },
  };
};

type ChangeListener = (slug: string, state: 'paused' | 'resumed') => void;
const listeners = new Set<ChangeListener>();

/** The socket layer subscribes to turn flips into room events. */
export const onModPresenceChange = (listener: ChangeListener): void => {
  listeners.add(listener);
};

const live = createModPresence({
  graceMs: ROOM_MOD_GRACE_MS,
  schedule: (fn, ms) => {
    const timer = setTimeout(fn, ms);
    timer.unref();
    return () => clearTimeout(timer);
  },
  hasMod: modPresent,
  requires: (slug) => liveInstancesOf(slug).some((i) => i.requiresModPresence === true),
  onChange: (slug, state) => {
    for (const listener of listeners) listener(slug, state);
  },
});

onSeatChange(live.sync);

/** Whether posting is open for this template right now (grace included). */
export const isStaffed = live.isStaffed;
export const resetModPresence = live.reset;
