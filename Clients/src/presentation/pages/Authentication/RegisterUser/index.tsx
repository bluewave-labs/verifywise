import React, { useState, useEffect } from 'react';
import { Button, Stack, Typography, useTheme } from "@mui/material";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Field from "../../../components/Inputs/Field";
import Check from "../../../components/Checks";
import singleTheme from "../../../themes/v1SingleTheme";

// Define the shape of form values
interface FormValues {
  name: string;
  surname: string;
  password: string;
  confirmPassword: string;
}

// Define the shape of form errors
interface FormErrors {
  name?: string;
  surname?: string;
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
  name: "",
  surname: "",
  password: "",
  confirmPassword: "",
}

const RegisterUser: React.FC = () => {
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
  const handleChange = (prop: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
    setErrors({ ...errors, [prop]: "" }); // Clear error for the specific field
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

    // Validate name
    if (!values.name.trim()) {
      newErrors.name = "Name is required";
    }

    // Validate surname
    if (!values.surname.trim()) {
      newErrors.surname = "Surname is required";
    }

    // Validate password
    if (!values.password) {
      newErrors.password = "Password is required";
    } else if (!passwordChecks.length || !passwordChecks.specialChar) {
      newErrors.password = "Password does not meet requirements";
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

  // Styles for input fields
  const fieldStyles = {
    width: 360,
    backgroundColor: "#fff",
  };

  return (
    <Stack
      className="reg-user-page"
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
          className="reg-user-form"
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
            Create VerifyWise user account
          </Typography>
          <Stack sx={{ gap: theme.spacing(7.5) }}>
            <Field
              label="Name"
              isRequired
              placeholder="Your name"
              sx={fieldStyles}
              value={values.name}
              onChange={handleChange("name")}
              error={errors.name}
            />
            <Field
              label="Surname"
              isRequired
              placeholder="Your surname"
              sx={fieldStyles}
              value={values.surname}
              onChange={handleChange("surname")}
              error={errors.surname}
            />
            <Field
              label="Password"
              isRequired
              placeholder="Create a password"
              sx={fieldStyles}
              type="password"
              value={values.password}
              onChange={handleChange("password")}
              error={errors.password}
            />
            <Field
              label="Confirm password"
              isRequired
              placeholder="Confirm your password"
              sx={fieldStyles}
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
              Get started
            </Button>
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
};

export default RegisterUser;
