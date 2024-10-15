import { Button, Stack, Typography, useTheme } from "@mui/material";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Field from "../../../components/Inputs/Field";
import Check from "../../../components/Checks";
import { useState } from "react";
import singleTheme from "../../../themes/v1SingleTheme";

const RegisterAdmin = () => {
  const [values, setValues] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange =
    (prop: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [prop]: event.target.value });
    };

  const theme = useTheme();

  const fieldStyles = {
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
          mt: 40,
          gap: theme.spacing(10),
        }}
      >
        <Typography
          sx={{
            fontSize: 40,
          }}
        >
          Verify
          <span style={{ color: singleTheme.textColors.theme }}>Wise</span>
        </Typography>
        <Typography sx={{ fontSize: 16, fontWeight: "bold" }}>
          Create VerifyWise admin account
        </Typography>
        <Stack sx={{ gap: theme.spacing(7.5) }}>
          <Field
            label="Name"
            isRequired
            placeholder="Your name"
            sx={fieldStyles}
            value={values.name}
            onChange={handleChange("name")}
          />
          <Field
            label="Surname"
            isRequired
            placeholder="Your surname"
            sx={fieldStyles}
            value={values.surname}
            onChange={handleChange("surname")}
          />
          <Field
            label="Email"
            isRequired
            placeholder="name.surname@companyname.com"
            sx={fieldStyles}
            type="email"
            value={values.email}
            onChange={handleChange("email")}
          />
          <Field
            label="Password"
            isRequired
            placeholder="Create a password"
            sx={fieldStyles}
            type="password"
            value={values.password}
            onChange={handleChange("password")}
          />
          <Field
            label="Confirm password"
            isRequired
            placeholder="Confirm your password"
            sx={fieldStyles}
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
            sx={singleTheme.buttons.primary}
          >
            Get started
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default RegisterAdmin;
