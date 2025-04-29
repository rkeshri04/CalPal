import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';

export interface BmiEntry {
  date: string;
  bmi: number;
  weight: number;
  height: number;
}

export interface UserProfile {
  age: number;
  height: number;
  weight: number;
  bmiHistory: BmiEntry[];
  lastPrompt: string;
  unitSystem: 'us' | 'metric'; // <-- add this line
}

interface UserProfileState {
  profile: UserProfile | null;
}

const initialState: UserProfileState = {
  profile: null,
};

const PROFILE_KEY = 'userProfile';

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    setUserProfile(state, action: PayloadAction<UserProfile>) {
      state.profile = action.payload;
    },
    addBmiEntry(state, action: PayloadAction<BmiEntry>) {
      if (state.profile) {
        state.profile.bmiHistory.push(action.payload);
        state.profile.weight = action.payload.weight;
        state.profile.height = action.payload.height;
      }
    },
    setLastPrompt(state, action: PayloadAction<string>) {
      if (state.profile) {
        state.profile.lastPrompt = action.payload;
      }
    },
  },
});

export const { setUserProfile, addBmiEntry, setLastPrompt } = userProfileSlice.actions;
export default userProfileSlice.reducer;

export const loadUserProfileFromStorage = () => async (dispatch: any) => {
  const data = await SecureStore.getItemAsync(PROFILE_KEY);
  if (data) {
    try {
      const profile = JSON.parse(data);
      dispatch(setUserProfile(profile));
    } catch {}
  }
};

export const saveUserProfileToStorage = (profile: UserProfile) => {
  return SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
};
