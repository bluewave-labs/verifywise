/**
 * ProgressUpload component props interface.
 *
 * @interface ProgressUploadProps
 * @property {React.ReactNode} [icon] - Optional icon to display.
 * @property {string} label - Label text to display.
 * @property {string} [size] - Optional size text to display.
 * @property {number} [progress=0] - Progress value (0-100).
 * @property {() => void} onClick - Click handler function.
 * @property {string} [error] - Optional error message to display.
 */

/**
 * ProgressUpload component.
 *
 * This component displays a progress bar with optional icon, label, size, and error message.
 * It also includes a close button with a click handler.
 *
 * @component
 * @param {ProgressUploadProps} props - The props for the component.
 * @returns {JSX.Element} The rendered ProgressUpload component.
 */

import {
  Box,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import "./index.css";

import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";

interface ProgressUploadProps {
  icon?: React.ReactNode;
  label: string;
  size?: string;
  progress?: number;
  onClick: () => void;
  error?: string;
}

const ProgressUpload: React.FC<ProgressUploadProps> = ({
  icon,
  label,
  size,
  progress = 0,
  onClick,
  error,
}) => {
  const theme = useTheme();

  return (
    <Box
      className="progress-bar-container"
      mt={theme.spacing(10)}
      p={theme.spacing(8)}
      sx={{
        minWidth: "200px",
        height: "fit-content",
        borderRadius: theme.shape.borderRadius,
        border: 1,
        borderColor: theme.palette.border.light,
        backgroundColor: theme.palette.background.fill,
        "&:has(.input-error)": {
          borderColor: theme.palette.error.main,
          backgroundColor: theme.palette.error.bg,
          py: theme.spacing(4),
          px: theme.spacing(8),
          "& > .MuiStack-root > svg": {
            fill: theme.palette.error.text,
            width: "20px",
            height: "20px",
          },
        },
      }}
    >
      <Stack
        direction="row"
        mb={error ? 0 : theme.spacing(5)}
        gap={theme.spacing(5)}
        alignItems={error ? "center" : "flex-start"}
      >
        {error ? (
          <ErrorOutlineOutlinedIcon />
        ) : icon ? (
          <Box
            sx={{
              position: "relative",
              height: 30,
              minWidth: 30,
              border: 1,
              borderColor: theme.palette.border.dark,
              borderRadius: 2,
              backgroundColor: theme.palette.background.main,
              "& svg": {
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 23,
                height: 23,
                "& path": {
                  fill: theme.palette.other.icon,
                },
              },
            }}
          >
            {icon}
          </Box>
        ) : (
          ""
        )}
        {error ? (
          <Typography
            className="input-error"
            color={theme.palette.error.text}
          >
            {error}
          </Typography>
        ) : (
          <Box color={theme.palette.text.tertiary}>
            <Typography component="h2" mb={theme.spacing(1.5)}>
              {error ? error : label}
            </Typography>
            <Typography sx={{ opacity: 0.6 }}>
              {!error && size}
            </Typography>
          </Box>
        )}
        <IconButton
          onClick={onClick}
          sx={
            !error
              ? {
                  alignSelf: "flex-start",
                  ml: "auto",
                  mr: theme.spacing(-2.5),
                  mt: theme.spacing(-2.5),
                  padding: theme.spacing(2.5),
                  "&:focus": {
                    outline: "none",
                  },
                }
              : {
                  ml: "auto",
                  "&:focus": {
                    outline: "none",
                  },
                }
          }
        >
          <CloseIcon
            sx={{
              fontSize: "20px",
            }}
          />
        </IconButton>
      </Stack>
      {!error ? (
        <Stack direction="row" alignItems="center">
          <Box sx={{ width: "100%", mr: theme.spacing(5) }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                width: "100%",
                height: "10px",
                borderRadius: theme.shape.borderRadius,
                maxWidth: "500px",
                backgroundColor: theme.palette.border.light,
              }}
            />
          </Box>
          <Typography
            sx={{ minWidth: "max-content", opacity: 0.6 }}
          >
            {progress}
            <span>%</span>
          </Typography>
        </Stack>
      ) : (
        ""
      )}
    </Box>
  );
};

export default ProgressUpload;
