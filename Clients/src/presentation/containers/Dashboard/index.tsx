import { Stack } from "@mui/material";
import "./index.css";
import Sidebar from "../../components/Sidebar";
import { Outlet } from "react-router";

const Dashboard = () => {
  return (
    <Stack className="home-layout" flexDirection="row" gap={14}>
      <Sidebar />
      <Outlet />
    </Stack>
  );
};

export default Dashboard;
