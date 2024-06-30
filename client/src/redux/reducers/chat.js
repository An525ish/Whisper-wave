import { NEW_MESSAGE_ALERT, NEW_REQUEST } from '@/lib/socketConstants';
import { localStorageHandler } from '@/utils/helper';
import { createSlice } from '@reduxjs/toolkit';

const getInitialState = () => ({
  totalNotificationCount:
    localStorageHandler({ key: 'totalNotificationCount', get: true }) || 0,
  messageNotificationCount:
    localStorageHandler({ key: 'messageNotificationCount', get: true }) || 0,
  requestNotificationCount:
    localStorageHandler({ key: 'requestNotificationCount', get: true }) || 0,
  messageNotifications:
    localStorageHandler({ key: NEW_MESSAGE_ALERT, get: true }) || [],
  requestNotifications:
    localStorageHandler({ key: NEW_REQUEST, get: true }) || [],
});

const initialState = getInitialState();

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // incrementTotalNotification: (state) => {
    //   state.totalNotificationCount += 1;
    //   localStorageHandler({
    //     key: 'totalNotificationCount',
    //     value: state.totalNotificationCount,
    //   });
    // },
    // decrementTotalNotification: (state) => {
    //   state.totalNotificationCount = Math.max(
    //     state.totalNotificationCount - 1,
    //     0
    //   );
    //   localStorageHandler({
    //     key: 'totalNotificationCount',
    //     value: state.totalNotificationCount,
    //   });
    // },
    // resetTotalNotification: (state) => {
    //   state.totalNotificationCount = 0;
    //   localStorageHandler({
    //     key: 'totalNotificationCount',
    //     value: 0,
    //   });
    // },
    // incrementMessageNotification: (state) => {
    //   state.messageNotificationCount += 1;
    //   state.totalNotificationCount += 1;
    //   localStorageHandler({
    //     key: 'messageNotificationCount',
    //     value: state.messageNotificationCount,
    //   });
    //   localStorageHandler({
    //     key: 'totalNotificationCount',
    //     value: state.totalNotificationCount,
    //   });
    // },
    resetMessageNotification: (state) => {
      state.totalNotificationCount = Math.max(
        state.totalNotificationCount - state.messageNotificationCount,
        0
      );
      state.messageNotificationCount = 0;
      localStorageHandler({
        key: 'messageNotificationCount',
        value: 0,
      });
      localStorageHandler({
        key: 'totalNotificationCount',
        value: state.totalNotificationCount,
      });
    },
    // incrementRequestNotification: (state) => {
    //   state.requestNotificationCount += 1;
    //   state.totalNotificationCount += 1;
    //   localStorageHandler({
    //     key: 'requestNotificationCount',
    //     value: state.requestNotificationCount,
    //   });
    //   localStorageHandler({
    //     key: 'totalNotificationCount',
    //     value: state.totalNotificationCount,
    //   });
    // },
    resetRequestNotification: (state) => {
      state.totalNotificationCount = Math.max(
        state.totalNotificationCount - state.requestNotificationCount,
        0
      );
      state.requestNotificationCount = 0;
      localStorageHandler({
        key: 'requestNotificationCount',
        value: 0,
      });
      localStorageHandler({
        key: 'totalNotificationCount',
        value: state.totalNotificationCount,
      });
    },
    addMessageNotification: (state, action) => {
      const { chatId, name, avatar, timestamp } = action.payload;
      const existingNotification = state.messageNotifications.find(
        (notification) => notification.chatId === chatId
      );

      if (existingNotification) {
        existingNotification.count += 1;
        existingNotification.timestamp = timestamp;
      } else {
        state.messageNotifications.push({
          chatId,
          name,
          avatar,
          count: 1,
          timestamp,
        });
      }

      state.messageNotificationCount += 1;
      state.totalNotificationCount += 1;

      localStorageHandler({
        key: NEW_MESSAGE_ALERT,
        value: state.messageNotifications,
      });
      localStorageHandler({
        key: 'messageNotificationCount',
        value: state.messageNotificationCount,
      });
      localStorageHandler({
        key: 'totalNotificationCount',
        value: state.totalNotificationCount,
      });
    },
    removeMessageNotification: (state, action) => {
      const { chatId } = action.payload;
      const notificationToRemove = state.messageNotifications.find(
        (notification) => notification.chatId === chatId
      );

      if (notificationToRemove) {
        state.messageNotificationCount = Math.max(
          state.messageNotificationCount - notificationToRemove.count,
          0
        );
        state.totalNotificationCount = Math.max(
          state.totalNotificationCount - notificationToRemove.count,
          0
        );
        state.messageNotifications = state.messageNotifications.filter(
          (notification) => notification.chatId !== chatId
        );

        localStorageHandler({
          key: NEW_MESSAGE_ALERT,
          value: state.messageNotifications,
        });
        localStorageHandler({
          key: 'messageNotificationCount',
          value: state.messageNotificationCount,
        });
        localStorageHandler({
          key: 'totalNotificationCount',
          value: state.totalNotificationCount,
        });
      }
    },
    addRequestNotification: (state, action) => {
      state.requestNotifications.push(action.payload);
      state.requestNotificationCount += 1;
      state.totalNotificationCount += 1;

      localStorageHandler({
        key: NEW_REQUEST,
        value: state.requestNotifications,
      });
      localStorageHandler({
        key: 'requestNotificationCount',
        value: state.requestNotificationCount,
      });
      localStorageHandler({
        key: 'totalNotificationCount',
        value: state.totalNotificationCount,
      });
    },
    removeRequestNotification: (state, action) => {
      const { id } = action.payload;
      state.requestNotifications = state.requestNotifications.filter(
        (request) => request.id !== id
      );
      state.requestNotificationCount = Math.max(
        state.requestNotificationCount - 1,
        0
      );
      state.totalNotificationCount = Math.max(
        state.totalNotificationCount - 1,
        0
      );

      localStorageHandler({
        key: NEW_REQUEST,
        value: state.requestNotifications,
      });
      localStorageHandler({
        key: 'requestNotificationCount',
        value: state.requestNotificationCount,
      });
      localStorageHandler({
        key: 'totalNotificationCount',
        value: state.totalNotificationCount,
      });
    },
  },
});

export const {
  incrementTotalNotification,
  decrementTotalNotification,
  resetTotalNotification,
  incrementMessageNotification,
  resetMessageNotification,
  incrementRequestNotification,
  resetRequestNotification,
  addMessageNotification,
  removeMessageNotification,
  addRequestNotification,
  removeRequestNotification,
} = chatSlice.actions;

export default chatSlice;
