import { Autocomplete, TextField, Typography, useTheme, Stack } from "@mui/material";
import "./index.css";
import { AutoCompleteFieldProps } from "../../../types/widget.types";
import { AutoCompleteOption } from "../../../../domain/interfaces/i.widget";
import { getAutocompleteStyles } from "../../../utils/inputStyles";

function AutoCompleteField({
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
}: AutoCompleteFieldProps) {
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
                    color: theme.palette.primary.main,
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
          const { key: _key, ...optionProps } = props;
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
                  color: theme.palette.primary.main,
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
}

export default AutoCompleteField;
