import { Route, Routes } from "react-router-dom";
import "./App.css";
import { ThemeProvider } from "@emotion/react";
import Dashboard from "./presentation/containers/Dashboard";
import { useSelector } from "react-redux";
import light from "./presentation/themes/light";
import dark from "./presentation/themes/dark";
import { CssBaseline } from "@mui/material";
import Home from "./presentation/pages/Home";
import ComplianceTracker from "./presentation/pages/ComplianceTracker";
import Assessment from "./presentation/pages/Assessment";
import Vendors from "./presentation/pages/Vendors";
import Setting from "./presentation/pages/Setting";
import Team from "./presentation/pages/Team";
import { complianceMetrics, complianceDetails } from './presentation/pages/ComplianceTracker/ComplianceData';


function App() {
  const mode = useSelector((state: any) => state.ui?.mode || "light");
  return (
    <ThemeProvider theme={mode === "light" ? light : dark}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Dashboard />}>
          <Route path="/" element={<Home />} />
          <Route path="/compliance-tracker" element={<ComplianceTracker complianceMetrics={complianceMetrics} complianceDetails={complianceDetails} />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/setting" element={<Setting />} />
          <Route path="/team" element={<Team />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
