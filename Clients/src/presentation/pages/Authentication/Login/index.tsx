import { Button, Stack, Typography, useTheme, Alert as MuiAlert, Box, Link, CircularProgress } from "@mui/material";
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
import CustomizableToast from "../../../components/Toast";
import Alert from "../../../components/Alert";
import { ENV_VARs } from "../../../../../env.vars";
import { useIsMultiTenant } from "../../../../application/hooks/useIsMultiTenant";
import { loginUser } from "../../../../application/repository/user.repository";
import axios from "axios";

const isDemoApp = ENV_VARs.IS_DEMO_APP || false;

// Authentication step states
type AuthStep = 'email' | 'auth-options' | 'password';

// Organization and SSO information interface
interface UserOrgInfo {
  userExists: boolean;
  hasOrganization: boolean;
  ssoAvailable: boolean;
  authMethodPolicy: 'sso_only' | 'password_only' | 'both';
  organization?: {
    id: number;
    name: string;
  };
  sso?: {
    tenantId: string;
  };
  preferredAuthMethod?: 'sso' | 'password';
}

// Form values interface
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
  const { isMultiTenant } = useIsMultiTenant();
  const theme = useTheme();

  // Form state
  const [values, setValues] = useState<FormValues>(initialState);
  const [currentStep, setCurrentStep] = useState<AuthStep>('email');

  // Organization and SSO state
  const [userOrgInfo, setUserOrgInfo] = useState<UserOrgInfo | null>(null);
  const [checkingOrganization, setCheckingOrganization] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const loginText = isDemoApp
    ? "Click on Continue button directly to proceed"
    : "Log in to your account";

  // Handle input changes
  const handleChange =
    (prop: keyof FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [prop]: event.target.value });
    };

  // Check user's organization when email is validated
  const checkUserOrganization = async (email: string) => {
    if (!email.trim() || !email.includes('@')) {
      return;
    }

    setCheckingOrganization(true);
    try {
      const response = await axios.get(
        `${ENV_VARs.URL}/api/sso-auth/check-user-organization?email=${encodeURIComponent(email)}`
      );

      if (response.data.success) {
        setUserOrgInfo(response.data.data);

        // Auto-advance based on user existence and auth policy
        if (response.data.data.userExists) {
          const policy = response.data.data.authMethodPolicy;

          if (policy === 'sso_only' && response.data.data.ssoAvailable) {
            // Auto-redirect to SSO if SSO-only policy and SSO is available
            handleSSOLogin();
          } else if (policy === 'password_only') {
            // Auto-advance to password step if password-only policy
            setCurrentStep('password');
          } else {
            // Show auth options for 'both' policy or when SSO not available
            setCurrentStep('auth-options');
          }
        } else {
          // New user - show auth options or advance to password based on policy
          const policy = response.data.data.authMethodPolicy;
          if (policy === 'password_only') {
            setCurrentStep('password');
          } else {
            setCurrentStep('auth-options');
          }
        }
      }
    } catch (error) {
      console.error('Error checking user organization:', error);
      // Don't show error for organization check - just proceed normally
      setUserOrgInfo({
        userExists: false,
        hasOrganization: false,
        ssoAvailable: false,
        authMethodPolicy: 'both',
      });
    } finally {
      setCheckingOrganization(false);
    }
  };

  // Handle email step submission
  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!values.email.trim()) {
      setAlert({
        variant: "error",
        body: "Please enter your email address.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    await checkUserOrganization(values.email);
  };

  // Handle SSO login
  const handleSSOLogin = () => {
    if (!userOrgInfo?.organization?.id) {
      setAlert({
        variant: "error",
        body: "Organization information not available for SSO login.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    // Redirect to SSO login endpoint
    const ssoLoginUrl = `${ENV_VARs.URL}/api/sso-auth/${userOrgInfo.organization.id}/login`;
    window.location.href = ssoLoginUrl;
  };

  // Handle password login
  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await loginUser({
        body: {
          email: values.email,
          password: values.password,
          rememberMe: values.rememberMe,
        },
      });

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
        }, 2000);
      } else if (response.status === 404) {
        setIsSubmitting(false);
        setAlert({
          variant: "error",
          body: "User not found. Please check your email address.",
        });
        setTimeout(() => setAlert(null), 3000);
      } else if (response.status === 403) {
        setIsSubmitting(false);
        setAlert({
          variant: "error",
          body: "Incorrect password. Please try again.",
        });
        setTimeout(() => setAlert(null), 3000);
      } else {
        setIsSubmitting(false);
        setAlert({
          variant: "error",
          body: "Login failed. Please try again.",
        });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (error) {
      console.error("Error during login:", error);
      setIsSubmitting(false);
      setAlert({
        variant: "error",
        body: "Login failed. Please check your credentials and try again.",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  // Reset to email step
  const resetToEmailStep = () => {
    setCurrentStep('email');
    setUserOrgInfo(null);
    setValues({ ...values, password: '' });
  };

  // Form styles
  const fieldStyles = {
    width: 360,
    backgroundColor: "#fff",
  };

  const buttonStyles = {
    ...singleTheme.buttons.primary.contained,
    width: 360,
    height: 48,
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
        <CustomizableToast title="Signing you in..." />
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
        {/* Header */}
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

        {/* Step 1: Email Input */}
        {currentStep === 'email' && (
          <form onSubmit={handleEmailSubmit}>
            <Stack sx={{ gap: theme.spacing(7.5), alignItems: 'center' }}>
              <Field
                label="Email"
                isRequired
                placeholder="name.surname@companyname.com"
                sx={fieldStyles}
                type="email"
                value={values.email}
                onChange={handleChange("email")}
                disabled={isDemoApp || checkingOrganization}
              />

              {checkingOrganization && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Checking account...
                  </Typography>
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                sx={buttonStyles}
                disabled={!values.email.trim() || checkingOrganization}
              >
                Continue
              </Button>
            </Stack>
          </form>
        )}

        {/* Step 2: Authentication Options */}
        {currentStep === 'auth-options' && userOrgInfo && (
          <Stack sx={{ gap: theme.spacing(7.5), alignItems: 'center' }}>
            {/* Email Confirmation */}
            <Box sx={{ width: 360 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  ✓ Email:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {values.email}
                </Typography>
                <Link
                  component="button"
                  variant="body2"
                  onClick={resetToEmailStep}
                  sx={{ textDecoration: 'none', color: singleTheme.textColors.theme }}
                >
                  Change
                </Link>
              </Stack>

              {userOrgInfo.hasOrganization && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Organization: {userOrgInfo.organization?.name}
                </Typography>
              )}
            </Box>

            {/* SSO Option */}
            {userOrgInfo.ssoAvailable && userOrgInfo.authMethodPolicy !== 'password_only' && (
              <Button
                variant="contained"
                onClick={handleSSOLogin}
                sx={{
                  ...buttonStyles,
                  backgroundColor: '#0078d4',
                  '&:hover': {
                    backgroundColor: '#106ebe',
                  },
                }}
              >
                Continue with Microsoft
              </Button>
            )}

            {/* Divider */}
            {userOrgInfo.ssoAvailable && userOrgInfo.authMethodPolicy === 'both' && (
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>
            )}

            {/* Password Option */}
            {userOrgInfo.authMethodPolicy !== 'sso_only' && (
              <Button
                variant={userOrgInfo.ssoAvailable && userOrgInfo.authMethodPolicy === 'both' ? "outlined" : "contained"}
                onClick={() => setCurrentStep('password')}
                sx={userOrgInfo.ssoAvailable && userOrgInfo.authMethodPolicy === 'both' ? {
                  ...buttonStyles,
                  backgroundColor: 'transparent',
                  borderColor: singleTheme.buttons.primary.contained.backgroundColor,
                  color: singleTheme.buttons.primary.contained.backgroundColor,
                  '&:hover': {
                    backgroundColor: singleTheme.buttons.primary.contained.backgroundColor,
                    color: '#fff',
                  },
                } : buttonStyles}
              >
                Continue with Password
              </Button>
            )}

            {/* Policy message for SSO-only */}
            {userOrgInfo.authMethodPolicy === 'sso_only' && !userOrgInfo.ssoAvailable && (
              <MuiAlert severity="warning" sx={{ width: 360, mt: 2 }}>
                Your organization requires SSO authentication, but SSO is not configured. Please contact your administrator.
              </MuiAlert>
            )}

            {/* New User Message */}
            {!userOrgInfo.userExists && (
              <MuiAlert severity="info" sx={{ width: 360, mt: 2 }}>
                New user? You'll be able to create an account after entering your password.
              </MuiAlert>
            )}
          </Stack>
        )}

        {/* Step 3: Password Input */}
        {currentStep === 'password' && (
          <form onSubmit={handlePasswordLogin}>
            <Stack sx={{ gap: theme.spacing(7.5), alignItems: 'center' }}>
              {/* Email Confirmation */}
              <Box sx={{ width: 360 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    ✓ Email:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {values.email}
                  </Typography>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={resetToEmailStep}
                    sx={{ textDecoration: 'none', color: singleTheme.textColors.theme }}
                  >
                    Change
                  </Link>
                </Stack>

                {userOrgInfo?.hasOrganization && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Organization: {userOrgInfo.organization?.name}
                  </Typography>
                )}
              </Box>

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
                  width: 360,
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
                variant="contained"
                sx={buttonStyles}
                disabled={!values.password.trim()}
              >
                Sign in
              </Button>

              {/* Back to auth options */}
              {userOrgInfo?.ssoAvailable && userOrgInfo?.authMethodPolicy === 'both' && (
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => setCurrentStep('auth-options')}
                  sx={{ textDecoration: 'none', color: singleTheme.textColors.theme }}
                >
                  ← Back to login options
                </Link>
              )}
            </Stack>
          </form>
        )}

        {/* Registration Link */}
        {isMultiTenant && currentStep === 'email' && (
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
                color: singleTheme.buttons.primary.contained.backgroundColor,
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
  );
};

export default Login;