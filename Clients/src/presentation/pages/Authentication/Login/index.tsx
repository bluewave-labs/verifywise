import { Button, Stack, Typography, useTheme } from "@mui/material";
import { ReactComponent as Background } from "../../../assets/imgs/background-grid.svg";
import Field from "../../../components/Inputs/Field";
import { useState } from "react";
import Checkbox from "../../../components/Inputs/Checkbox";

const Login = () => {
  const [values, setValues] = useState({
    email: "",
    password: "",
  });

  const handleChange =
    (prop: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [prop]: event.target.value });
    };

  const theme = useTheme();

  const buttonStyle = {
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
          Verify<span style={{ color: "#0f604d" }}>Wise</span>
        </Typography>
        <Typography sx={{ fontSize: 16, fontWeight: "bold" }}>
          Log in to your account
        </Typography>
        <Stack sx={{ gap: theme.spacing(7.5) }}>
          <Field
            label="Email"
            isRequired
            placeholder="name.surname@companyname.com"
            sx={buttonStyle}
            type="email"
            value={values.email}
            onChange={handleChange("email")}
          />
          <Field
            label="Password"
            isRequired
            placeholder="Create a password"
            sx={buttonStyle}
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
              isChecked
              value="true"
              onChange={() => {}}
              size="small"
            />
            <Typography
              sx={{
                color: theme.palette.primary.main,
                fontSize: 13,
                fontWeight: "bold",
              }}
            >
              Forgot password
            </Typography>
          </Stack>
          <Button
            disableRipple
            variant="contained"
            sx={{ fontSize: 13, backgroundColor: theme.palette.primary.main }}
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
              sx={{ fontSize: 13, color: theme.palette.secondary.contrastText }}
            >
              Don’t have an account?{" "}
              <span
                style={{
                  color: theme.palette.primary.main,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onClick={() => console.log("Click")}
              >
                Sign up
              </span>
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default Login;
