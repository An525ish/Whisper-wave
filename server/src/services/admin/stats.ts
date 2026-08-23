import * as chatRepo from '../../repositories/chat.js';
import * as messageRepo from '../../repositories/message.js';
import * as requestRepo from '../../repositories/request.js';
import * as userRepo from '../../repositories/user.js';
import type { AdminStats } from '../../types/admin.js';
import { buildLast7DayBuckets } from '../../utils/statsBuckets.js';
import {
  getPresenceSize,
} from '../presence/index.js';

export const getStats = async (): Promise<AdminStats> => {
  const [users, groups, chats, messages, pendingRequests, newUsers, messageSeries, groupsBuckets, requestsBuckets] =
    await Promise.all([
      userRepo.countAll(),
      chatRepo.countGroups(),
      chatRepo.countAll(),
      messageRepo.countAll(),
      requestRepo.countPending(),
      buildLast7DayBuckets(userRepo.countCreatedByDay),
      buildLast7DayBuckets(messageRepo.countCreatedByDay),
      buildLast7DayBuckets(chatRepo.countGroupsCreatedByDay),
      buildLast7DayBuckets(requestRepo.countCreatedByDay),
    ]);

  return {
    users,
    groups,
    chats,
    messages,
    pendingRequests,
    onlineUsers: getPresenceSize(),
    seriesLabels: newUsers.labels,
    newUsersSeries: newUsers.values,
    messagesSeries: messageSeries.values,
    groupsSeries: groupsBuckets.values,
    requestsSeries: requestsBuckets.values,
  };
};
