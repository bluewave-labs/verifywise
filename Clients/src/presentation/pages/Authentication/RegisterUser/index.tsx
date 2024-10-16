import { Button, Stack, Typography, useTheme } from "@mui/material";
import React, { useState } from 'react';
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Check from "../../../components/Checks";
import Field from "../../../components/Inputs/Field";
import singleTheme from "../../../themes/v1SingleTheme";

// Define the shape of form values
interface FormValues {
  name: string;
  surname: string;
  password: string;
  confirmPassword: string;
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
  }

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
              Get started
            </Button>
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
};

export default RegisterUser;
