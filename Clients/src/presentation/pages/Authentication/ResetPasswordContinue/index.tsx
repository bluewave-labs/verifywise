/**
 * This file is currently in use
 */

import { Button, Stack, Typography, useTheme } from "@mui/material";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import { ReactComponent as Success } from "../../../assets/icons/check-outlined.svg";
import singleTheme from "../../../themes/v1SingleTheme";
import { useNavigate } from "react-router-dom";

const ResetPasswordContinue = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  return (
    <Stack
      className="reg-admin-page"
      sx={{
        minHeight: "100vh",
      }}
    >
      <Background
        style={{
          position: "absolute",
          top: "-40%",
          zIndex: -1,
          backgroundPosition: "center",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      <Stack
        className="reg-admin-form"
        sx={{
          width: 360,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          margin: "auto",
          mt: 40,
          gap: theme.spacing(20),
        }}
      >
        <Stack
          sx={{
            width: 56,
            height: 56,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "12px",
            border: "2px solid #EAECF0",
            gap: theme.spacing(12),
          }}
        >
          <Success />
        </Stack>
        <Stack sx={{ gap: theme.spacing(6), textAlign: "center" }}>
          <Typography sx={{ fontSize: 16, fontWeight: "bold" }}>
            Password reset
          </Typography>
          <Typography fontSize={13} color="#475467" fontWeight={400}>
            Your password has been successfully reset. Click below to log in.
          </Typography>
        </Stack>
        <Button
          disableRipple
          variant="contained"
          sx={{
            width: 360,
            ...singleTheme.buttons.primary,
          }}
          onClick={() => {
            navigate("/login");
          }}
        >
          Continue
        </Button>
      </Stack>
    </Stack>
  );
};

export default ResetPasswordContinue;
