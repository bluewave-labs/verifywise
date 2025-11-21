import { Stack, Typography, useTheme } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import "./index.css";
import dayjs from "dayjs";
import { DatePickerProps } from "../../../../domain/interfaces/iWidget";
import { DatePickerStyle } from "./style";
import { getDatePickerStyles } from "../../../utils/inputStyles";

const DatePicker = ({
  label,
  isRequired,
  isOptional,
  optionalLabel,
  sx,
  date,
  error,
  handleDateChange,
  disabled=false,
}: DatePickerProps) => {
  const theme = useTheme();

  // Extract width, flexGrow, minWidth, maxWidth from sx prop to apply to wrapper Stack
  const extractedLayoutProps = sx && typeof sx === 'object' && !Array.isArray(sx)
    ? {
        width: (sx as any).width,
        flexGrow: (sx as any).flexGrow,
        minWidth: (sx as any).minWidth,
        maxWidth: (sx as any).maxWidth,
      }
    : {};

  // Create a copy of sx without layout props to pass to MuiDatePicker
  const sxWithoutLayoutProps = sx && typeof sx === 'object' && !Array.isArray(sx)
    ? Object.fromEntries(Object.entries(sx).filter(([key]) => !['width', 'flexGrow', 'minWidth', 'maxWidth'].includes(key)))
    : sx;

  return (
    <Stack
      gap={theme.spacing(2)}
      sx={extractedLayoutProps}
    >
      {label && (
        <Typography
          component="p"
          variant="body1"
          color={theme.palette.text.secondary}
          fontWeight={500}
          fontSize={"13px"}
          sx={{ margin: 0, height: '22px' }}
        >
          {label}
          {isRequired ? (
            <Typography
              component="span"
              ml={theme.spacing(1)}
              color={theme.palette.error.text}
            >
              *
            </Typography>
          ) : (
            ""
          )}
          {isOptional ? (
            <Typography
              component="span"
              fontSize="inherit"
              fontWeight={400}
              ml={theme.spacing(2)}
              sx={{ opacity: 0.6 }}
            >
              {optionalLabel || "(optional)"}
            </Typography>
          ) : (
            ""
          )}
        </Typography>
      )}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MuiDatePicker
          className="mui-date-picker"
          sx={{
            ...DatePickerStyle,
            ...getDatePickerStyles(theme, { hasError: !!error }),
            '& .MuiInputBase-root': {
              cursor: 'pointer',
            },
            ...sxWithoutLayoutProps,
          }}
          value={date ? dayjs(date) : null}
          onChange={(value) => handleDateChange(value)}
          format="MM/DD/YYYY"
          disabled={disabled}
        />
      </LocalizationProvider>
      {error && (
        <Typography
          component="span"
          className="input-error"
          color={theme.palette.status.error.text}
          mt={theme.spacing(2)}
          sx={{
            opacity: 0.8,
            fontSize: 11,
          }}
        >
          {error}
        </Typography>
      )}
    </Stack>
  );
};

export default DatePicker;
