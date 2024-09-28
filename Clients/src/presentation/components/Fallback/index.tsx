import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import "./index.css";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { ReactComponent as Skeleton } from "../../assets/imgs/create-placeholder.svg";
import { ReactComponent as SkeletonDark } from "../../assets/imgs/create-placeholder-dark.svg";
import { ReactComponent as Background } from "../../assets/imgs/background-grid.svg";
import Check from "../Checks";

import { FC } from "react";

interface FallbackProps {
  title: string;
  checks: string[];
  link?: string;
  isAdmin: boolean;
}

const Fallback: FC<FallbackProps> = ({
  title,
  checks,
  link = "/",
  isAdmin,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const mode = useSelector((state: any) => state.ui.mode);

  return (
    <Stack
      className={`fallback__${title.trim().split(" ")[0]}`}
      alignItems="center"
      gap={theme.spacing(20)}
    >
      {mode === "light" ? (
        <Skeleton style={{ zIndex: 1 }} />
      ) : (
        <SkeletonDark style={{ zIndex: 1 }} />
      )}
      <Box
        className="background-pattern-svg"
        sx={{
          "& svg g g:last-of-type path": {
            stroke: theme.palette.border.light,
          },
        }}
      >
        <Background style={{ width: "100%" }} />
      </Box>
      <Stack gap={theme.spacing(4)} maxWidth={"275px"} zIndex={1}>
        <Typography
          component="h1"
          marginY={theme.spacing(4)}
          color={theme.palette.text.tertiary}
        >
          A {title} is used to:
        </Typography>
        {checks.map((check: string, index: number) => (
          <Check
            text={check}
            key={`${title.trim().split(" ")[0]}-${index}`}
            outlined={true}
          />
        ))}
        {isAdmin && (
          <Button
            variant="contained"
            color="primary"
            sx={{ alignSelf: "center" }}
            onClick={() => navigate(link)}
          >
            Let's create your {title}
          </Button>
        )}
      </Stack>
    </Stack>
  );
};

export default Fallback;
