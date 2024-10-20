import { Stack, Typography, useTheme } from "@mui/material";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import { ReactComponent as Email } from "../../../assets/icons/email.svg";
import { ReactComponent as LeftArrowLong } from "../../../assets/icons/left-arrow-long.svg";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
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
          <Email />
        </Stack>
        <Stack sx={{ gap: theme.spacing(6), textAlign: "center" }}>
          <Typography sx={{ fontSize: 16, fontWeight: "bold" }}>
            Check your email
          </Typography>
          <Typography fontSize={13} color={"#475467"}>
            We sent a password reset link to{" "}
            <span style={{ fontWeight: 500 }}>username@email.com</span>
          </Typography>
        </Stack>
        <Stack sx={{ gap: theme.spacing(12) }}>
          <Typography sx={{ fontSize: 13, color: "#475467" }}>
            Didn’t receive the email?{" "}
            <span
              style={{
                fontWeight: "bold",
                color: "#1570EF",
                cursor: "pointer",
              }}
            >
              Click to resend
            </span>
          </Typography>
        </Stack>
        <Stack
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Stack
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: theme.spacing(5),
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => {
              navigate("/login");
            }}
          >
            <LeftArrowLong />
            <Typography sx={{ height: 22, fontSize: 13, fontWeight: 500 }}>
              Back to log in
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default ResetPassword;
