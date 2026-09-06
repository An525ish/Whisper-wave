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

export const getMessageContext = (chatId: string, messageId: string) =>
  api.get(`/message/context/${chatId}/${messageId}`);

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

export const sendFriendRequest = (body: { receiverId: string }) =>
  api.post('/friend-request/send-request', body);

export const handleFriendRequest = (body: { requestId: string; accept: boolean }) =>
  api.put('/friend-request/handle-request', body);

export type CommitAttachmentsBody = {
  chatId: string;
  content?: string;
  replyToMessageId?: string;
  attachments: Array<{ key: string; originalName: string; mimeType: string; isHd?: boolean }>;
};

export const commitAttachments = (body: CommitAttachmentsBody) =>
  api.post('/message/send-attachments', body);

export const sendGif = (body: {
  chatId: string;
  gifId: string;
  gifUrl: string;
  gifTitle?: string;
  /** Server accepts only these MIME types — matches sendGifSchema validator */
  mimeType?: 'image/gif' | 'image/png' | 'image/webp' | 'image/jpeg';
  kind?: 'gif' | 'meme';
  replyToMessageId?: string;
}) => api.post('/message/send-gif', body);

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

export const leaveGroup = (chatId: string, body?: { newCreatorId?: string }) =>
  api.delete(`/chat/leave-group/${chatId}`, body ?? {});

export const deleteChatForMe = (chatId: string) =>
  api.delete(`/chat/${chatId}/for-me`);

export const clearChatForMe = (chatId: string) =>
  api.delete(`/chat/${chatId}/clear-for-me`);

export const unfriend = (chatId: string) =>
  api.delete(`/friend-request/unfriend/${chatId}`);

export const deleteGroup = (chatId: string) =>
  api.delete(`/chat/delete-group/${chatId}`);

export const getMessageReceipts = (messageId: string) =>
  api.get(`/message/receipts/${messageId}`);
