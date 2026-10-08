import * as chatRepo from '../../repositories/chat.js';
import * as messageReactionRepo from '../../repositories/messageReaction.js';
import type { MessageReaction, ToggleMessageReactionInput } from '../../types/message.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Add, switch or remove `userId`'s reaction to `messageId`.
 *
 * Invariant: one reaction per user per message. Switching emoji drops the user
 * from the old entry and adds them to the new one, and an entry whose last user
 * just left is pruned rather than left behind empty — all in one atomic update.
 *
 * Throws 404 for an unknown message and 403 when `userId` is not a member of `chatId`.
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

  // Only members of the chat may react. Checked against the chat itself, not
  // just the message's chat id, so an ex-member or outsider cannot write.
  const chat = await chatRepo.findByIdMembers(chatId);
  if (!chat || !chat.members.some((m) => m.toString() === userId)) {
    throw new AppError(403, 'Forbidden');
  }

  // One atomic update (see the repo): the toggle cannot interleave with another
  // toggle by the same user. `null` only if the message vanished since the check.
  const updated = await messageReactionRepo.toggleUserReaction(messageId, chatId, emoji, userId);
  if (!updated) throw new AppError(404, 'Message not found');
  return updated.map((r) => ({ emoji: r.emoji, users: r.users.map(String) }));
};
