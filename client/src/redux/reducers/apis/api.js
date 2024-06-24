import { BASE_URL } from '@/lib/constants';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/api` }),
  tagTypes: ['chat', 'chatDetails', 'users', 'messages'],

  endpoints: (builder) => ({
    myChats: builder.query({
      query: () => ({
        url: '/chat/get-my-chats',
        credentials: 'include',
      }),
      providesTags: ['chat'],
    }),
    chatDetails: builder.query({
      query: ({ populate, id }) => ({
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
      providesTags: ['chatDetails'],
    }),
    getMessages: builder.query({
      query: ({ chatId }) => ({
        url: `/message/get-messages/${chatId}`,
        credentials: 'include',
      }),
      providesTags: ['messages'],
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
} = api;

export default api;
