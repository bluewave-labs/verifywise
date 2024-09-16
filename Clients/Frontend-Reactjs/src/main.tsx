import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Provider } from "react-redux";
import { persistor, store } from "./application/store.ts";
import { PersistGate } from "redux-persist/integration/react";
import { StyledEngineProvider } from "@mui/material";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <StyledEngineProvider>
        <StrictMode>
          <App />
        </StrictMode>
      </StyledEngineProvider>
    </PersistGate>
  </Provider>
);
