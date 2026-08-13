export const queryKeys = {
  profile: ['profile'] as const,
  chats: ['chats'] as const,
  chatDetails: (id: string, populate?: boolean) =>
    ['chatDetails', id, populate ?? false] as const,
  friends: (chatId?: string) => ['friends', chatId ?? 'all'] as const,
  messages: (chatId: string) => ['messages', chatId] as const,
  searchUsers: (name: string) => ['searchUsers', name] as const,
  notifications: ['friendNotifications'] as const,
  media: (chatId: string) => ['media', chatId] as const,
  messageSearch: (
    chatId: string,
    q: string,
    scope: string,
    from: string,
    dateFrom = '',
    dateTo = '',
    senderId = '',
  ) =>
    [
      'messageSearch',
      chatId,
      q,
      scope,
      from,
      dateFrom,
      dateTo,
      senderId,
    ] as const,
  activeMessageDates: (
    chatId: string,
    dateFrom: string,
    dateTo: string,
    tz: string,
  ) => ['activeMessageDates', chatId, dateFrom, dateTo, tz] as const,
};
