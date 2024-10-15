import React, { useState } from 'react';
import { Button, Stack, Typography, useTheme } from "@mui/material";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Field from "../../../components/Inputs/Field";
import Checkbox from "../../../components/Inputs/Checkbox";
import singleTheme from "../../../themes/v1SingleTheme";

// Define the shape of form values
interface FormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Define the shape of form errors
interface FormErrors {
  email?: string;
  password?: string;
}

// Initial state for the form
const initialState: FormValues = {
  email: "",
  password: "",
  rememberMe: true,
};

const Login: React.FC = () => {
  // State for form values
  const [values, setValues] = useState<FormValues>(initialState);
  // State for form errors
  const [errors, setErrors] = useState<FormErrors>({});

  // Handle changes in input fields
  const handleChange = (prop: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
    setErrors({ ...errors, [prop]: "" }); // Clear the error for the current field
  };

  // Handle changes in the remember me checkbox
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, rememberMe: event.target.checked });
  };

  // Validate the form fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!values.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      newErrors.email = "Email is invalid";
    }

    // Password validation
    if (!values.password) {
      newErrors.password = "Password is required";
    }

    // Update the error state and return true if no errors
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validateForm()) {
      console.log("Form submitted:", values);
      // Reset form after successful submission
      setValues(initialState);
      setErrors({});
    }
  };

  const theme = useTheme();

  // Styles for input fields
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
          <Typography
            sx={{
              fontSize: 40,
            }}
          >
            Verify
            <span style={{ color: singleTheme.textColors.theme }}>Wise</span>
          </Typography>
          <Typography sx={{ fontSize: 16, fontWeight: "bold" }}>
            Log in to your account
          </Typography>
          <Stack sx={{ gap: theme.spacing(7.5) }}>
            <Field
              label="Email"
              isRequired
              placeholder="name.surname@companyname.com"
              sx={fieldStyles}
              type="email"
              value={values.email}
              onChange={handleChange("email")}
              error={errors.email}
            />
            <Field
              label="Password"
              isRequired
              placeholder="Enter your password"
              sx={fieldStyles}
              type="password"
              value={values.password}
              onChange={handleChange("password")}
              error={errors.password}
            />
            <Stack
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Checkbox
                id="30-days-memory"
                label="Remember for 30 days"
                isChecked={values.rememberMe}
                value={values.rememberMe ? "true" : "false"}
                onChange={handleCheckboxChange}
                size="small"
              />
              <Typography
                sx={{
                  color: theme.palette.primary.main,
                  fontSize: 13,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onClick={() => console.log("Forgot password clicked")}
              >
                Forgot password
              </Typography>
            </Stack>
            <Button
              type="submit"
              disableRipple
              variant="contained"
              sx={singleTheme.buttons.primary}
            >
              Sign in
            </Button>
            <Stack
              sx={{
                mt: theme.spacing(20),
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{ fontSize: 13, color: theme.palette.secondary.contrastText }}
              >
                Don't have an account?{" "}
                <span
                  style={{
                    color: theme.palette.primary.main,
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                  onClick={() => console.log("Sign up clicked")}
                >
                  Sign up
                </span>
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
};

export default Login;
