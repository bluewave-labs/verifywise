import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAuthToken, setExpiration } from "../../../../application/redux/auth/authSlice";
import { loginUserWithMicrosoft } from "../../../../application/repository/user.repository";

const MicrosoftCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Handle error from Microsoft
      if (errorParam) {
        setError(errorDescription || "Authentication failed");
        setTimeout(() => {
          navigate("/login", { state: { error: errorDescription || "SSO authentication failed" } });
        }, 3000);
        return;
      }

      // Handle missing code
      if (!code) {
        setError("No authorization code received");
        setTimeout(() => {
          navigate("/login", { state: { error: "Invalid SSO callback" } });
        }, 3000);
        return;
      }

      try {
        const response = await loginUserWithMicrosoft({ code });

        if (response.status === 202 || response.status === 200) {
          const token = response.data.data.token;

          // Always remember Microsoft sign-in for 30 days
          const expirationDate = Date.now() + 30 * 24 * 60 * 60 * 1000;

          // If opened in popup, send message to parent and close
          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'MICROSOFT_AUTH_SUCCESS',
                token,
                expirationDate
              },
              window.location.origin
            );
            window.close();
          } else {
            // If not a popup, use regular flow
            dispatch(setAuthToken(token));
            dispatch(setExpiration(expirationDate));
            localStorage.setItem('root_version', __APP_VERSION__);
            navigate("/");
          }
        } else {
          throw new Error("Authentication failed");
        }
      } catch (err) {
        setError("Authentication failed. Please try again.");
        // If opened in popup, notify parent of error
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'MICROSOFT_AUTH_ERROR',
              error: 'SSO authentication failed'
            },
            window.location.origin
          );
          setTimeout(() => window.close(), 3000);
        } else {
          setTimeout(() => {
            navigate("/login", { state: { error: "SSO authentication failed" } });
          }, 3000);
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      gap={2}
    >
      {error ? (
        <>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Redirecting to login...
          </Typography>
        </>
      ) : (
        <>
          <CircularProgress />
          <Typography variant="body1">Completing sign in...</Typography>
        </>
      )}
    </Box>
  );
};

export default MicrosoftCallback;
