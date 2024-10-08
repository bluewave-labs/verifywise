import { Stack, SxProps, Theme, Typography, useTheme } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import "./index.css";

interface DatePickerProps {
  label?: string;
  isRequired?: boolean;
  isOptional?: boolean;
  optionalLabel?: string;
  sx?: SxProps<Theme> | undefined;
}

const DatePicker = ({
  label,
  isRequired,
  isOptional,
  optionalLabel,
  sx,
}: DatePickerProps) => {
  const theme = useTheme();
  return (
    <Stack
      sx={{
        "& fieldset": {
          borderColor: theme.palette.border,
          borderRadius: theme.shape.borderRadius,
          boxShadow: theme.boxShadow
        },
        "&:not(:has(.Mui-disabled)):not(:has(.input-error)) .MuiOutlinedInput-root:hover:not(:has(input:focus)):not(:has(textarea:focus)) fieldset":
          {
            borderColor: theme.palette.border,
          },
        "&:has(.input-error) .MuiOutlinedInput-root fieldset": {
          borderColor: theme.palette.error.text,
        },
      }}
    >
      {label && (
        <Typography
          component="h3"
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
        <MuiDatePicker className="mui-date-picker" sx={sx} />
      </LocalizationProvider>
    </Stack>
  );
};

export default DatePicker;
