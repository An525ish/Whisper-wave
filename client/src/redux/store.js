import { configureStore } from '@reduxjs/toolkit';
import auth from './reducers/auth';
import api from './reducers/apis/api';

const store = configureStore({
  reducer: {
    [auth.name]: auth.reducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (prev) => [...prev(), api.middleware],
});

export default store;
