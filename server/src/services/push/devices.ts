import { MAX_PUSH_DEVICES_PER_USER, PUSH_USER_AGENT_MAX } from '../../constants/push.js';
import * as pushDeviceRepo from '../../repositories/pushDevice.js';
import type { PushPlatform } from '../../types/push.js';

export const registerDevice = async (input: {
  userId: string;
  token: string;
  platform: PushPlatform;
  userAgent: string | undefined;
}): Promise<void> => {
  await pushDeviceRepo.upsertByToken({
    ...input,
    userAgent: (input.userAgent ?? '').slice(0, PUSH_USER_AGENT_MAX),
  });
  await pushDeviceRepo.trimToNewest(input.userId, MAX_PUSH_DEVICES_PER_USER);
};

export const removeDevice = (userId: string, token: string): Promise<void> =>
  pushDeviceRepo.deleteByUserAndToken(userId, token);

export const removeAllDevices = (userId: string): Promise<void> =>
  pushDeviceRepo.deleteAllForUser(userId);
