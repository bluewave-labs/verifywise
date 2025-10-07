import { Button, useTheme } from "@mui/material"
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setAuthToken, setExpiration } from "../../../application/redux/auth/authSlice";
import { ReactComponent as MicrosoftIcon } from "../../assets/icons/microsoft-icon.svg";

interface MicrosoftSignInProps {
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  tenantId?: string;
  clientId?: string;
  text?: string;
}

export const MicrosoftSignIn: React.FC<MicrosoftSignInProps> = ({
  isSubmitting,
  setIsSubmitting,
  tenantId,
  clientId,
  text = "Sign in with Microsoft"
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [_, setAlert] = useState<{
      variant: "success" | "info" | "warning" | "error";
      title?: string;
      body: string;
    } | null>(null);

  // Listen for messages from the popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify the message is from our origin
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'MICROSOFT_AUTH_SUCCESS') {
        dispatch(setAuthToken(event.data.token));
        dispatch(setExpiration(event.data.expirationDate));
        localStorage.setItem('root_version', __APP_VERSION__);
        setIsSubmitting(false);
        navigate("/");
      } else if (event.data.type === 'MICROSOFT_AUTH_ERROR') {
        setIsSubmitting(false);
        setAlert({
          variant: "error",
          body: event.data.error || "SSO authentication failed",
        });
        setTimeout(() => setAlert(null), 3000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [dispatch, navigate, setIsSubmitting]);

  // Handle Microsoft Sign-in
  const handleMicrosoftSignIn = async () => {
    if (!tenantId || !clientId) {
      setAlert({
        variant: "error",
        body: "Microsoft Sign-In is not configured. Please contact your administrator.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    try {
      setIsSubmitting(true);

      // Construct Microsoft OAuth URL
      const redirectUri = `${window.location.origin}/auth/microsoft/callback`;
      const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=openid profile email&` +
        `response_mode=query`;

      // Open Microsoft login in new tab
      window.open(authUrl, '_blank');
      setIsSubmitting(false);
    } catch (error: any) {
      setIsSubmitting(false);
      setAlert({
        variant: "error",
        body: "Failed to initiate Microsoft Sign-In. Please try again.",
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
        height: 34,
        fontSize: '13px',
        backgroundColor: '#2f2f2f',
        color: '#ffffff',
        boxShadow: 'none',
        textTransform: 'none',
        borderRadius: '4px',
        border: 'none',
        position: 'relative',
        paddingLeft: theme.spacing(6),
        '&:hover': {
          backgroundColor: '#1a1a1a',
          boxShadow: 'none',
        },
        '&:disabled': {
          backgroundColor: '#cccccc',
          color: '#666666',
        },
      }}
      onClick={handleMicrosoftSignIn}
      disabled={isSubmitting || !tenantId || !clientId}
    >
      <MicrosoftIcon
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
      {!tenantId || !clientId ? "Microsoft Sign-In Not Configured" : text}
    </Button>
  )
}
