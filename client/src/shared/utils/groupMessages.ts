import type { MessageGroup } from '@/shared/types/ui';

/**
 * Per-message grouping flags for a chat thread, computed in one pass.
 *
 * Both message lists used to inline this: the anonymous room keyed on
 * `from: 'me' | 'them'`, the logged-in thread on `sender._id`. Keying on a
 * caller-supplied discriminant keeps one implementation for both shapes
 * without either owning the other's data model.
 *
 * Pure — no React, no I/O. `keyOf` must be stable for a given message.
 */
export function groupMessages<TMessage, TKey>(
  messages: readonly TMessage[],
  keyOf: (message: TMessage) => TKey,
): MessageGroup<TKey>[] {
  return messages.map((message, index) => {
    const key = keyOf(message);
    const joinedAbove = index > 0 && keyOf(messages[index - 1]) === key;
    const joinedBelow = index < messages.length - 1 && keyOf(messages[index + 1]) === key;
    return { key, joinedAbove, joinedBelow, isTail: !joinedBelow };
  });
}