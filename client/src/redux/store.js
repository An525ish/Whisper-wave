import { configureStore } from '@reduxjs/toolkit';
import auth from './reducers/auth';
import api from './reducers/apis/api';
import chat from './reducers/chat';

const store = configureStore({
  reducer: {
    [auth.name]: auth.reducer,
    [api.reducerPath]: api.reducer,
    [chat.name]: chat.reducer,
  },
  middleware: (prev) => [...prev(), api.middleware],
});

export default store;
