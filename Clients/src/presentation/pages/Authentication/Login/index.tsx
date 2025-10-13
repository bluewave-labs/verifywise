import { Button, Stack, Typography, useTheme, Box } from "@mui/material";
import React, { Suspense, useState } from "react";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Checkbox from "../../../components/Inputs/Checkbox";
import Field from "../../../components/Inputs/Field";
import singleTheme from "../../../themes/v1SingleTheme";
import { useNavigate } from "react-router-dom";
import { logEngine } from "../../../../application/tools/log.engine";
import { useDispatch } from "react-redux";
import { setAuthToken } from "../../../../application/redux/auth/authSlice";
import { setExpiration } from "../../../../application/redux/auth/authSlice";
import Alert from "../../../components/Alert";
import { ENV_VARs } from "../../../../../env.vars";
import { useIsMultiTenant } from "../../../../application/hooks/useIsMultiTenant";
import { loginUser } from "../../../../application/repository/user.repository";

// Animated loading component specifically for login
const LoginLoadingOverlay: React.FC = () => {
  const theme = useTheme();
  const text = "Processing your request. Please wait...";
  const words = text.split(' ');

  return (
    <Stack
      sx={{
        width: "100%",
        maxWidth: "100%",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        backdropFilter: "blur(8px)",
        background: "rgba(255, 255, 255, 0.37)",
      }}
    >
      <Stack
        sx={{
          border: 1,
          borderColor: theme.palette.border.light,
          borderRadius: theme.shape.borderRadius,
          backgroundColor: theme.palette.background.main,
          width: "fit-content",
          height: "fit-content",
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          padding: "20px 40px",
          fontSize: 13,
        }}
      >
        <Box sx={{ display: 'inline-block' }}>
          {words.map((word, wordIndex) => (
            <React.Fragment key={wordIndex}>
              {word.split('').map((char, charIndex) => {
                const totalIndex = words.slice(0, wordIndex).join(' ').length +
                                 (wordIndex > 0 ? 1 : 0) + charIndex;

                return (
                  <Box
                    key={`${wordIndex}-${charIndex}`}
                    component="span"
                    sx={{
                      display: 'inline-block',
                      animation: `colorWave 2s ease-in-out infinite`,
                      animationDelay: `${totalIndex * 0.1}s`,
                      '@keyframes colorWave': {
                        '0%, 100%': {
                          color: '#6b7280',
                        },
                        '50%': {
                          color: '#13715B',
                        },
                      },
                    }}
                  >
                    {char}
                  </Box>
                );
              })}
              {wordIndex < words.length - 1 && <span> </span>}
            </React.Fragment>
          ))}
        </Box>
      </Stack>
    </Stack>
  );
};

const isDemoApp = ENV_VARs.IS_DEMO_APP || false;

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
  const { isMultiTenant } = useIsMultiTenant();

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

          localStorage.setItem('root_version', __APP_VERSION__);

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

        let message = "Error submitting form";
        if (error.message === "Not Found") {
          message = "User not found. Please try again.";
        }

        setIsSubmitting(false);
        setAlert({ variant: "error", body: message });
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
        <LoginLoadingOverlay />
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
                  color: singleTheme.buttons.primary.contained.backgroundColor,
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
              sx={singleTheme.buttons.primary.contained}
            >
              Sign in
            </Button>
            {isMultiTenant && (
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
                    color:
                      singleTheme.buttons.primary.contained.backgroundColor,
                    fontSize: 14,
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate("/register")}
                >
                  Register here
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
};

export default Login;
