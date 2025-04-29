import { configureStore } from '@reduxjs/toolkit';
import logsReducer from './logsSlice';
// import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    logs: logsReducer,
    // auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;