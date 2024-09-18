import {
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import "./index.css";
import { forwardRef, useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import { ForwardedRef } from "react";

interface FieldProps {
  type?: string;
  id?: string;
  label?: string;
  https?: boolean;
  isRequired?: boolean;
  isOptional?: boolean;
  optionalLabel?: string;
  autoComplete?: string;
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onInput?: (event: React.FormEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
}

const Field = forwardRef(
  (
    {
      type = "text",
      id,
      label,
      https,
      isRequired,
      isOptional,
      optionalLabel,
      autoComplete,
      placeholder,
      value,
      onChange,
      onInput,
      error,
      disabled,
    }: FieldProps,
    ref: ForwardedRef<HTMLInputElement>
  ) => {
    const theme = useTheme();

    const [isVisible, setVisible] = useState(false);

    return (
      <Stack
        gap={theme.spacing(2)}
        className={`field field-${type}`}
        sx={{
          "& fieldset": {
            borderColor: theme.palette.border,
            borderRadius: theme.shape.borderRadius,
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
            fontWeight={500}
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
        <TextField
          type={type === "password" ? (isVisible ? "text" : type) : type}
          id={id}
          autoComplete={autoComplete}
          placeholder={placeholder}
          multiline={type === "description"}
          rows={type === "description" ? 4 : 1}
          value={value}
          onInput={onInput}
          onChange={onChange}
          disabled={disabled}
          inputRef={ref}
          inputProps={{
            sx: {
              color: theme.palette.text.secondary,
              "&:-webkit-autofill": {
                WebkitBoxShadow: `0 0 0 100px ${theme.palette.background.fill} inset`,
                WebkitTextFillColor: theme.palette.text.secondary,
              },
            },
          }}
          sx={
            type === "url"
              ? {
                  "& .MuiInputBase-root": { padding: 0 },
                  "& .MuiStack-root": {
                    borderTopLeftRadius: theme.shape.borderRadius,
                    borderBottomLeftRadius: theme.shape.borderRadius,
                  },
                }
              : {}
          }
          InputProps={{
            startAdornment: type === "url" && (
              <Stack
                direction="row"
                alignItems="center"
                height="100%"
                sx={{
                  borderRight: `solid 1px ${theme.palette.border}`,
                  backgroundColor: theme.palette.background.accent,
                  pl: theme.spacing(6),
                }}
              >
                <Typography
                  component="h5"
                  color={theme.palette.text.secondary}
                  sx={{ lineHeight: 1 }}
                >
                  {https ? "https" : "http"}://
                </Typography>
              </Stack>
            ),
            endAdornment: type === "password" && (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setVisible((show) => !show)}
                  tabIndex={-1}
                  sx={{
                    color: theme.palette.border,
                    padding: theme.spacing(1),
                    "&:focus": {
                      outline: "none",
                    },
                    "& .MuiTouchRipple-root": {
                      pointerEvents: "none",
                      display: "none",
                    },
                  }}
                >
                  {!isVisible ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {error && (
          <Typography
            component="span"
            className="input-error"
            color={theme.palette.error.text}
            mt={theme.spacing(2)}
            sx={{
              opacity: 0.8,
            }}
          >
            {error}
          </Typography>
        )}
      </Stack>
    );
  }
);

export default Field;
