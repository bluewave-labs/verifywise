import { Button, Stack, Typography, useTheme } from "@mui/material";
import React, { useEffect, useState } from "react";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Check from "../../../components/Checks";
import Field from "../../../components/Inputs/Field";
import singleTheme from "../../../themes/v1SingleTheme";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import { useNavigate } from "react-router-dom";
import { createNewUser } from "../../../../application/repository/entity.repository";
import Alert from "../../../components/Alert";
import { logEngine } from "../../../../application/tools/log.engine";

// Define the shape of form values
interface FormValues {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Define the shape of form errors
interface FormErrors {
  name?: string;
  surname?: string;
  email?: string;
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
  email: "",
  password: "",
  confirmPassword: "",
};

const RegisterAdmin: React.FC = () => {
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
  // State for alert
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title: string;
    body: string;
  } | null>(null);

  // Handle input field changes
  const handleChange =
    (prop: keyof FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
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
    const name = checkStringValidation("Name", values.name, 3, 50);
    if (!name.accepted) {
      newErrors.name = name.message;
    }

    // Validate surname
    const surname = checkStringValidation("Surname", values.surname, 3, 50);
    if (!surname.accepted) {
      newErrors.surname = surname.message;
    }

    // Validate email
    const email = checkStringValidation(
      "Email",
      values.email,
      0,
      128,
      false,
      false,
      false,
      false,
      "email"
    );
    if (!email.accepted) {
      newErrors.email = email.message;
    }

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
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const user = {
      id: "At register level as admin", // Replace with actual user ID
      email: values.email, // Replace with actual user email
      firstname: values.name, // Replace with actual user first name
      lastname: values.surname, // Replace with actual user last name
    };
    if (validateForm()) {
      await createNewUser({
        routeUrl: "/users/register",
        body: values,
      })
        .then((response) => {
          console.log("Form submitted:", response);
          // Reset form after successful submission
          setValues(initialState);
          setErrors({});
          setPasswordChecks({ length: false, specialChar: false });
          if (response.status === 201) {
            setAlert({
              variant: "success",
              title: "Success",
              body: "Account created successfully. Redirecting to login...",
            });
            logEngine({
              type: "info",
              message: "Account created successfully.",
              user,
            });
            setTimeout(() => {
              setAlert(null);
              navigate("/login");
            }, 3000);
          } else if (response.status === 400) {
            setAlert({
              variant: "error",
              title: "Error",
              body: "Bad request. Please check your input.",
            });
            logEngine({
              type: "error",
              message: "Bad request. Please check your input.",
              user,
            });
            setTimeout(() => setAlert(null), 3000);
          } else if (response.status === 409) {
            setAlert({
              variant: "warning",
              title: "Warning",
              body: "Account already exists.",
            });
            logEngine({
              type: "event",
              message: "Account already exists.",
              user,
            });
            setTimeout(() => setAlert(null), 3000);
          } else if (response.status === 500) {
            setAlert({
              variant: "error",
              title: "Error",
              body: "Internal server error. Please try again later.",
            });
            logEngine({
              type: "error",
              message: "Internal server error. Please try again later.",
              user,
            });
            setTimeout(() => setAlert(null), 3000);
          } else {
            setAlert({
              variant: "error",
              title: "Error",
              body: "Unexpected response. Please try again.",
            });
            logEngine({
              type: "error",
              message: "Unexpected response. Please try again.",
              user,
            });
            setTimeout(() => setAlert(null), 3000);
          }
        })
        .catch((error) => {
          setAlert({
            variant: "error",
            title: "Error",
            body: "An error occurred. Please try again.",
          });
          logEngine({
            type: "error",
            message: `An error occurred: ${error.message}`,
            user,
          });
          setTimeout(() => setAlert(null), 3000);
        });
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
        marginBottom: theme.spacing(20),
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
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={true}
          onClick={() => setAlert(null)}
        />
      )}
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

export default RegisterAdmin;
