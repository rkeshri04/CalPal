import { configureStore } from '@reduxjs/toolkit';
import logsReducer from './logsSlice';
import userProfileReducer from './userProfileSlice';
// import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    logs: logsReducer,
    userProfile: userProfileReducer,
    // auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;