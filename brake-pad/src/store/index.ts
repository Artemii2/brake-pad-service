import { configureStore } from "@reduxjs/toolkit";
import brakeWearApplicationReducer from "./slices/brakeWearApplicationSlice";
import userReducer from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    brakeWearApplication: brakeWearApplicationReducer,
  },
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
