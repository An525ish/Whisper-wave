import * as messageReactionRepo from '../../repositories/messageReaction.js';
import type { MessageReaction, ToggleMessageReactionInput } from '../../types/message.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Add, switch or remove `userId`'s reaction to `messageId`.
 *
 * Invariant: one reaction per user per message. Because of that, switching
 * emoji is a two-step edit (drop from the old entry, add to the new one) and an
 * entry whose last user just left is pruned rather than left behind empty.
 *
 * Resolves to the message's reactions so the caller can broadcast them, or
 * `null` when nothing was written and nothing should be broadcast (see the
 * spoofing guard below).
 */
export const toggleMessageReaction = async (
  input: ToggleMessageReactionInput
): Promise<MessageReaction[] | null> => {
  const { messageId, chatId, emoji, userId } = input;

  const msg = await messageReactionRepo.findReactionState(messageId);
  if (!msg) throw new AppError(404, 'Message not found');

  // Spoofing guard: a message id from a different chat. Unlike a missing
  // message, this is not a failure to report — the reacting user clicked a
  // bubble they can actually see, so the only thing wrong is the id in the
  // payload. Return without writing, and let the caller stay quiet.
  if (String(msg.chat) !== chatId) return null;

  // Each user may have at most one reaction per message. Find their current one (if any).
  const userCurrentEntry = msg.reactions?.find((r) =>
    r.users.some((u) => String(u) === userId)
  );

  if (userCurrentEntry && userCurrentEntry.emoji === emoji) {
    // Clicking the same emoji the user already reacted with → remove it
    await messageReactionRepo.pullUserFromEmoji(messageId, emoji, userId);
    if (userCurrentEntry.users.length <= 1) {
      await messageReactionRepo.pruneEmoji(messageId, emoji);
    }
  } else {
    // Clicking a different emoji (or first reaction) → remove old, add new

    if (userCurrentEntry) {
      const prevEmoji = userCurrentEntry.emoji;
      await messageReactionRepo.pullUserFromEmoji(messageId, prevEmoji, userId);
      // Prune the old entry if this user was the only one
      if (userCurrentEntry.users.length <= 1) {
        await messageReactionRepo.pruneEmoji(messageId, prevEmoji);
      }
    }

    const targetEntry = msg.reactions?.find((r) => r.emoji === emoji);
    if (targetEntry) {
      await messageReactionRepo.addUserToEmoji(messageId, emoji, userId);
    } else {
      await messageReactionRepo.pushEmojiWithUser(messageId, emoji, userId);
    }
  }

  const updated = await messageReactionRepo.findReactions(messageId);
  return updated.map((r) => ({ emoji: r.emoji, users: r.users.map(String) }));
};