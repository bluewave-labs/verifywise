import { Button, Stack, Typography, useTheme } from "@mui/material";
import React, { useState } from "react";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Check from "../../../components/Checks";
import Field from "../../../components/Inputs/Field";

import { ReactComponent as LeftArrowLong } from "../../../assets/icons/left-arrow-long.svg";
import { ReactComponent as Lock } from "../../../assets/icons/lock.svg";
import singleTheme from "../../../themes/v1SingleTheme";

// Define the shape of form values
interface FormValues {
  password: string;
  confirmPassword: string;
}

// Initial state for form values
const initialState: FormValues = {
  password: "",
  confirmPassword: "",
}

const SetNewPassword: React.FC = () => {
  // State for form values
  const [values, setValues] = useState<FormValues>(initialState);

  // Handle input field changes
  const handleChange = (prop: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  // Handle form submission
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
      console.log("Form submitted:", values);
      // Reset form after successful submission
      setValues(initialState);
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
      <form onSubmit={handleSubmit}>
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
            <Lock />
          </Stack>
          <Stack sx={{ gap: theme.spacing(6), textAlign: "center" }}>
            <Typography sx={{ fontSize: 16, fontWeight: "bold" }}>
              Set new password
            </Typography>
            <Typography fontSize={13}>
              Your new password must be different to previously used passwords.
            </Typography>
          </Stack>
          <Stack sx={{ gap: theme.spacing(12) }}>
            <Field
              label="Password"
              isRequired
              placeholder="••••••••"
              sx={buttonStyle}
              type="password"
              value={values.password}
              onChange={handleChange("password")}
            />
            <Field
              label="Confirm password"
              isRequired
              placeholder="••••••••"
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
              <Check
                text="Must be at least 8 characters"
              />
              <Check
                text="Must contain one special character"
              />
            </Stack>
            <Button
              type="submit"
              disableRipple
              variant="contained"
              sx={singleTheme.buttons.primary}
            >
              Reset password
            </Button>
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
            >
              <LeftArrowLong />
              <Typography sx={{ height: 22, fontSize: 13, fontWeight: 500 }}>
                Back to log in
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
};

export default SetNewPassword;
