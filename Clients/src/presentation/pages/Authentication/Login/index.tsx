import { Button, Stack, Typography, useTheme } from "@mui/material";
import React, { useContext, useState } from "react";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Checkbox from "../../../components/Inputs/Checkbox";
import Field from "../../../components/Inputs/Field";
import singleTheme from "../../../themes/v1SingleTheme";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../../../application/repository/entity.repository";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import Alert from "../../../components/Alert";
import { logEngine } from "../../../../application/tools/log.engine";
import { useDispatch } from "react-redux";
import { setAuthToken } from "../../../../application/authentication/authSlice";

// Define the shape of form values
interface FormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Initial state for the form
const initialState: FormValues = {
  email: "",
  password: "",
  rememberMe: false,
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useContext(VerifyWiseContext);
  const dispatch = useDispatch();
  // State for form values
  const [values, setValues] = useState<FormValues>(initialState);
  // State for alert
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

    const user = {
      id: "At login level", // Replace with actual user ID
      email: values.email, // Replace with actual user email
      firstname: "N/A", // Replace with actual user first name
      lastname: "N/A", // Replace with actual user last name
    };

    await loginUser({
      routeUrl: "/users/login",
      body: values,
    })
      .then((response) => {
        setValues(initialState);
        if (response.status === 202) {
          const token = response.data.data.token;
          login(token);
          dispatch(setAuthToken(token)); // Dispatch the action to set the token in Redux state
          setAlert({
            variant: "success",
            body: "Login successful. Redirecting...",
          });
          logEngine({
            type: "info",
            message: "Login successful.",
            user,
          });
          setTimeout(() => {
            setAlert(null);
            navigate("/");
          }, 3000);
        } else if (response.status === 404) {
          setAlert({
            variant: "error",
            body: "User not found. Please try again.",
          });
          logEngine({
            type: "event",
            message: "User not found. Please try again.",
            user,
          });
          setTimeout(() => setAlert(null), 3000);
        } else if (response.status === 406) {
          setAlert({
            variant: "warning",
            body: "Invalid password. Please try again.",
          });
          logEngine({
            type: "event",
            message: "Invalid password. Please try again.",
            user,
          });
          setTimeout(() => setAlert(null), 3000);
        } else {
          setAlert({
            variant: "error",
            body: "Unexpected response. Please try again.",
          });
          logEngine({
            type: "error",
            message: "Unexpected response. Please try again.",
            user,
          });
          setTimeout(() => setAlert(null), 3000);
        }
      })
      .catch((error) => {
        console.error("Error submitting form:", error);
        setAlert({
          variant: "error",
          body: "An error occurred. Please try again.",
        });
        logEngine({
          type: "error",
          message: `An error occurred: ${error.message}`,
          user,
        });
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
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={true}
          onClick={() => setAlert(null)}
        />
      )}
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
            Log in to your account
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
            />
            <Field
              label="Password"
              isRequired
              placeholder="Enter your password"
              sx={fieldStyles}
              type="password"
              value={values.password}
              onChange={handleChange("password")}
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
                  console.log(values);
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
                  navigate("/forgot-password");
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
                mt: theme.spacing(20),
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  color: theme.palette.secondary.contrastText,
                }}
              >
                Don't have an account?{" "}
                <span
                  style={{
                    color: theme.palette.primary.main,
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    navigate("/user-reg");
                  }}
                >
                  Sign up
                </span>
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
};

export default Login;
