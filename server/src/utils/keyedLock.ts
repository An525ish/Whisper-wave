/**
 * Run async work one-at-a-time per key (in this process).
 *
 * For check-then-write sequences that a unique index cannot guard, e.g. "count
 * this user's rooms, then create one". Calls with the same key queue; different
 * keys never wait on each other. The map entry is removed once its queue drains,
 * so it cannot grow.
 *
 * Scope: ONE process. Room state is already in-process (single instance), so this
 * matches; if the API ever runs on several instances, a count-then-create limit
 * needs a database-side guard instead.
 */
const tails = new Map<string, Promise<unknown>>();

export const withKeyedLock = async <T>(key: string, task: () => Promise<T>): Promise<T> => {
  const previous = tails.get(key) ?? Promise.resolve();
  const run = previous.then(task, task);
  const tail = run.catch(() => undefined);
  tails.set(key, tail);
  try {
    return await run;
  } finally {
    if (tails.get(key) === tail) tails.delete(key);
  }
};
