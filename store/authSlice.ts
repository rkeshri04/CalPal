// import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
// import { supabase } from '../supabaseClient';

// export interface AuthState {
//   session: any | null;
//   loading: boolean;
//   error: string | null;
// }

// const initialState: AuthState = {
//   session: null,
//   loading: false,
//   error: null,
// };

// export const restoreSession = createAsyncThunk('auth/restoreSession', async (_, { rejectWithValue }) => {
//   try {
//     const { data } = await supabase.auth.getSession();
//     return data.session || null;
//   } catch (e) {
//     return rejectWithValue('Failed to restore session');
//   }
// });

// export const login = createAsyncThunk('auth/login', async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
//   try {
//     const result = await supabase.auth.signInWithPassword({ email, password });
//     if (result.error) return rejectWithValue(result.error.message);
//     return result.data.session;
//   } catch (e) {
//     return rejectWithValue('Login failed');
//   }
// });

// export const logout = createAsyncThunk('auth/logout', async () => {
//   await supabase.auth.signOut();
//   return null;
// });

// const authSlice = createSlice({
//   name: 'auth',
//   initialState,
//   reducers: {
//     setSession(state, action: PayloadAction<any | null>) {
//       state.session = action.payload;
//     },
//   },
//   extraReducers: builder => {
//     builder
//       .addCase(restoreSession.pending, state => { state.loading = true; state.error = null; })
//       .addCase(restoreSession.fulfilled, (state, action) => { state.session = action.payload; state.loading = false; })
//       .addCase(restoreSession.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
//       .addCase(login.pending, state => { state.loading = true; state.error = null; })
//       .addCase(login.fulfilled, (state, action) => { state.session = action.payload; state.loading = false; })
//       .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
//       .addCase(logout.fulfilled, state => { state.session = null; state.loading = false; });
//   },
// });

// export const { setSession } = authSlice.actions;
// export default authSlice.reducer;
