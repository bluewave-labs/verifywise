import { Button, Stack, Typography, useTheme } from "@mui/material";
import React, { useEffect, useState } from "react";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Check from "../../../components/Checks";
import Field from "../../../components/Inputs/Field";

import { ReactComponent as LeftArrowLong } from "../../../assets/icons/left-arrow-long.svg";
import { ReactComponent as Lock } from "../../../assets/icons/lock.svg";
import singleTheme from "../../../themes/v1SingleTheme";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import { useNavigate } from "react-router-dom";

// Define the shape of form values
interface FormValues {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

// Define the shape for password validation checks
interface PasswordChecks {
  length: boolean;
  specialChar: boolean;
}

// Initial state for form values
const initialState: FormValues = {
  password: "",
  confirmPassword: "",
};

const SetNewPassword: React.FC = () => {
  const navigate = useNavigate();
  // State for form values
  const [values, setValues] = useState<FormValues>(initialState);
  // State for form errors
  const [errors, setErrors] = useState<FormErrors>({});
  // State for password validation checks
  const [passwordChecks, setPasswordChecks] = useState<PasswordChecks>({
    length: false,
    specialChar: false,
  });

  // Handle input field changes
  const handleChange =
    (prop: keyof FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [prop]: event.target.value });
      setErrors({ ...errors, [prop]: "" });
    };

  // Effect to update password checks based on the password input
  useEffect(() => {
    setPasswordChecks({
      length: values.password.length >= 8,
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(values.password),
    });
  }, [values.password]);

  // Function to validate the entire form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate password
    const password = checkStringValidation(
      "Password",
      values.password,
      8,
      16,
      true,
      true,
      true,
      true,
      "password"
    );
    if (!password.accepted) {
      newErrors.password = password.message;
    }

    // Confirm password validation
    if (values.password !== values.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Update state with any new errors
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors exist
  };

  // Handle form submission
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validateForm()) {
      console.log("Form submitted:", values);
      // Reset form after successful submission
      setValues(initialState);
      setErrors({});
      setPasswordChecks({ length: false, specialChar: false });
    }
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
              error={errors.password}
            />
            <Field
              label="Confirm password"
              isRequired
              placeholder="••••••••"
              sx={buttonStyle}
              type="password"
              value={values.confirmPassword}
              onChange={handleChange("confirmPassword")}
              error={errors.confirmPassword}
            />
            <Stack
              sx={{
                gap: theme.spacing(6),
              }}
            >
              <Check
                text="Must be at least 8 characters"
                variant={passwordChecks.length ? "success" : "info"}
              />
              <Check
                text="Must contain one special character"
                variant={passwordChecks.specialChar ? "success" : "info"}
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
      </form>
    </Stack>
  );
};

export default SetNewPassword;
