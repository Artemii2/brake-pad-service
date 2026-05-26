import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { parseIsModeratorFromToken, parseUsernameFromToken } from "../utils/jwt";

export interface UserState {
  username: string;
  isAuthenticated: boolean;
  isModerator: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  username: "",
  isAuthenticated: false,
  isModerator: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) state.error = null;
    },
    setAuthError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setUserSession: (state, action: PayloadAction<{ username: string }>) => {
      state.loading = false;
      state.error = null;
      state.isAuthenticated = true;
      state.username = action.payload.username;
      const token = localStorage.getItem("token") ?? "";
      state.isModerator = parseIsModeratorFromToken(token);
    },
    restoreUserFromToken: (state) => {
      const token = localStorage.getItem("token");
      if (!token) return;
      const username = parseUsernameFromToken(token);
      if (!username) return;
      state.isAuthenticated = true;
      state.username = username;
      state.isModerator = parseIsModeratorFromToken(token);
      state.loading = false;
      state.error = null;
    },
    clearUserSession: () => ({ ...initialState }),
  },
});

export const {
  clearUserError,
  setAuthLoading,
  setAuthError,
  setUserSession,
  restoreUserFromToken,
  clearUserSession,
} = userSlice.actions;

export default userSlice.reducer;
