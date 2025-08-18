// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Provider } from "react-redux";
import { persistor, store } from "./application/redux/store.ts";
import { PersistGate } from "redux-persist/integration/react";
// import { StyledEngineProvider } from "@mui/material";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './application/config/queryClient';

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <App />
        </Router>
      </QueryClientProvider>
    </PersistGate>
  </Provider>
);
