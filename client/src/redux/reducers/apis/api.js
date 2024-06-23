import { BASE_URL } from '@/lib/constants';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/api` }),
  tagTypes: ['chat', 'chatDetails'],

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
  }),
});

export const {
  useMyChatsQuery,
  useChatDetailsQuery,
  useLazyMyFriendsQuery,
  useMyFriendsQuery,
  useGetMessagesQuery,
} = api;

export default api;
