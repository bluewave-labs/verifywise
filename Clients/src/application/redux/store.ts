import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import uiSlice from "./ui/uiSlice";
import authReducer from "./auth/authSlice";
import fileReducer from "./file/fileSlice";

// Version tracking for cache invalidation
const APP_VERSION = "1.0.0"; // Update this when making breaking changes
const STORAGE_KEY = "root";

// Check if stored version matches current version
const checkVersionAndClearIfNeeded = () => {
  try {
    const storedVersion = localStorage.getItem(`${STORAGE_KEY}_version`);
    if (storedVersion !== APP_VERSION) {
      // Clear all persisted data if versions don't match
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('persist:')) {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem(`${STORAGE_KEY}_version`, APP_VERSION);
      console.log(`🔄 App version updated to ${APP_VERSION}, cleared cache`);
    }
  } catch (error) {
    console.error('Error checking app version:', error);
  }
};

// Run version check before initializing store
checkVersionAndClearIfNeeded();

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "ui"], // Persist both auth and ui state
  version: 1, // Redux persist version
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
