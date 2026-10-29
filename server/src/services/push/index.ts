import * as chatRepo from '../../repositories/chat.js';
import * as pushDeviceRepo from '../../repositories/pushDevice.js';
import type { RealtimeNotify } from '../../types/chat.js';
import { pushSettings, toPublicConfig } from './config.js';
import { createPushDispatcher } from './dispatch.js';
import { createFcmSender } from './fcm.js';
import { createThrottle } from './throttle.js';

export { registerDevice, removeAllDevices, removeDevice } from './devices.js';

export const getPublicConfig = () => toPublicConfig(pushSettings);

const dispatcher = pushSettings
  ? createPushDispatcher({
      enabled: true,
      sender: createFcmSender(pushSettings),
      throttle: createThrottle(),
      loadChat: async (chatId) => {
        const chat = await chatRepo.findByIdLean(chatId);
        return chat
          ? {
              members: chat.members.map(String),
              groupChat: chat.groupChat,
              name: chat.name,
            }
          : null;
      },
      loadTokens: pushDeviceRepo.findTokensByUserIds,
      removeTokens: pushDeviceRepo.deleteByTokens,
    })
  : null;

/**
 * Push for notifications that carry a `push` intent. No-op when FCM is not
 * configured. `isOnline` is passed in (not imported) so presence can call this
 * without an import cycle.
 */
export const sendPushIntents = (
  notifications: RealtimeNotify[],
  isOnline: (userId: string) => boolean
): void => {
  if (!dispatcher || !notifications.some((n) => n.push)) return;
  void dispatcher.dispatch(notifications, isOnline);
};
