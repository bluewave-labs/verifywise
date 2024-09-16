import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import { ThemeProvider } from "@emotion/react";
import Dashboard from "./presentation/containers/Dashboard";
import { useSelector } from "react-redux";
import light from "./presentation/themes/light";
import dark from "./presentation/themes/dark";
import { CssBaseline } from "@mui/material";

function App() {
  const mode = useSelector((state: any) => state.ui?.mode || "light");
  return (
    <ThemeProvider theme={mode === "light" ? light : dark}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" Component={Dashboard} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
