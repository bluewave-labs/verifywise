import { Stack } from "@mui/material";
import "./index.css";
import Sidebar from "../../components/Sidebar";
import { Outlet } from "react-router";
import { useContext } from "react";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";

const Dashboard = () => {
  const { token } = useContext(VerifyWiseContext);

  console.log("This is the token in the dashboard :", token);

  return (
    <Stack
      maxWidth="100%"
      className="home-layout"
      flexDirection="row"
      gap={14}
      sx={{ backgroundColor: "#FCFCFD" }}
    >
      <Sidebar />
      <Outlet />
    </Stack>
  );
};

export default Dashboard;
