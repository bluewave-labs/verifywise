import { Button, Stack, Typography, useTheme, Box } from "@mui/material";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Check from "../../../components/Checks";
import Field from "../../../components/Inputs/Field";
import singleTheme from "../../../themes/v1SingleTheme";
import {
  validatePassword,
  validateForm,
} from "../../../../application/validations/formValidation";
import type {
  FormValues,
  FormErrors,
} from "../../../../application/validations/formValidation";
import useRegisterUser from "../../../../application/hooks/useRegisterUser";
import { useNavigate } from "react-router-dom";
import { logEngine } from "../../../../application/tools/log.engine";
import CustomizableToast from "../../../vw-v2-components/Toast";
import { extractUserToken } from "../../../../application/tools/extractToken";
import { useSearchParams } from "react-router-dom";
import { handleAlert } from "../../../../application/tools/alertUtils";
import { ENV_VARs } from "../../../../../env.vars";
import { decodeGoogleToken, GoogleAuthResponse, initializeGoogleSignIn, signInWithGooglePopupAlternative } from "../../../../application/tools/googleAuth";
import { useDispatch } from "react-redux";
import { createNewUserWithGoogle, loginWithGoogle } from "../../../../application/repository/user.repository";
import { setAuthToken, setExpiration } from "../../../../application/redux/auth/authSlice";
const Alert = lazy(() => import("../../../components/Alert"));

export interface AlertType {
  variant: "success" | "info" | "warning" | "error";
  title?: string;
  body: string;
}

// Initial state for form values
const initialState: FormValues = {
  name: "",
  surname: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const RegisterUser: React.FC = () => {
  const navigate = useNavigate();
  const { registerUser } = useRegisterUser();
  const dispatch = useDispatch();
  // Extract user token
  const [searchParams] = useSearchParams();
  const userToken = searchParams.get("token");
  const [isInvitationValid, setIsInvitationValid] = useState<boolean>(true);
  const [alert, setAlert] = useState<AlertType | null>(null);

  // State for form values
  const [values, setValues] = useState<FormValues>(initialState);
  // State for form errors
  const [errors, setErrors] = useState<FormErrors>({});
  // Password checks based on the password input
  const passwordChecks = validatePassword(values);

  //disabled overlay modal state
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Handle input field changes
  const handleChange =
    (prop: keyof FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [prop]: event.target.value });
      setErrors({ ...errors, [prop]: "" });
    };

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
                const loginResponse = await createNewUserWithGoogle({
                  googleToken: response.credential,
                  userData: {
                    roleId: Number(values.roleId) || 1,
                    organizationId: Number(values.organizationId)
                  }
                });
    
                if (loginResponse.status === 201) {
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

    const user = {
      id: "At register level as user",
      firstname: values.name || "",
      lastname: values.surname || "",
      roleId: Number(values.roleId) || 1,
      organizationId: Number(values.organizationId),
    };
    const { isFormValid, errors } = validateForm(values);
    if (!isFormValid) {
      setErrors(errors);
      setIsSubmitting(false);
    } else {
      const { isSuccess } = await registerUser({
        values,
        user,
        setIsSubmitting,
      });
      if (isSuccess === 201) {
        setValues(initialState);
        setErrors({});
        handleAlert({
          variant: "success",
          body: "Registration successful. Redirecting to login page...",
          setAlert,
        });
        setTimeout(() => {
          navigate("/login");
          setIsSubmitting(false);
        }, 2000);
      } else {
        logEngine({
          type: "error",
          message: "Registration failed.",
        });
        setIsSubmitting(false);

        handleAlert({
          variant: "error",
          body:
            isSuccess === 409 ? "This user already exists." : "Registration failed.",
          setAlert,
        });
      }
    }
  };

  const theme = useTheme();

  // Styles for input fields
  const fieldStyles = {
    width: 360,
    backgroundColor: "#fff",
  };

  const checkValidInvitation = (expDate: any) => {
    let todayDate = new Date();
    let currentTime = todayDate.getTime();

    if (currentTime < expDate) {
      setIsInvitationValid(true);
    } else {
      setIsInvitationValid(false);
    }
    return isInvitationValid;
  };

  useEffect(() => {
    if (userToken !== null) {
      const userInfo = extractUserToken(userToken);
      if (userInfo !== null) {
        const isValidLink = checkValidInvitation(userInfo?.expire);

        if (isValidLink) {
          const userData: FormValues = {
            ...initialState,
            name: userInfo.name ?? "",
            surname: userInfo.surname ?? "",
            email: userInfo.email ?? "",
            roleId: Number(userInfo.roleId) ?? 1,
            organizationId: Number(userInfo.organizationId),
          };
          setValues(userData);
        }
      }
    }
  }, [userToken]);

  return (
    <Stack
      className="reg-user-page"
      sx={{
        minHeight: "100vh",
      }}
    >
      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <Box>
            <Alert
              variant={alert.variant}
              title={alert.title}
              body={alert.body}
              isToast={true}
              onClick={() => setAlert(null)}
            />
          </Box>
        </Suspense>
      )}

      {/* Toast component */}
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
          {isInvitationValid === true ? (
            <Typography sx={{ fontSize: 16, fontWeight: "bold" }}>
              Create VerifyWise user account
            </Typography>
          ) : (
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: "semi-bold",
                color: "error.main",
              }}
            >
              This invitation link is expired. You need to be invited again to
              gain access to the dashboard
            </Typography>
          )}

          <Stack sx={{ gap: theme.spacing(7.5) }}>
            <Field
              label="Name"
              isRequired
              placeholder="Your name"
              sx={fieldStyles}
              value={values.name}
              onChange={handleChange("name")}
              error={errors.name}
              disabled={!isInvitationValid}
            />
            <Field
              label="Surname"
              isRequired
              placeholder="Your surname"
              sx={fieldStyles}
              value={values.surname}
              onChange={handleChange("surname")}
              error={errors.surname}
              disabled={!isInvitationValid}
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
              disabled
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
              disabled={!isInvitationValid}
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
              disabled={!isInvitationValid}
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
              sx={singleTheme.buttons.primary.contained}
              disabled={!isInvitationValid}
            >
              Get started
            </Button>
            <Button
              type="button"
              disableRipple
              variant="contained"
              sx={{
                ...singleTheme.buttons.primary.contained,
                backgroundColor: "#4285f4",
                "&:hover": {
                  backgroundColor: "#3367d6",
                },
              }}
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || !ENV_VARs.GOOGLE_CLIENT_ID}
            >
              {!ENV_VARs.GOOGLE_CLIENT_ID ? "Google Sign-In Not Configured" : "Google Sign in"}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
};

export default RegisterUser;
