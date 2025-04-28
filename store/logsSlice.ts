import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { AppDispatch } from './index';

const LOGS_KEY = 'logs';

export type LogEntry = {
  id: string;
  name: string;
  image?: string;
  barcode: string;
  cost: number;
  weight: number;
  date: string;
};

interface LogsState {
  entries: LogEntry[];
}

const initialState: LogsState = {
  entries: [],
};

const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    addLog(state, action: PayloadAction<LogEntry>) {
      state.entries.unshift(action.payload);
    },
    setLogs(state, action: PayloadAction<LogEntry[]>) {
      state.entries = action.payload;
    },
    clearLogs(state) {
      state.entries = [];
    },
  },
});

export const { addLog, setLogs, clearLogs } = logsSlice.actions;
export default logsSlice.reducer;

export const loadLogsFromStorage = () => async (dispatch: AppDispatch) => {
  const data = await SecureStore.getItemAsync(LOGS_KEY);
  if (data) {
    try {
      const logs = JSON.parse(data);
      dispatch(setLogs(logs));
    } catch {}
  }
};

export const saveLogsToStorage = (logs: LogEntry[]) => {
  return SecureStore.setItemAsync(LOGS_KEY, JSON.stringify(logs));
};