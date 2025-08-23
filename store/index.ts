import { configureStore } from '@reduxjs/toolkit';
import logsReducer from './logsSlice';
import userProfileReducer from './userProfileSlice';

export const store = configureStore({
  reducer: {
    logs: logsReducer,
    userProfile: userProfileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;