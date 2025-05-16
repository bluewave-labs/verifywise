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
 *
 * AutoCompleteField component.
 *
 * @param {AutoCompleteFieldProps} props - The props for the AutoCompleteField component.
 * @returns {JSX.Element} The rendered AutoCompleteField component.
 */

import { Autocomplete, TextField, Typography, useTheme } from "@mui/material";
import "./index.css";
import { AutoCompleteFieldProps } from "../../../../domain/interfaces/iWidget";

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
}) => {
  const theme = useTheme();

  return (
    <>
      <Autocomplete
        sx={sx}
        className="auto-complete-field"
        id={id}
        value={autoCompleteValue}
        onChange={(_, newValue) => {
          setAutoCompleteValue(newValue);
        }}
        options={options}
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
              "& li": { borderRadius: theme.shape.borderRadius },
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
