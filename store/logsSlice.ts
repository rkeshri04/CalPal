import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch } from './index';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';

export type LogEntry = {
  id: string;
  name: string;
  image?: string;
  barcode: string;
  cost: number;
  weight: number;
  calories?: number;
  fat?: number;
  carbs?: number;
  protein?: number;
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

// Load logs from Supabase for the current user
export const loadLogsFromSupabase = (session: Session) => async (dispatch: AppDispatch) => {
  if (!session?.user?.id) return;
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', session.user.id)
    .order('date', { ascending: false });
  if (!error && data) {
    dispatch(setLogs(data));
  }
};

// Save a new log to Supabase for the current user
export const saveLogToSupabase = (log: Omit<LogEntry, 'id'>, session: Session) => async (dispatch: AppDispatch) => {
  if (!session?.user?.id) return;
  const { data, error } = await supabase
    .from('food_logs')
    .insert([{ ...log, user_id: session.user.id }])
    .select();
  if (!error && data && data[0]) {
    dispatch(addLog(data[0]));
  }
};