import { Button, useTheme } from "@mui/material"
import { ENV_VARs } from "../../../../env.vars"
import { singleTheme } from "../../themes"
import { GoogleAuthResponse, signInWithGooglePopupAlternative } from "../../../application/tools/googleAuth";
import { logEngine } from "../../../application/tools/log.engine";
import { useState } from "react";
import { ReactComponent as GoogleIcon } from "../../assets/icons/google-icon.svg";

interface GoogleSignInProps {
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  callback: (response: GoogleAuthResponse) => void;
  text?: string;
}

export const GoogleSignIn: React.FC<GoogleSignInProps> = ({
  isSubmitting,
  setIsSubmitting,
  callback,
  text = "Google Sign in"
}) => {
  const theme = useTheme();

  const [_, setAlert] = useState<{
      variant: "success" | "info" | "warning" | "error";
      title?: string;
      body: string;
    } | null>(null);

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

    try {
      // Try the alternative popup method with cancellation handling
      signInWithGooglePopupAlternative(
        callback,
        // Cancellation callback - this will run if user closes popup without signing in
        () => {
          setIsSubmitting(false);
          // Optionally show a message
          logEngine({
            type: "info",
            message: "Google Sign-In was cancelled by user.",
          });
        }
      );
    } catch (error: any) {
      
      setIsSubmitting(false);
      setAlert({
        variant: "error",
        body: "Failed to initiate Google Sign-In. Please try again.",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  return (
    <Button
      type="button"
      disableRipple
      variant="contained"
      sx={{
        ...singleTheme.buttons.google.outlined,
        backgroundColor: '#1976d2',
        color: '#ffffff',
        border: 'none',
        '&:hover': {
          backgroundColor: '#1565c0',
        },
        '&:disabled': {
          backgroundColor: '#cccccc',
          color: '#666666',
        },
      }}
      onClick={handleGoogleSignIn}
      disabled={isSubmitting || !ENV_VARs.GOOGLE_CLIENT_ID}
    >
      <GoogleIcon
        style={{
          position: "absolute",
          left: theme.spacing(2.5),
          width: "30px",
          height: "27px",
          backgroundColor: "white",
          borderRadius: "4px",
          padding: "2px",
        }}
      />
      {!ENV_VARs.GOOGLE_CLIENT_ID ? "Google Sign-In Not Configured" : text}
    </Button>
  )
}