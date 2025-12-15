/**
 * AutoCompleteField component props interface.
 *
 * @interface Option
 * @property {string} _id - The unique identifier for the option.
 * @property {string} name - The display name for the option.
 *
 * @interface AutoCompleteFieldProps
 * @property {string} id - The unique identifier for the autocomplete field.
 * @property {string} type - The type of the input field.
 * @property {Option[]} [options] - The list of options for the autocomplete.
 * @property {string} [placeholder] - The placeholder text for the input field.
 * @property {boolean} [disabled] - Whether the autocomplete field is disabled.
 * @property {SxProps<Theme>} [sx] - The style properties for the autocomplete field.
 * @property {number | string} [width] - The width of the input field.
 * @property {AutoCompleteOption | undefined} autoCompleteValue - The current value of the autocomplete field.
 * @property {(value: AutoCompleteOption | undefined) => void} setAutoCompleteValue - The function to set the value of the autocomplete field.
 * @property {string} [error] - The error message to display.
 * @property {boolean} [multiple] - Whether to allow multiple selection.
 * @property {string[] | string} [value] - The value(s) for multiple selection (when using string options).
 * @property {(value: string[] | string) => void} [onChange] - Callback for multiple selection changes.
 * @property {string} [label] - The label for the field.
 * @property {boolean} [isRequired] - Whether the field is required.
 *
 * AutoCompleteField component.
 *
 * @param {AutoCompleteFieldProps} props - The props for the AutoCompleteField component.
 * @returns {JSX.Element} The rendered AutoCompleteField component.
 */

import { Autocomplete, TextField, Typography, useTheme, Stack } from "@mui/material";
import "./index.css";
import { AutoCompleteFieldProps, AutoCompleteOption } from "../../../../domain/interfaces/i.widget";
import { getAutocompleteStyles } from "../../../utils/inputStyles";

const AutoCompleteField: React.FC<AutoCompleteFieldProps> = ({
  id,
  type,
  options = [],
  placeholder = "Type to search",
  disabled,
  sx,
  width,
  autoCompleteValue,
  setAutoCompleteValue,
  error,
  multiple = false,
  value,
  onChange,
  label,
  isRequired = false,
}) => {
  const theme = useTheme();

  // For multiple selection with string options
  if (multiple && options.length > 0 && typeof options[0] === 'string') {
    const stringOptions = options as string[];
    const stringValue = (value || []) as string[];

    return (
      <Stack gap={theme.spacing(2)} sx={sx}>
        {label && (
          <Typography
            component="p"
            variant="body1"
            color={theme.palette.text.secondary}
            fontWeight={500}
            fontSize={"13px"}
            sx={{
              margin: 0,
              height: '22px',
              display: "flex",
              alignItems: "center",
            }}
          >
            {label}
            {isRequired && (
              <Typography
                component="span"
                ml={theme.spacing(1)}
                color={theme.palette.error.text}
              >
                *
              </Typography>
            )}
          </Typography>
        )}
        <Autocomplete
          multiple
          id={id}
          options={stringOptions}
          value={stringValue}
          onChange={(_event, newValue) => {
            onChange?.(newValue);
          }}
          disabled={disabled}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder={placeholder}
              error={!!error}
              sx={{
                "& .MuiOutlinedInput-root": {
                  minHeight: "34px",
                  paddingTop: "2px !important",
                  paddingBottom: "2px !important",
                },
                "& ::placeholder": {
                  fontSize: "13px",
                },
              }}
            />
          )}
          sx={{
            ...getAutocompleteStyles(theme, { hasError: !!error }),
            width: "100%",
            backgroundColor: theme.palette.background.main,
            "& .MuiOutlinedInput-root": {
              borderRadius: theme.shape.borderRadius,
            },
            "& .MuiChip-root": {
              borderRadius: theme.shape.borderRadius,
              height: "22px",
              margin: "1px 2px",
              fontSize: "13px",
            },
          }}
          slotProps={{
            popper: {
              sx: {
                "& ul": { p: 0 },
                "& li": {
                  fontSize: 13,
                  borderRadius: theme.shape.borderRadius,
                  transition: "color 0.2s ease, background-color 0.2s ease",
                  "&:hover": {
                    color: "#13715B",
                    backgroundColor: theme.palette.background.accent,
                  },
                },
              },
            },
            paper: {
              sx: {
                p: 2,
                fontSize: 13,
                borderRadius: theme.shape.borderRadius,
                boxShadow: theme.boxShadow,
              },
            },
          }}
        />
        {error && (
          <Typography
            className="input-error"
            color={theme.palette.status.error.text}
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
  }

  // Original single selection with object options
  return (
    <>
      <Autocomplete
        sx={{
          ...getAutocompleteStyles(theme, { hasError: !!error }),
          cursor: 'pointer',
          ...sx,
        }}
        className="auto-complete-field"
        id={id}
        value={autoCompleteValue}
        onChange={(_, newValue) => {
          setAutoCompleteValue?.(newValue);
        }}
        options={options as AutoCompleteOption[]}
        getOptionLabel={(option) => (option && option.name ? option.name : "")}
        disableClearable
        disabled={disabled}
        isOptionEqualToValue={(option, value) => option._id === value._id}
        renderInput={(params) => (
          <TextField
            error={!!error}
            {...params}
            type={type}
            placeholder={placeholder}
            InputProps={{
              ...params.InputProps,
              readOnly: true,
              sx: {
                width: width,
                height: 34,
                fontSize: 13,
                p: 0,
                borderRadius: theme.shape.borderRadius,
                "& input": {
                  p: 0,
                },
                "&.Mui-disabled input": {
                  cursor: "default",
                },
              },
            }}
          />
        )}
        renderOption={(props, option) => {
          const { key, ...optionProps } = props;
          return (
            <li key={option._id} {...optionProps}>
              <div>{<span>{option.name}</span>}</div>
            </li>
          );
        }}
        slotProps={{
          popper: {
            sx: {
              "& ul": { p: 0 },
              "& li": {
                borderRadius: theme.shape.borderRadius,
                transition: "color 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                  color: "#13715B",
                },
              },
            },
          },
          paper: {
            sx: {
              p: 2,
              fontSize: 13,
            },
          },
        }}
      />
      {error && (
        <Typography
          component="span"
          className="input-error"
          color={theme.palette.error.main}
          mt={theme.spacing(2)}
          sx={{
            opacity: 0.8,
            fontSize: 13,
          }}
        >
          {error}
        </Typography>
      )}
    </>
  );
};

export default AutoCompleteField;
