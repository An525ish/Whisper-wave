import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MessageNotification, RequestNotification } from '@/types';

type NotificationsState = {
  messageNotificationCount: number;
  requestNotificationCount: number;
  messageNotifications: MessageNotification[];
  requestNotifications: RequestNotification[];
  dismissedMessageCounts: Record<string, number>;
  resetMessageNotification: () => void;
  resetRequestNotification: () => void;
  /** Dismiss the inbox only — does not mark chats as read. */
  clearMessageNotifications: () => void;
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
  /** Sync request notification count from server on startup. */
  syncRequestNotificationsFromServer: (count: number) => void;
};

/** Derived — always msg + req. Use this selector instead of a stored total. */
export const selectTotalNotificationCount = (s: NotificationsState) =>
  s.messageNotificationCount + s.requestNotificationCount;

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      messageNotificationCount: 0,
      requestNotificationCount: 0,
      messageNotifications: [],
      requestNotifications: [],
      dismissedMessageCounts: {},

      resetMessageNotification: () => {
        set({
          messageNotificationCount: 0,
          messageNotifications: [],
          dismissedMessageCounts: {},
        });
      },

      clearMessageNotifications: () => {
        const { messageNotifications } = get();
        const dismissedMessageCounts = { ...(get().dismissedMessageCounts ?? {}) };
        for (const notification of messageNotifications) {
          dismissedMessageCounts[notification.chatId] = Math.max(
            dismissedMessageCounts[notification.chatId] ?? 0,
            notification.count,
          );
        }
        set({
          dismissedMessageCounts,
          messageNotifications: [],
          messageNotificationCount: 0,
        });
      },

      resetRequestNotification: () => {
        set({ requestNotificationCount: 0 });
      },

      syncMessageNotificationsFromServer: (items) => {
        const { dismissedMessageCounts } = get();
        const nextDismissed = { ...(dismissedMessageCounts ?? {}) };
        const messageNotifications = items
          .filter((item) => item.count > 0)
          .filter((item) => {
            const dismissed = nextDismissed[item.chatId] ?? 0;
            if (item.count > dismissed) {
              delete nextDismissed[item.chatId];
              return true;
            }
            return false;
          })
          .map((item) => ({ chatId: item.chatId, count: item.count }));

        for (const item of items) {
          if (item.count === 0) delete nextDismissed[item.chatId];
        }

        const messageNotificationCount = messageNotifications.reduce(
          (sum, n) => sum + n.count,
          0,
        );

        set({ dismissedMessageCounts: nextDismissed, messageNotifications, messageNotificationCount });
      },

      addMessageNotification: ({ chatId, name, avatar, timestamp }) => {
        const { messageNotifications, dismissedMessageCounts } = get();
        const nextDismissed = { ...(dismissedMessageCounts ?? {}) };
        delete nextDismissed[chatId];
        const existing = messageNotifications.find((n) => n.chatId === chatId);
        const next = existing
          ? messageNotifications.map((n) =>
              n.chatId === chatId ? { ...n, count: n.count + 1, timestamp } : n,
            )
          : [...messageNotifications, { chatId, name, avatar, count: 1, timestamp }];

        set((state) => ({
          dismissedMessageCounts: nextDismissed,
          messageNotifications: next,
          messageNotificationCount: state.messageNotificationCount + 1,
        }));
      },

      removeMessageNotification: ({ chatId }) => {
        const notification = get().messageNotifications.find((n) => n.chatId === chatId);
        const nextDismissed = { ...(get().dismissedMessageCounts ?? {}) };
        delete nextDismissed[chatId];
        if (!notification) {
          set({ dismissedMessageCounts: nextDismissed });
          return;
        }

        set((state) => ({
          dismissedMessageCounts: nextDismissed,
          messageNotifications: state.messageNotifications.filter((n) => n.chatId !== chatId),
          messageNotificationCount: Math.max(state.messageNotificationCount - notification.count, 0),
        }));
      },

      syncRequestNotificationsFromServer: (count) => {
        set({ requestNotificationCount: count });
      },

      addRequestNotification: (payload) => {
        set((state) => ({
          requestNotifications: payload
            ? [...state.requestNotifications, payload]
            : state.requestNotifications,
          requestNotificationCount: state.requestNotificationCount + 1,
        }));
      },

      removeRequestNotification: ({ id }) => {
        set((state) => ({
          requestNotifications: state.requestNotifications.filter((r) => r.id !== id),
          requestNotificationCount: Math.max(state.requestNotificationCount - 1, 0),
        }));
      },
    }),
    {
      name: 'ww-notifications',
      partialize: (state) => ({
        messageNotificationCount: state.messageNotificationCount,
        requestNotificationCount: state.requestNotificationCount,
        messageNotifications: state.messageNotifications,
        requestNotifications: state.requestNotifications,
        dismissedMessageCounts: state.dismissedMessageCounts,
      }),
    },
  ),
);
