import { Button, Stack, Typography, useTheme } from "@mui/material";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Field from "../../../components/Inputs/Field";
import Check from "../../../components/Checks";
import { useState } from "react";

const RegisterUser = () => {
  const [values, setValues] = useState({
    name: "",
    surname: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange =
    (prop: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [prop]: event.target.value });
    };

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
          Create VerifyWise user account
        </Typography>
        <Stack sx={{ gap: theme.spacing(7.5) }}>
          <Field
            label="Name"
            isRequired
            placeholder="Your name"
            sx={buttonStyle}
            value={values.name}
            onChange={handleChange("name")}
          />
          <Field
            label="Surname"
            isRequired
            placeholder="Your surname"
            sx={buttonStyle}
            value={values.surname}
            onChange={handleChange("surname")}
          />
          <Field
            label="Password"
            isRequired
            placeholder="Create a password"
            sx={buttonStyle}
            type="password"
            value={values.password}
            onChange={handleChange("password")}
          />
          <Field
            label="Confirm password"
            isRequired
            placeholder="Confirm your password"
            sx={buttonStyle}
            type="password"
            value={values.confirmPassword}
            onChange={handleChange("confirmPassword")}
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
            sx={{ fontSize: 13, backgroundColor: theme.palette.primary.main }}
          >
            Get started
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default RegisterUser;
