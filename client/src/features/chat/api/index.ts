import { api } from '@/api/client';

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

export const markAllChatsRead = () => api.put('/chat/read-all');

export const sendFriendRequest = (receiverId: unknown) =>
  api.post('/friend-request/send-request', receiverId);

export const handleFriendRequest = (body: unknown) =>
  api.put('/friend-request/handle-request', body);

export const sendAttachments = (body: FormData) =>
  api.post('/message/send-attachments', body);

export const editMessage = (messageId: string, content: string) =>
  api.patch(`/message/${messageId}`, { content });

export const deleteMessage = (messageId: string) =>
  api.delete(`/message/${messageId}`);

export const deleteManyMessages = (chatId: string, messageIds: string[]) =>
  api.post(`/message/delete-many/${chatId}`, { messageIds });

export const clearChatMessages = (chatId: string) =>
  api.delete(`/message/clear/${chatId}`);

export const forwardMessages = (
  targetChatId: string,
  body: { sourceChatId: string; messageIds: string[] },
) => api.post(`/message/forward/${targetChatId}`, body);

export const findChats = (body: unknown) =>
  api.post('/chat/find-users', body);

export const createGroup = (
  body: FormData | { name: string; members: string[]; bio?: string },
) => api.post('/chat/create-group', body);

export const updateGroupDetails = (chatId: string, body: FormData) =>
  api.put(`/chat/update-group-details/${chatId}`, body);

export const addMembers = (chatId: string, members: string[]) =>
  api.put(`/chat/add-members/${chatId}`, { members });

export const removeMember = (chatId: string, memberToBeRemoved: string) =>
  api.put(`/chat/remove-member/${chatId}`, { memberToBeRemoved });

export const setMemberAdmin = (
  chatId: string,
  body: { memberId: string; makeAdmin: boolean },
) => api.put(`/chat/set-admin/${chatId}`, body);

export const leaveGroup = (chatId: string) =>
  api.delete(`/chat/leave-group/${chatId}`);
