import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MessageNotification, RequestNotification } from '@/types';

type NotificationsState = {
  totalNotificationCount: number;
  messageNotificationCount: number;
  requestNotificationCount: number;
  messageNotifications: MessageNotification[];
  requestNotifications: RequestNotification[];
  resetMessageNotification: () => void;
  resetRequestNotification: () => void;
  /** Replace message unread badges from server chat list (source of truth). */
  syncMessageNotificationsFromServer: (
    items: Array<{ chatId: string; count: number }>,
  ) => void;
  addMessageNotification: (payload: {
    chatId: string;
    name?: string;
    avatar?: string;
    timestamp?: string | number;
  }) => void;
  removeMessageNotification: (payload: { chatId: string }) => void;
  addRequestNotification: (payload?: RequestNotification) => void;
  removeRequestNotification: (payload: { id: string }) => void;
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      totalNotificationCount: 0,
      messageNotificationCount: 0,
      requestNotificationCount: 0,
      messageNotifications: [],
      requestNotifications: [],

      resetMessageNotification: () => {
        const { totalNotificationCount, messageNotificationCount } = get();
        set({
          totalNotificationCount: Math.max(
            totalNotificationCount - messageNotificationCount,
            0,
          ),
          messageNotificationCount: 0,
          messageNotifications: [],
        });
      },

      resetRequestNotification: () => {
        const { totalNotificationCount, requestNotificationCount } = get();
        set({
          totalNotificationCount: Math.max(
            totalNotificationCount - requestNotificationCount,
            0,
          ),
          requestNotificationCount: 0,
        });
      },

      syncMessageNotificationsFromServer: (items) => {
        const { requestNotificationCount } = get();
        const messageNotifications = items
          .filter((item) => item.count > 0)
          .map((item) => ({
            chatId: item.chatId,
            count: item.count,
          }));
        const messageNotificationCount = messageNotifications.reduce(
          (sum, n) => sum + n.count,
          0,
        );

        set({
          messageNotifications,
          messageNotificationCount,
          totalNotificationCount:
            messageNotificationCount + requestNotificationCount,
        });
      },

      addMessageNotification: ({ chatId, name, avatar, timestamp }) => {
        const { messageNotifications } = get();
        const existing = messageNotifications.find((n) => n.chatId === chatId);
        const next = existing
          ? messageNotifications.map((n) =>
              n.chatId === chatId
                ? { ...n, count: n.count + 1, timestamp }
                : n,
            )
          : [
              ...messageNotifications,
              { chatId, name, avatar, count: 1, timestamp },
            ];

        set((state) => ({
          messageNotifications: next,
          messageNotificationCount: state.messageNotificationCount + 1,
          totalNotificationCount: state.totalNotificationCount + 1,
        }));
      },

      removeMessageNotification: ({ chatId }) => {
        const notification = get().messageNotifications.find(
          (n) => n.chatId === chatId,
        );
        if (!notification) return;

        set((state) => ({
          messageNotifications: state.messageNotifications.filter(
            (n) => n.chatId !== chatId,
          ),
          messageNotificationCount: Math.max(
            state.messageNotificationCount - notification.count,
            0,
          ),
          totalNotificationCount: Math.max(
            state.totalNotificationCount - notification.count,
            0,
          ),
        }));
      },

      addRequestNotification: (payload) => {
        set((state) => ({
          requestNotifications: payload
            ? [...state.requestNotifications, payload]
            : state.requestNotifications,
          requestNotificationCount: state.requestNotificationCount + 1,
          totalNotificationCount: state.totalNotificationCount + 1,
        }));
      },

      removeRequestNotification: ({ id }) => {
        set((state) => ({
          requestNotifications: state.requestNotifications.filter(
            (r) => r.id !== id,
          ),
          requestNotificationCount: Math.max(
            state.requestNotificationCount - 1,
            0,
          ),
          totalNotificationCount: Math.max(
            state.totalNotificationCount - 1,
            0,
          ),
        }));
      },
    }),
    {
      name: 'ww-notifications',
      partialize: (state) => ({
        totalNotificationCount: state.totalNotificationCount,
        messageNotificationCount: state.messageNotificationCount,
        requestNotificationCount: state.requestNotificationCount,
        messageNotifications: state.messageNotifications,
        requestNotifications: state.requestNotifications,
      }),
    },
  ),
);
