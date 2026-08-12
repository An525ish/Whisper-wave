import { api } from '@/api/client';

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
  adminMe: ['adminMe'] as const,
  adminStats: ['adminStats'] as const,
  adminUsers: ['adminUsers'] as const,
  adminMessages: ['adminMessages'] as const,
  adminGroups: ['adminGroups'] as const,
};

export const getMyChats = () => api.get('/chat/get-my-chats');

export const getChatDetails = (params: { id: string; populate?: boolean }) =>
  api.get('/chat/get-chat-details', {
    id: params.id,
    populate: params.populate,
  });

export const getMyFriends = (params?: { chatId?: string }) =>
  api.get('/friend-request/get-my-friends', { chatId: params?.chatId });

export const getMessages = (chatId: string, page: number) =>
  api.get(`/message/get-messages/${chatId}`, { page });

export const searchMessages = (params: {
  chatId: string;
  q?: string;
  scope?: 'all' | 'text' | 'media' | 'links';
  from?: 'anyone' | 'me' | 'others';
  dateFrom?: string;
  dateTo?: string;
  senderId?: string;
}) =>
  api.get(`/message/search/${params.chatId}`, {
    q: params.q ?? '',
    scope: params.scope ?? 'all',
    from: params.from ?? 'anyone',
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    senderId: params.senderId,
  });

export const jumpToDate = (params: {
  chatId: string;
  dateFrom: string;
  dateTo?: string;
}) =>
  api.get(`/message/jump-date/${params.chatId}`, {
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

export const listActiveDates = (params: {
  chatId: string;
  dateFrom: string;
  dateTo: string;
  tz?: string;
}) =>
  api.get(`/message/active-dates/${params.chatId}`, {
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    tz: params.tz,
  });

export const searchUser = (name: string) =>
  api.get('/user/search-user', { name });

export const getMyNotifications = () =>
  api.get('/friend-request/get-notifications');

export const getMedia = (chatId: string) =>
  api.get(`/chat/get-media/${chatId}`);

export const markChatRead = (
  chatId: string,
  body?: { lastReadMessageId?: string },
) => api.put(`/chat/${chatId}/read`, body ?? {});

export const sendFriendRequest = (receiverId: unknown) =>
  api.post('/friend-request/send-request', receiverId);

export const handleFriendRequest = (body: unknown) =>
  api.put('/friend-request/handle-request', body);

export const sendAttachments = (body: FormData) =>
  api.post('/message/send-attachments', body);

export const findChats = (body: unknown) =>
  api.post('/chat/find-users', body);

export const createGroup = (body: { name: string; members: string[] }) =>
  api.post('/chat/create-group', body);

export const addMembers = (chatId: string, members: string[]) =>
  api.put(`/chat/add-members/${chatId}`, { members });

export const removeMember = (chatId: string, memberToBeRemoved: string) =>
  api.put(`/chat/remove-member/${chatId}`, { memberToBeRemoved });

export const leaveGroup = (chatId: string) =>
  api.delete(`/chat/leave-group/${chatId}`);
