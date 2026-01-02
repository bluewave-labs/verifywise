import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  Chip,
  OutlinedInput,
} from "@mui/material";
import { Controller, Control, FieldErrors } from "react-hook-form";

/**
 * Field type definition
 */
type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "checkbox"
  | "date"
  | "email"
  | "url"
  | "number";

/**
 * Field option interface
 */
interface FieldOption {
  label: string;
  value: string;
}

/**
 * Field validation interface
 */
interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

/**
 * Form field interface
 */
interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  validation?: FieldValidation;
  options?: FieldOption[];
  defaultValue?: string | number | boolean | string[];
}

/**
 * Props for FormFieldRenderer
 */
interface FormFieldRendererProps {
  field: FormField;
  control: Control<Record<string, unknown>>;
  errors: FieldErrors<Record<string, unknown>>;
}

/**
 * Renders a single form field based on its type
 */
export function FormFieldRenderer({ field, control, errors }: FormFieldRendererProps) {
  const error = errors[field.id];
  const errorMessage = error?.message as string | undefined;
  const isRequired = field.validation?.required;

  const commonSx = {
    "& .MuiOutlinedInput-root": {
      fontSize: "14px",
      borderRadius: "4px",
      "& fieldset": { borderColor: "#d0d5dd" },
      "&:hover fieldset": { borderColor: "#9ca3af" },
      "&.Mui-focused fieldset": { borderColor: "#13715B" },
      "&.Mui-error fieldset": { borderColor: "#ef4444" },
    },
    "& .MuiInputLabel-root": {
      fontSize: "14px",
      "&.Mui-focused": { color: "#13715B" },
      "&.Mui-error": { color: "#ef4444" },
    },
  };

  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "url":
        return (
          <Controller
            name={field.id}
            control={control}
            defaultValue={field.defaultValue || ""}
            rules={{
              required: isRequired ? "This field is required" : false,
              minLength: field.validation?.minLength
                ? { value: field.validation.minLength, message: `Minimum ${field.validation.minLength} characters` }
                : undefined,
              maxLength: field.validation?.maxLength
                ? { value: field.validation.maxLength, message: `Maximum ${field.validation.maxLength} characters` }
                : undefined,
              pattern: field.validation?.pattern
                ? { value: new RegExp(field.validation.pattern), message: field.validation.patternMessage || "Invalid format" }
                : undefined,
            }}
            render={({ field: fieldProps }) => (
              <TextField
                {...fieldProps}
                fullWidth
                label={field.label}
                placeholder={field.placeholder}
                type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
                error={!!error}
                helperText={errorMessage || field.helpText}
                required={isRequired}
                sx={commonSx}
              />
            )}
          />
        );

      case "textarea":
        return (
          <Controller
            name={field.id}
            control={control}
            defaultValue={field.defaultValue || ""}
            rules={{
              required: isRequired ? "This field is required" : false,
              minLength: field.validation?.minLength
                ? { value: field.validation.minLength, message: `Minimum ${field.validation.minLength} characters` }
                : undefined,
              maxLength: field.validation?.maxLength
                ? { value: field.validation.maxLength, message: `Maximum ${field.validation.maxLength} characters` }
                : undefined,
            }}
            render={({ field: fieldProps }) => (
              <TextField
                {...fieldProps}
                fullWidth
                multiline
                rows={4}
                label={field.label}
                placeholder={field.placeholder}
                error={!!error}
                helperText={errorMessage || field.helpText}
                required={isRequired}
                sx={commonSx}
              />
            )}
          />
        );

      case "number":
        return (
          <Controller
            name={field.id}
            control={control}
            defaultValue={field.defaultValue || ""}
            rules={{
              required: isRequired ? "This field is required" : false,
              min: field.validation?.min !== undefined
                ? { value: field.validation.min, message: `Minimum value is ${field.validation.min}` }
                : undefined,
              max: field.validation?.max !== undefined
                ? { value: field.validation.max, message: `Maximum value is ${field.validation.max}` }
                : undefined,
            }}
            render={({ field: fieldProps }) => (
              <TextField
                {...fieldProps}
                fullWidth
                type="number"
                label={field.label}
                placeholder={field.placeholder}
                error={!!error}
                helperText={errorMessage || field.helpText}
                required={isRequired}
                sx={commonSx}
              />
            )}
          />
        );

      case "date":
        return (
          <Controller
            name={field.id}
            control={control}
            defaultValue={field.defaultValue || ""}
            rules={{
              required: isRequired ? "This field is required" : false,
            }}
            render={({ field: fieldProps }) => (
              <TextField
                {...fieldProps}
                fullWidth
                type="date"
                label={field.label}
                error={!!error}
                helperText={errorMessage || field.helpText}
                required={isRequired}
                InputLabelProps={{ shrink: true }}
                sx={commonSx}
              />
            )}
          />
        );

      case "select":
        return (
          <Controller
            name={field.id}
            control={control}
            defaultValue={field.defaultValue || ""}
            rules={{
              required: isRequired ? "This field is required" : false,
            }}
            render={({ field: fieldProps }) => (
              <FormControl fullWidth error={!!error} required={isRequired}>
                <InputLabel sx={{ fontSize: "14px", "&.Mui-focused": { color: "#13715B" } }}>
                  {field.label}
                </InputLabel>
                <Select
                  {...fieldProps}
                  label={field.label}
                  sx={{
                    fontSize: "14px",
                    borderRadius: "4px",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d0d5dd" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9ca3af" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#13715B" },
                  }}
                >
                  {field.options?.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{errorMessage || field.helpText}</FormHelperText>
              </FormControl>
            )}
          />
        );

      case "multiselect":
        return (
          <Controller
            name={field.id}
            control={control}
            defaultValue={field.defaultValue || []}
            rules={{
              required: isRequired ? "This field is required" : false,
            }}
            render={({ field: fieldProps }) => (
              <FormControl fullWidth error={!!error} required={isRequired}>
                <InputLabel sx={{ fontSize: "14px", "&.Mui-focused": { color: "#13715B" } }}>
                  {field.label}
                </InputLabel>
                <Select
                  {...fieldProps}
                  multiple
                  label={field.label}
                  input={<OutlinedInput label={field.label} />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const option = field.options?.find((o) => o.value === value);
                        return (
                          <Chip
                            key={value}
                            label={option?.label || value}
                            size="small"
                            sx={{ height: 24, fontSize: "12px" }}
                          />
                        );
                      })}
                    </Box>
                  )}
                  sx={{
                    fontSize: "14px",
                    borderRadius: "4px",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d0d5dd" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9ca3af" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#13715B" },
                  }}
                >
                  {field.options?.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{errorMessage || field.helpText}</FormHelperText>
              </FormControl>
            )}
          />
        );

      case "checkbox":
        return (
          <Controller
            name={field.id}
            control={control}
            defaultValue={field.defaultValue || false}
            rules={{
              required: isRequired ? "This field is required" : false,
            }}
            render={({ field: fieldProps }) => (
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      {...fieldProps}
                      checked={!!fieldProps.value}
                      sx={{
                        color: "#d0d5dd",
                        "&.Mui-checked": { color: "#13715B" },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: "14px", color: "#1f2937" }}>
                      {field.label}
                      {isRequired && <span style={{ color: "#ef4444" }}> *</span>}
                    </Typography>
                  }
                />
                {(errorMessage || field.helpText) && (
                  <FormHelperText error={!!error} sx={{ ml: 4 }}>
                    {errorMessage || field.helpText}
                  </FormHelperText>
                )}
              </Box>
            )}
          />
        );

      default:
        return null;
    }
  };

  return <Box sx={{ mb: 2.5 }}>{renderField()}</Box>;
}

export default FormFieldRenderer;
