import { BASE_URL } from '@/lib/constants';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/api` }),
  tagTypes: [
    'chat',
    'chatDetails',
    'myFriends',
    'users',
    'messages',
    'tempUsers',
  ],

  endpoints: (builder) => ({
    myChats: builder.query({
      query: () => ({
        url: '/chat/get-my-chats',
        credentials: 'include',
      }),
      providesTags: ['chat'],
    }),
    chatDetails: builder.query({
      query: ({ populate = false, id }) => ({
        url: '/chat/get-chat-details',
        credentials: 'include',
        params: { populate, id },
      }),
      providesTags: ['chatDetails'],
      invalidatesTags: ['messages'],
    }),
    myFriends: builder.query({
      query: ({ chatId }) => ({
        url: '/friend-request/get-my-friends',
        credentials: 'include',
        params: { chatId },
      }),
      providesTags: ['myFriends'],
    }),
    getMessages: builder.query({
      query: ({ chatId, page }) => ({
        url: `/message/get-messages/${chatId}`,
        credentials: 'include',
        params: { page },
      }),
      keepUnusedDataFor: 0,
    }),
    searchUser: builder.query({
      query: ({ name }) => ({
        url: `/user/search-user`,
        credentials: 'include',
        params: { name },
      }),
      providesTags: ['users'],
    }),
    sendFriendRequest: builder.mutation({
      query: (receiverId) => ({
        url: `/friend-request/send-request`,
        method: 'POST',
        credentials: 'include',
        body: receiverId,
      }),
      invalidatesTags: ['users'],
    }),
    getMyNotifications: builder.query({
      query: () => ({
        url: `/friend-request/get-notifications`,
        credentials: 'include',
      }),
      invalidatesTags: ['notifications'],
      keepUnusedDataFor: 0,
    }),
    handleFriendRequest: builder.mutation({
      query: (body) => ({
        url: `/friend-request/handle-request`,
        method: 'PUT',
        credentials: 'include',
        body: body,
      }),
      invalidatesTags: ['chats', 'users', 'notifications'],
    }),
    sendAttachments: builder.mutation({
      query: (body) => ({
        url: `/message/send-attachments`,
        method: 'POST',
        credentials: 'include',
        body: body,
      }),
    }),
    findChats: builder.mutation({
      query: (body) => ({
        url: '/chat/find-users',
        method: 'POST',
        credentials: 'include',
        body: body,
      }),
      providesTags: ['tempUsers'],
    }),
    createGroup: builder.mutation({
      query: ({ name, members }) => ({
        url: '/chat/create-group',
        method: 'POST',
        credentials: 'include',
        body: { name, members },
      }),
    }),
    addMember: builder.mutation({
      query: ({ chatId, members }) => ({
        url: `/chat/add-members/${chatId}`,
        method: 'PUT',
        credentials: 'include',
        body: { members },
      }),
      invalidatesTags: ['chatDetails', 'myFriends'],
    }),
    removeMember: builder.mutation({
      query: ({ chatId, memberToBeRemoved }) => ({
        url: `/chat/remove-member/${chatId}`,
        method: 'PUT',
        credentials: 'include',
        body: { memberToBeRemoved },
      }),
      invalidatesTags: ['chatDetails', 'myFriends'],
    }),
    leaveGroup: builder.mutation({
      query: ({ chatId }) => ({
        url: `/chat/leave-group/${chatId}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: ['chatDetails', 'myFriends'],
    }),
  }),
});

export const {
  useMyChatsQuery,
  useChatDetailsQuery,
  useLazySearchUserQuery,
  useMyFriendsQuery,
  useGetMessagesQuery,
  useSendFriendRequestMutation,
  useGetMyNotificationsQuery,
  useHandleFriendRequestMutation,
  useSendAttachmentsMutation,
  useFindChatsMutation,
  useCreateGroupMutation,
  useAddMemberMutation,
  useRemoveMemberMutation,
  useLeaveGroupMutation,
} = api;

export default api;
