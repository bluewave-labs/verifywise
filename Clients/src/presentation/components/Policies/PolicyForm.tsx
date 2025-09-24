import {
  Stack,
  Typography,
  useTheme,
  Autocomplete,
  Box,
  TextField,
} from "@mui/material";
import Field from "../Inputs/Field";
import Select from "../Inputs/Select";
import DatePicker from "../Inputs/Datepicker";
import dayjs, { Dayjs } from "dayjs";
import { User } from "../../../domain/types/User";
import useUsers from "../../../application/hooks/useUsers";
import { ReactComponent as GreyDownArrowIcon } from "../../assets/icons/chevron-down-grey.svg";
import { useCallback } from "react";
import { FormErrors } from "./PolicyDetailsModal";

export interface FormData {
  title: string;
  status: string;
  tags: string[];
  nextReviewDate?: string;
  assignedReviewers: User[];
  content: any;
}

interface Props {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  tags: string[];
  errors: FormErrors;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
}

const statuses: FormData["status"][] = [
  "Draft",
  "In review",
  "Approved",
  "Published",
  "Archived",
];

const PolicyForm: React.FC<Props> = ({ formData, setFormData, tags, errors }) => {
  const theme = useTheme();
  const { users } = useUsers();

  const handleOnMultiSelect = useCallback(
    (prop: keyof FormData) =>
      (_event: React.SyntheticEvent, newValue: any[]) => {
        setFormData((prevValues) => ({
          ...prevValues,
          [prop]: newValue,
        }));
      },
    []
  );

  const handleDateChange = useCallback((newDate: Dayjs | null) => {
    if (newDate?.isValid()) {
      setFormData((prevValues: any) => ({
        ...prevValues,
        nextReviewDate: newDate ? newDate.toISOString() : "",
      }));
    }
  }, []);

  return (
    <Stack spacing={4}>
      {/* Policy Title */}
      <Field
        id="policy-title-input"
        label="Policy title"
        width="100%"
        value={formData.title}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, title: e.target.value }))
        }
        error={errors.title}
        sx={{
          backgroundColor: "#FFFFFF",
          "& input": {
            padding: "0 14px",
          },
        }}
        isRequired
      />

      {/* Team Members + Tags */}
      <Stack direction="row" justifyContent="space-between" spacing={4}>
        {/* Team Members */}
        <Stack sx={{ gap: 2, width: "50%" }}>
          <Typography sx={{ fontSize: theme.typography.fontSize, fontWeight: 500 }}>
            Team members
          </Typography>
          <Autocomplete
            multiple
            id="users-input"
            size="small"
            value={formData.assignedReviewers}
            options={
              users.filter((user) =>
                !formData.assignedReviewers.some((u) => u.id === user.id)
              ) || []
            }
            noOptionsText={
              formData.assignedReviewers.length === users.length
                ? "All members selected"
                : "No options"
            }
            onChange={handleOnMultiSelect("assignedReviewers")}
            getOptionLabel={(user) => `${user.name} ${user.surname}`}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              const userEmail =
                option.email.length > 30
                  ? `${option.email.slice(0, 30)}...`
                  : option.email;
              return (
                <Box key={key} component="li" {...optionProps}>
                  <Typography sx={{ fontSize: "13px" }}>
                    {option.name} {option.surname}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "11px",
                      color: "rgb(157, 157, 157)",
                      position: "absolute",
                      right: "9px",
                    }}
                  >
                    {userEmail}
                  </Typography>
                </Box>
              );
            }}
            filterSelectedOptions
            popupIcon={<GreyDownArrowIcon />}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select Users"
                error={!!errors.assignedReviewers}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    paddingTop: "3.8px !important",
                    paddingBottom: "3.8px !important",
                  },
                  "& ::placeholder": {
                    fontSize: "13px",
                  },
                }}
              />
            )}
            sx={{
              backgroundColor: theme.palette.background.main,
              width: "100%",
              "& .MuiOutlinedInput-root": {
                borderRadius: "3px",
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#888",
                  borderWidth: "1px",
                },
              },
              "& .MuiChip-root": {
                borderRadius: theme.shape.borderRadius,
              },
            }}
            slotProps={{
              paper: {
                sx: {
                  "& .MuiAutocomplete-listbox": {
                    "& .MuiAutocomplete-option": {
                      fontSize: "13px",
                      color: "#1c2130",
                      paddingLeft: "9px",
                      paddingRight: "9px",
                    },
                    "& .MuiAutocomplete-option.Mui-focused": {
                      background: "#f9fafb",
                    },
                  },
                  "& .MuiAutocomplete-noOptions": {
                    fontSize: "13px",
                    paddingLeft: "9px",
                    paddingRight: "9px",
                  },
                },
              },
            }}
          />
        </Stack>

        {/* Tags */}
        <Stack sx={{ gap: 2, width: "50%" }}>
          <Typography sx={{ fontSize: theme.typography.fontSize, fontWeight: 500 }}>
            Tags
          </Typography>
          <Autocomplete
            multiple
            id="tags-input"
            size="small"
            value={formData.tags}
            options={tags.filter((tag) => !formData.tags.includes(tag))}
            noOptionsText={
              formData.tags.length === tags.length
                ? "All tags selected"
                : "No options"
            }
            onChange={handleOnMultiSelect("tags")}
            getOptionLabel={(tag) => tag}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <Box key={key} component="li" {...optionProps}>
                  <Typography sx={{ fontSize: "13px" }}>{option}</Typography>
                </Box>
              );
            }}
            filterSelectedOptions
            popupIcon={<GreyDownArrowIcon />}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select Tags"
                error={!!errors.tags}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    paddingTop: "3.8px !important",
                    paddingBottom: "3.8px !important",
                  },
                  "& ::placeholder": {
                    fontSize: "13px",
                  },
                }}
              />
            )}
            sx={{
              backgroundColor: theme.palette.background.main,
              width: "100%",
              "& .MuiOutlinedInput-root": {
                borderRadius: "3px",
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#888",
                  borderWidth: "1px",
                },
              },
              "& .MuiChip-root": {
                borderRadius: theme.shape.borderRadius,
              },
            }}
            slotProps={{
              paper: {
                sx: {
                  "& .MuiAutocomplete-listbox": {
                    "& .MuiAutocomplete-option": {
                      fontSize: "13px",
                      color: "#1c2130",
                      paddingLeft: "9px",
                      paddingRight: "9px",
                    },
                    "& .MuiAutocomplete-option.Mui-focused": {
                      background: "#f9fafb",
                    },
                  },
                  "& .MuiAutocomplete-noOptions": {
                    fontSize: "13px",
                    paddingLeft: "9px",
                    paddingRight: "9px",
                  },
                },
              },
            }}
          />
        </Stack>
      </Stack>

      {/* Status + Next Review Date */}
      <Stack direction="row" justifyContent="space-between" spacing={4}>
        {/* Status */}
        <Stack sx={{ width: "50%" }}>
          <Select
            id="status-input"
            label="Status"
            placeholder="Select status"
            value={formData.status || ""}
            onChange={(e) => {
              const statusValue = e.target.value;
              if (typeof statusValue === "string") {
                setFormData((prev) => ({ ...prev, status: statusValue }));
              }
            }}
            items={statuses.map((s) => ({ _id: s, name: s }))}
            sx={{
              width: "100%",
              backgroundColor: theme.palette.background.main,
            }}
            error={errors.status}
            isRequired
          />
        </Stack>

        {/* Next Review Date */}
        <Stack sx={{ width: "50%" }}>
          <DatePicker
            label="Next review date"
            date={formData.nextReviewDate ? dayjs(formData.nextReviewDate) : null}
            handleDateChange={handleDateChange}
            sx={{
              width: "100%",
              "& input": { width: "85px" },
            }}
            isRequired
            error={errors.nextReviewDate}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default PolicyForm;
