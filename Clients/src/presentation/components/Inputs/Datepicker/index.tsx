import { Stack, Typography, useTheme } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import "./index.css";
import dayjs from "dayjs";
import { DatePickerProps } from "../../../../domain/interfaces/iWidget";
import { DatePickerStyle } from "./style";

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

  return (
    <Stack
      sx={{
        "& fieldset": {
          borderColor: theme.palette.border.dark,
          borderRadius: theme.shape.borderRadius,
        },
        "&:not(:has(.Mui-disabled)):not(:has(.input-error)) .MuiOutlinedInput-root:hover:not(:has(input:focus)):not(:has(textarea:focus)) fieldset":
          {
            borderColor: theme.palette.border.dark,
          },
        "&:has(.input-error) .MuiOutlinedInput-root fieldset": {
          border: error
            ? `1px solid ${theme.palette.status.error.border}!important`
            : `1px solid ${theme.palette.border.dark}!important`,
        },
        ".Mui-focused .MuiOutlinedInput-notchedOutline": {
          border: `1px solid ${theme.palette.border.dark}!important`,
        },
      }}
    >
      {label && (
        <Typography
          color={theme.palette.text.secondary}
          fontSize={13}
          fontWeight={500}
          marginBottom={theme.spacing(2)}
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
            ...sx,
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
