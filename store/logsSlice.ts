import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { database, Log } from '../db/database';

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
  localDate?: string;
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

export const loadLogsFromStorage = () => async (dispatch: any) => {
  try {
    const logs = await database.get<Log>('logs').query().fetch();
    const logEntries: LogEntry[] = logs.map(log => ({
      id: log.id,
      name: log.name,
      image: log.image,
      barcode: log.barcode,
      cost: log.cost,
      weight: log.weight,
      calories: log.calories,
      fat: log.fat,
      carbs: log.carbs,
      protein: log.protein,
      date: log.date,
      localDate: log.localDate,
    }));
    dispatch(setLogs(logEntries));
  } catch (error) {
    console.error('Error loading logs from WatermelonDB:', error);
  }
};

export const saveLogsToStorage = async (logs: LogEntry[]) => {
  try {
    await database.write(async () => {
      const logCollection = database.get<Log>('logs');
      // Clear existing logs
      const existingLogs = await logCollection.query().fetch();
      for (const log of existingLogs) {
        await log.destroyPermanently();
      }
      // Insert new logs
      for (const log of logs) {
        await logCollection.create(entry => {
          entry._raw.id = log.id;
          entry.name = log.name;
          entry.image = log.image;
          entry.barcode = log.barcode;
          entry.cost = log.cost;
          entry.weight = log.weight;
          entry.calories = log.calories;
          entry.fat = log.fat;
          entry.carbs = log.carbs;
          entry.protein = log.protein;
          entry.date = log.date;
          entry.localDate = log.localDate;
        });
      }
    });
  } catch (error) {
    console.error('Error saving logs to WatermelonDB:', error);
  }
};