/**
 * A customizable select field component that matches the Field component's styling.
 * Provides consistent styling with text inputs for organization selection.
 */

import {
  Select,
  MenuItem,
  Stack,
  Typography,
  useTheme,
  SelectChangeEvent,
} from "@mui/material";
import { getInputStyles } from "../../../utils/inputStyles";

interface SelectFieldProps {
  id?: string;
  label?: string;
  isRequired?: boolean;
  isOptional?: boolean;
  optionalLabel?: string;
  placeholder?: string;
  value: string | number;
  onChange: (event: SelectChangeEvent<string | number>) => void;
  options: Array<{ id: number | string; name: string }>;
  error?: string;
  disabled?: boolean;
  width?: string | number;
  sx?: any;
  loading?: boolean;
}

const SelectField = ({
  id,
  label,
  isRequired,
  isOptional,
  optionalLabel,
  placeholder,
  value,
  onChange,
  options,
  error,
  disabled,
  width,
  sx,
  loading = false,
}: SelectFieldProps) => {
  const theme = useTheme();

  const rootSx = sx;

  return (
    <Stack
      gap={theme.spacing(2)}
      className="field field-select"
      sx={{
        ...getInputStyles(theme, { hasError: !!error }),
        width: width,
        ...(rootSx || {}),
      }}
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
      <Select
        id={id}
        value={value || ''}
        onChange={onChange}
        disabled={disabled || loading}
        displayEmpty
        renderValue={(selected) => {
          if (!selected || selected === '') {
            return (
              <Typography sx={{ color: theme.palette.text.disabled, fontSize: 13 }}>
                {loading ? 'Loading organizations...' : placeholder || 'Select an option'}
              </Typography>
            );
          }
          const selectedOption = options.find((opt) => opt.id === selected);
          return selectedOption ? selectedOption.name : '';
        }}
        sx={{
          color: theme.palette.text.secondary,
          fontSize: 13,
          '& .MuiSelect-select': {
            padding: '10px 12px',
            minHeight: 'auto',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.border.light,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.border.dark,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: 1,
          },
          '&.Mui-disabled': {
            backgroundColor: theme.palette.background.accent,
          },
        }}
      >
        {options.length === 0 ? (
          <MenuItem value="" disabled sx={{ fontSize: 13 }}>
            {loading ? 'Loading organizations...' : 'No organizations available'}
          </MenuItem>
        ) : (
          options.map((option) => (
            <MenuItem key={option.id} value={option.id} sx={{ fontSize: 13 }}>
              {option.name}
            </MenuItem>
          ))
        )}
      </Select>
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

export default SelectField;
