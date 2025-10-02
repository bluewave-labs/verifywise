import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";

const MicrosoftCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
        }, 2000);
        return;
      }

      // Handle missing code
      if (!code) {
        setError("No authorization code received");
        setTimeout(() => {
          navigate("/login", { state: { error: "Invalid SSO callback" } });
        }, 2000);
        return;
      }

      try {
        // TODO: Replace with actual API endpoint
        const response = await fetch("/api/auth/microsoft/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error("Authentication failed");
        }

        const data = await response.json();

        // Store token/session data
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        // Redirect to dashboard
        navigate("/");
      } catch (err) {
        setError("Authentication failed. Please try again.");
        setTimeout(() => {
          navigate("/login", { state: { error: "SSO authentication failed" } });
        }, 2000);
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
