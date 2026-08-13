import { create } from 'zustand';

type PresenceState = {
  onlineUserIds: string[];
  lastSeenByUserId: Record<string, string>;
  typingChatIds: Record<string, boolean>;
  setOnlineUsers: (userIds: string[]) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string, lastSeen?: string | null) => void;
  setUserLastSeen: (userId: string, lastSeen?: string | null) => void;
  setChatTyping: (chatId: string, isTyping: boolean) => void;
  isUserOnline: (userId?: string | null) => boolean;
  isChatTyping: (chatId?: string | null) => boolean;
  getLastSeen: (userId?: string | null) => string | null;
};

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUserIds: [],
  lastSeenByUserId: {},
  typingChatIds: {},

  setOnlineUsers: (userIds) => {
    set({
      onlineUserIds: [...new Set(userIds.map(String))],
    });
  },

  setUserOnline: (userId) => {
    const id = String(userId);
    set((state) =>
      state.onlineUserIds.includes(id)
        ? state
        : { onlineUserIds: [...state.onlineUserIds, id] },
    );
  },

  setUserOffline: (userId, lastSeen) => {
    const id = String(userId);
    set((state) => {
      const onlineUserIds = state.onlineUserIds.filter((uid) => uid !== id);
      if (!lastSeen) return { onlineUserIds };
      return {
        onlineUserIds,
        lastSeenByUserId: {
          ...state.lastSeenByUserId,
          [id]: lastSeen,
        },
      };
    });
  },

  setUserLastSeen: (userId, lastSeen) => {
    if (!userId || !lastSeen) return;
    const id = String(userId);
    set((state) => {
      if (state.lastSeenByUserId[id] === lastSeen) return state;
      return {
        lastSeenByUserId: {
          ...state.lastSeenByUserId,
          [id]: lastSeen,
        },
      };
    });
  },

  setChatTyping: (chatId, isTyping) => {
    const id = String(chatId);
    set((state) => {
      if (!isTyping) {
        if (!state.typingChatIds[id]) return state;
        const next = { ...state.typingChatIds };
        delete next[id];
        return { typingChatIds: next };
      }
      if (state.typingChatIds[id]) return state;
      return { typingChatIds: { ...state.typingChatIds, [id]: true } };
    });
  },

  isUserOnline: (userId) => {
    if (!userId) return false;
    return get().onlineUserIds.includes(String(userId));
  },

  isChatTyping: (chatId) => {
    if (!chatId) return false;
    return Boolean(get().typingChatIds[String(chatId)]);
  },

  getLastSeen: (userId) => {
    if (!userId) return null;
    return get().lastSeenByUserId[String(userId)] ?? null;
  },
}));
