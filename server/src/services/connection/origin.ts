import type { Types } from 'mongoose';
import * as connectionRepo from '../../repositories/connection.js';
import type { ConnectionOrigin } from '../../types/match.js';

/**
 * The "how we met" story for a DM that began as an anonymous match.
 *
 * This is what makes the Connection document worth writing: with no read path
 * the origin data is stored and never shown, and the emotional payoff of the
 * whole anonymous layer — "you matched as midnight_fox and blue_static" — is
 * lost. Returns `null` for ordinary DMs, which have no Connection record.
 */
export const getConnectionOrigin = async (
  chatId: string,
  userId: string
): Promise<ConnectionOrigin | null> => {
  const connection = await connectionRepo.findByChatIdPopulated(chatId, userId);
  if (!connection) return null;

  const users = connection.users as unknown as Array<{
    _id: Types.ObjectId;
    name?: string;
    username?: string;
    avatar?: { url?: string };
  }>;

  const selfIndex = users.findIndex((u) => u._id.toString() === userId);
  if (selfIndex === -1) return null;

  const index = selfIndex as 0 | 1;
  const partnerIndex = index === 0 ? 1 : 0;
  const partner = users[partnerIndex];

  return {
    connectionId: connection._id.toString(),
    chatId: connection.chat.toString(),
    originNames: connection.originNames,
    originVibeTags: connection.originVibeTags,
    connectedAt: (connection.connectedAt ?? connection.createdAt)?.toISOString() ?? null,
    selfIndex: index,
    selfAlias: connection.originNames[index],
    partnerAlias: connection.originNames[partnerIndex],
    selfVibes: connection.originVibeTags[index],
    partnerVibes: connection.originVibeTags[partnerIndex],
    partnerName: partner?.name ?? 'Unknown',
    partnerUsername: partner?.username,
    partnerAvatar: partner?.avatar?.url,
  };
};
