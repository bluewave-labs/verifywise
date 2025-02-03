import { Button, Stack, Typography, useTheme } from "@mui/material";
import React, { Suspense, useState } from "react";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Check from "../../../components/Checks";
import Field from "../../../components/Inputs/Field";
import singleTheme from "../../../themes/v1SingleTheme";
import { useNavigate } from "react-router-dom";
import { createNewUser } from "../../../../application/repository/entity.repository";
import { logEngine } from "../../../../application/tools/log.engine";
import {
  validatePassword,
  validateForm,
} from "../../../../application/validations/formValidation";
import type {
  FormValues,
  FormErrors,
} from "../../../../application/validations/formValidation";
import VWToast from "../../../vw-v2-components/Toast";
import Alert from "../../../components/Alert";

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

  //state for overlay modal
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordChecks = validatePassword(values);

  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
} | null>(null);

  // Handle input field changes
  const handleChange =
    (prop: keyof FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [prop]: event.target.value });
      setErrors({ ...errors, [prop]: "" }); // Clear error for the specific field
    };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const user = {
      id: "At register level as admin", // Replace with actual user ID
      email: values.email ?? "", // Replace with actual user email
      firstname: values.name ?? "", // Replace with actual user first name
      lastname: values.surname ?? "", // Replace with actual user last name
    };
    const { isFormValid, errors } = validateForm(values);
    if (!isFormValid) {
      setErrors(errors);
      setIsSubmitting(false);
      return;
    } else {
      await createNewUser({
        routeUrl: "/users/register",
        body: values,
      })
        .then((response) => {
          // Reset form after successful submission
          setValues(initialState);
          setErrors({});
          if (response.status === 201) {
            logEngine({ type: "info",message: "Account created successfully.",user,});
            setTimeout(() => {
              setIsSubmitting(false);
              navigate("/login");
            }, 3000);
          } else if (response.status === 400) {
            logEngine({
              type: "error",
              message: "Bad request. Please check your input.",
              user,
            });
            setIsSubmitting(false);
            setAlert({variant: "error", body: "Bad request. Please check your input.",});
            setTimeout(() => {
              setAlert(null);
            }, 3000);
          } else if (response.status === 409) {
            logEngine({
              type: "event",
              message: "Account already exists.",
              user,
            });
            setIsSubmitting(false);
            setAlert({variant: "error", body: "Account already exists.",});
            setTimeout(() => {
              setAlert(null);
            }, 3000);
          } else if (response.status === 500) {
            logEngine({
              type: "error",
              message: "Internal server error. Please try again later.",
              user,
            });
            setIsSubmitting(false);
            setAlert({variant: "error", body: "Internal server error. Please try again later.",});
            setTimeout(() => {
              setAlert(null);
            }, 3000);
          } else {
            logEngine({type: "error",message: "Unexpected response. Please try again.", user,});
            setIsSubmitting(false);
            setAlert({variant: "error", body: "Unexpected response. Please try again.",});
            setTimeout(() => {
              setAlert(null);
            }, 3000);
          }
        })
        .catch((error) => {
          logEngine({
            type: "error",
            message: `An error occurred: ${error.message}`,
            user,
          });
          setIsSubmitting(false);
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
     {alert && (
                <Suspense fallback={<div>Loading...</div>}>
                    <Alert
                        variant={alert.variant}
                        title={alert.title}
                        body={alert.body}
                        isToast={true}
                        onClick={() => setAlert(null)}
                    />
                </Suspense>
            )}
      {isSubmitting && <VWToast title="Processing your request. Please wait..." />}
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
               <Check
                text="Must contain at least one uppercase letter"
                variant={passwordChecks.uppercase ? "success" : "info"}
              />
                <Check
                text="Must contain atleast one number"
                variant={passwordChecks.number ? "success" : "info"}
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
