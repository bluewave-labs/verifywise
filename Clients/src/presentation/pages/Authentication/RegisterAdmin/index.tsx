import { Button, Stack, Typography, useTheme } from "@mui/material";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Field from "../../../components/Inputs/Field";
import Check from "../../../components/Checks";

const RegisterAdmin = () => {
  const theme = useTheme();

  const buttonStyle = {
    width: 360,
    backgroundColor: "#fff",
  };

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
          gap: theme.spacing(20),
        }}
      >
        <Typography
          sx={{
            fontSize: 40,
          }}
        >
          Verify<span style={{ color: "#0f604d" }}>Wise</span>
        </Typography>
        <Typography sx={{ fontSize: 16, fontWeight: "bold" }}>
          Create VerifyWise admin account
        </Typography>
        <Stack sx={{ gap: theme.spacing(10) }}>
          <Field label="Name" isRequired placeholder="Talha" sx={buttonStyle} />
          <Field
            label="Surname"
            isRequired
            placeholder="Bolat"
            sx={buttonStyle}
          />
          <Field
            label="Email"
            isRequired
            placeholder="name.surname@companyname.com"
            sx={buttonStyle}
            type="email"
          />
          <Field
            label="Password"
            isRequired
            placeholder="Create a password"
            sx={buttonStyle}
            type="password"
          />
          <Field
            label="Confirm password"
            isRequired
            placeholder="Confirm your password"
            sx={buttonStyle}
            type="password"
          />
          <Stack
            sx={{
              gap: theme.spacing(6),
            }}
          >
            <Check text="Must be at least 8 characters" />
            <Check text="Must contain one special character" />
          </Stack>
          <Button
            disableRipple
            variant="contained"
            sx={{ fontSize: 13, backgroundColor: "#0f604d" }}
          >
            Get started
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default RegisterAdmin;
