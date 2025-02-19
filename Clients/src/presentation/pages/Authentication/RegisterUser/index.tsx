import { Button, Stack, Typography, useTheme } from "@mui/material";
import React, { useState } from "react";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Check from "../../../components/Checks";
import Field from "../../../components/Inputs/Field";
import singleTheme from "../../../themes/v1SingleTheme";
import { validatePassword, validateForm } from "../../../../application/validations/formValidation";
import type { FormValues, FormErrors } from "../../../../application/validations/formValidation";
import useRegisterUser from "../../../../application/hooks/useRegisterUser";
import { useNavigate } from "react-router-dom";
import { logEngine } from "../../../../application/tools/log.engine";
import VWToast from "../../../vw-v2-components/Toast";

export interface AlertType {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
}

// Initial state for form values
const initialState: FormValues = {
  name: "",
  surname: "",
  password: "",
  confirmPassword: "",
};

const RegisterUser: React.FC = () => {
  const navigate = useNavigate();
  const {registerUser} = useRegisterUser();
  // State for form values
  const [values, setValues] = useState<FormValues>(initialState);
  // State for form errors
  const [errors, setErrors] = useState<FormErrors>({});
  // Password checks based on the password input
  const passwordChecks = validatePassword(values);

  //disabled overlay modal state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input field changes
  const handleChange =
    (prop: keyof FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [prop]: event.target.value });
      setErrors({ ...errors, [prop]: "" });
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
setIsSubmitting(true);

    const user = {
      id: "At register level as user",
      firstname: values.name || "",
      lastname: values.surname || "",

    };
    const { isFormValid, errors } = validateForm(values);
    if (!isFormValid) {
      setErrors(errors);
      setIsSubmitting(false);
    } else {
      const { isSuccess } = await registerUser({ values, user,setIsSubmitting });
      if (isSuccess) {
        setValues(initialState);
        setErrors({});
        setTimeout(() => {
          navigate("/login");
          setIsSubmitting(false);
        }, 3000);
      } else{
        logEngine({
          type: "error",
          message: "Registration failed.",
          user,
        })
        setIsSubmitting(false);
      }
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
      {/* Toast component */}
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
