import { Button, Stack, Typography, useTheme } from "@mui/material";
import React, { Suspense, useState } from "react";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Checkbox from "../../../components/Inputs/Checkbox";
import Field from "../../../components/Inputs/Field";
import singleTheme from "../../../themes/v1SingleTheme";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../../../application/repository/entity.repository";
import { logEngine } from "../../../../application/tools/log.engine";
import { useDispatch } from "react-redux";
import { setAuthToken } from "../../../../application/authentication/authSlice";
import { setExpiration } from "../../../../application/authentication/authSlice";
import CustomizableToast from "../../../vw-v2-components/Toast";
import Alert from "../../../components/Alert";
import { ENV_VARs } from "../../../../../env.vars";

const isDemoApp = ENV_VARs.IS_DEMO_APP || false;
const isMultiTenant = ENV_VARs.IS_MULTI_TENANT || false;

// Define the shape of form values
interface FormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Initial state for the form
const initialState: FormValues = {
  email: isDemoApp ? "verifywise@email.com" : "",
  password: isDemoApp ? "Verifywise#1" : "",
  rememberMe: false,
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // State for form values
  const [values, setValues] = useState<FormValues>(initialState);

  const loginText = isDemoApp
    ? "Click on Sign in button directly to continue"
    : "Log in to your account";

  //disabled overlay state/modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  // Handle changes in input fields
  const handleChange =
    (prop: keyof FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [prop]: event.target.value });
    };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    await loginUser({
      routeUrl: "/users/login",
      body: values,
    })
      .then((response) => {
        setValues(initialState); // Extract `userData` from API response

        if (response.status === 202) {
          const token = response.data.data.token;

          if (values.rememberMe) {
            const expirationDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
            dispatch(setAuthToken(token));
            dispatch(setExpiration(expirationDate));
          } else {
            dispatch(setAuthToken(token));
            dispatch(setExpiration(null));
          }

          logEngine({
            type: "info",
            message: "Login successful.",
          });

          setTimeout(() => {
            setIsSubmitting(false);
            navigate("/");
          }, 3000);
        } else if (response.status === 404) {
          logEngine({
            type: "event",
            message: "User not found. Please try again.",
          });

          setIsSubmitting(false);
          setAlert({
            variant: "error",
            body: "User not found. Please try again.",
          });
          setTimeout(() => setAlert(null), 3000);
        } else if (response.status === 403) {
          logEngine({
            type: "event",
            message: "Invalid password. Please try again.",
          });

          setIsSubmitting(false);
          setAlert({
            variant: "error",
            body: "Invalid password. Please try again.",
          });
          setTimeout(() => setAlert(null), 3000);
        } else {
          logEngine({
            type: "error",
            message: "Unexpected response. Please try again.",
          });

          setIsSubmitting(false);
          setAlert({
            variant: "error",
            body: "Unexpected response. Please try again.",
          });
          setTimeout(() => setAlert(null), 3000);
        }
      })
      .catch((error) => {
        console.error("Error submitting form:", error);

        logEngine({
          type: "error",
          message: `An error occurred: ${error.message}`,
        });

        setIsSubmitting(false);
        setAlert({ variant: "error", body: "Error submitting form" });
        setTimeout(() => setAlert(null), 3000);
      });
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

      {isSubmitting && (
        <CustomizableToast title="Processing your request. Please wait..." />
      )}
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
            {loginText}
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
              disabled={isDemoApp}
            />
            <Field
              label="Password"
              isRequired
              placeholder="Enter your password"
              sx={fieldStyles}
              type="password"
              value={values.password}
              onChange={handleChange("password")}
              disabled={isDemoApp}
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
                onChange={(e) => {
                  setValues({ ...values, rememberMe: e.target.checked });
                }}
                size="small"
              />
              <Typography
                sx={{
                  color: theme.palette.primary.main,
                  fontSize: 13,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onClick={() => {
                  navigate("/forgot-password", {
                    state: { email: values.email },
                  });
                }}
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
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: theme.spacing(1),
              }}
            >
              <Typography
                sx={{ fontSize: 14, color: theme.palette.text.secondary }}
              >
                Don't have an account yet?
              </Typography>
              <Typography
                sx={{
                  color: theme.palette.primary.main,
                  fontSize: 14,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate(isMultiTenant ? "/register" : "/admin-reg")
                }
              >
                Register here
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
};

export default Login;
