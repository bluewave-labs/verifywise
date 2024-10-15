import { Button, Stack, Typography, useTheme } from "@mui/material";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Field from "../../../components/Inputs/Field";
import React, { useState } from "react";
import { ReactComponent as Key } from "../../../assets/icons/key.svg";
import { ReactComponent as LeftArrowLong } from "../../../assets/icons/left-arrow-long.svg";
import singleTheme from "../../../themes/v1SingleTheme";

// Define the shape of form values
interface FormValues {
  email: string;
}

// Define the shape of form errors
interface FormErrors {
  email?: string;
}

// Initial state for the form
const initialState: FormValues = {
  email: "",
};

const ForgotPassword: React.FC = () => {
  // State for form values
  const [values, setValues] = useState<FormValues>(initialState);
  // State for form errors
  const [errors, setErrors] = useState<FormErrors>({});

  // Handle changes in input fields
  const handleChange = (prop: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
    setErrors({ ...errors, [prop]: "" }); // Clear the error for the current field
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

  // Styles for input button
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
            <Key />
          </Stack>
          <Stack sx={{ gap: theme.spacing(6), textAlign: "center" }}>
            <Typography sx={{ fontSize: 16, fontWeight: "bold" }}>
              Forgot password?
            </Typography>
            <Typography fontSize={13}>
              No worries, we’ll send you reset instructions.
            </Typography>
          </Stack>
          <Stack sx={{ gap: theme.spacing(12) }}>
            <Field
              label="Email"
              isRequired
              placeholder="Enter your email"
              sx={buttonStyle}
              type="email"
              value={values.email}
              onChange={handleChange("email")}
              error={errors.email}
            />
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

export default ForgotPassword;