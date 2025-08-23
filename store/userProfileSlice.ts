import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { database, UserProfile } from '../db/database';

export interface BmiEntry {
  date: string;
  bmi: number;
  weight: number;
  height: number;
}

export interface UserProfileData {
  age: number;
  height: number;
  weight: number;
  bmiHistory: BmiEntry[];
  lastPrompt: string;
  unitSystem: 'us' | 'metric';
}

interface UserProfileState {
  profile: UserProfileData | null;
}

const initialState: UserProfileState = {
  profile: null,
};

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    setUserProfile(state, action: PayloadAction<UserProfileData>) {
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
  try {
    const profileCollection = database.get<UserProfile>('user_profiles');
    const profiles = await profileCollection.query().fetch();
    if (profiles.length > 0) {
      const profile = profiles[0];
      dispatch(setUserProfile({
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        unitSystem: profile.unitSystem,
        bmiHistory: profile.bmiHistory,
        lastPrompt: profile.lastPrompt,
      }));
    }
  } catch (error) {
    console.error('Error loading user profile from WatermelonDB:', error);
  }
};

export const saveUserProfileToStorage = (profile: UserProfileData) => async () => {
  try {
    await database.write(async () => {
      const profileCollection = database.get<UserProfile>('user_profiles');
      const profiles = await profileCollection.query().fetch();
      if (profiles.length > 0) {
        // Update existing profile
        await profiles[0].update((userProfile: UserProfile) => {
          userProfile.age = profile.age;
          userProfile.height = profile.height;
          userProfile.weight = profile.weight;
          userProfile.unitSystem = profile.unitSystem;
          userProfile.bmiHistory = profile.bmiHistory;
          userProfile.lastPrompt = profile.lastPrompt;
        });
      } else {
        // Create new profile
        await profileCollection.create((userProfile: UserProfile) => {
          userProfile.age = profile.age;
          userProfile.height = profile.height;
          userProfile.weight = profile.weight;
          userProfile.unitSystem = profile.unitSystem;
          userProfile.bmiHistory = profile.bmiHistory;
          userProfile.lastPrompt = profile.lastPrompt;
        });
      }
    });
  } catch (error) {
    console.error('Error saving user profile to WatermelonDB:', error);
  }
};