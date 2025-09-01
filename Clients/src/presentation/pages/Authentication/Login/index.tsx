import { Button, Stack, Typography, useTheme } from "@mui/material";
import React, { Suspense, useState, useEffect } from "react";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Checkbox from "../../../components/Inputs/Checkbox";
import Field from "../../../components/Inputs/Field";
import singleTheme from "../../../themes/v1SingleTheme";
import { useNavigate } from "react-router-dom";
import { logEngine } from "../../../../application/tools/log.engine";
import { useDispatch } from "react-redux";
import { setAuthToken } from "../../../../application/redux/auth/authSlice";
import { setExpiration } from "../../../../application/redux/auth/authSlice";
import CustomizableToast from "../../../vw-v2-components/Toast";
import Alert from "../../../components/Alert";
import { ENV_VARs } from "../../../../../env.vars";
import { useIsMultiTenant } from "../../../../application/hooks/useIsMultiTenant";
import { loginUser, loginWithGoogle } from "../../../../application/repository/user.repository";
import { 
  initializeGoogleSignIn, 
  signInWithGooglePopupAlternative,
  decodeGoogleToken,
  GoogleAuthResponse 
} from "../../../../application/tools/googleAuth";
import { ReactComponent as GoogleIcon } from "../../../assets/icons/google-icon.svg";

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

  // Initialize Google Sign-In when component mounts
  useEffect(() => {
    const initGoogle = async () => {
      try {
        await initializeGoogleSignIn();
      } catch (error) {
        console.error("Failed to initialize Google Sign-In:", error);
      }
    };
    
    if (ENV_VARs.GOOGLE_CLIENT_ID) {
      initGoogle();
    }
  }, []);

  // Handle changes in input fields
  const handleChange =
    (prop: keyof FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [prop]: event.target.value });
    };

  // Handle Google Sign-in
  const handleGoogleSignIn = async () => {
    if (!ENV_VARs.GOOGLE_CLIENT_ID) {
      setAlert({
        variant: "error",
        body: "Google Sign-In is not configured. Please contact your administrator.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      // Try the alternative popup method with cancellation handling
      signInWithGooglePopupAlternative(
        async (response: GoogleAuthResponse) => {
          try {
            
            // Decode the Google token to get user info
            const googleUser = decodeGoogleToken(response.credential);
            
            logEngine({
              type: "info",
              message: `Google Sign-In attempt for user: ${googleUser.email}`,
            });

            // Send the Google token to your backend for verification and login
            const loginResponse = await loginWithGoogle({
              googleToken: response.credential,
            });

            if (loginResponse.status === 202 || loginResponse.status === 200) {
              const token = loginResponse.data.data.token;

              // Always remember Google sign-in for 30 days
              const expirationDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
              dispatch(setAuthToken(token));
              dispatch(setExpiration(expirationDate));

              logEngine({
                type: "info",
                message: "Google Sign-In successful.",
              });

              setTimeout(() => {
                setIsSubmitting(false);
                navigate("/");
              }, 2000);
            } else {
              logEngine({
                type: "error",
                message: "Google Sign-In failed with unexpected response.",
              });

              setIsSubmitting(false);
              setAlert({
                variant: "error",
                body: "Google Sign-In failed. Please try again.",
              });
              setTimeout(() => setAlert(null), 3000);
            }
          } catch (error: any) {
            console.error("Google Sign-In error:", error);

            logEngine({
              type: "error",
              message: `Google Sign-In error: ${error.message}`,
            });

            setIsSubmitting(false);
            setAlert({
              variant: "error",
              body: error.message || "Google Sign-In failed. Please try again.",
            });
            setTimeout(() => setAlert(null), 3000);
          }
        },
        // Cancellation callback - this will run if user closes popup without signing in
        () => {
          console.log("Google Sign-In was cancelled by user");
          setIsSubmitting(false);
          // Optionally show a message
          logEngine({
            type: "info",
            message: "Google Sign-In was cancelled by user.",
          });
        }
      );
    } catch (error: any) {
      console.error("Failed to initiate Google Sign-In:", error);
      
      setIsSubmitting(false);
      setAlert({
        variant: "error",
        body: "Failed to initiate Google Sign-In. Please try again.",
      });
      setTimeout(() => setAlert(null), 3000);
    }
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
            <Button
             type="button"
             disableRipple
             variant="outlined"
             sx={singleTheme.buttons.google.outlined}
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || !ENV_VARs.GOOGLE_CLIENT_ID}
            >
              <GoogleIcon
                style={{
                  position: "absolute",
                  left: theme.spacing(5),
                  width: "20px",
                  height: "20px",
                }}
              />
              {!ENV_VARs.GOOGLE_CLIENT_ID ? "Google Sign-In Not Configured" : "Google Sign in"}
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
