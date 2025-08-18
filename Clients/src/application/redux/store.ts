import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import uiSlice from "./ui/uiSlice";
import authReducer from "./auth/authSlice";
import fileReducer from "./file/fileSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "ui"], // Persist both auth and ui state
};

const rootReducer = combineReducers({
  ui: uiSlice,
  auth: authReducer,
  files: fileReducer, //file slice
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/REGISTER",
          "persist/PURGE",
          "persist/FLUSH",
        ],
      },
    }),
});

export const persistor = persistStore(store);
