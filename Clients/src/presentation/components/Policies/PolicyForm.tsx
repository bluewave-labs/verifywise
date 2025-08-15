import { Stack, Grid, Typography, useTheme, Autocomplete, Box, TextField } from "@mui/material";
import Field from "../Inputs/Field";
import Select from "../Inputs/Select";
import DatePicker from "../Inputs/Datepicker";
import dayjs, { Dayjs } from "dayjs";
import { User } from "../../../domain/types/User";
import useUsers from "../../../application/hooks/useUsers";
import { KeyboardArrowDown } from "@mui/icons-material";
import { useCallback, useEffect, useState } from "react";
import { getAllTags } from "../../../application/repository/policy.repository";
import { checkStringValidation } from "../../../application/validations/stringValidation";
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

const PolicyForm: React.FC<Props> = ({ formData, setFormData, tags, errors, setErrors }) => {
  const theme = useTheme();
  const { users } = useUsers();
  // const [tags, setTags] = useState<string[]>([]);

  // useEffect(() => {
  //   async function fetchTags() {
  //     const tags = await getAllTags();
  //     setTags(tags);
  //   }

  //   fetchTags();
  // }, []);

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
      <Stack
        sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}
      >
        <Stack sx={{ gap: 4, width: "50%" }}>
          <Field
            id="policy-title-input"
            label="Policy title"
            width="350px"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            error={errors.title}
            sx={{
              backgroundColor: "#FFFFFF",
              "& input": {
                padding: "0 14px"
              },
            }}
            isRequired
          />
          <Stack>
            <Typography
              sx={{
                fontSize: theme.typography.fontSize,
                fontWeight: 500,
                mb: 2,
              }}
            >
              Team members
            </Typography>
            <Autocomplete
              multiple
              id="users-input"
              size="small"
              value={formData.assignedReviewers.map((user) => ({
                id: Number(user.id),
                name: user.name,
                surname: user.surname,
                email: user.email,
              }))}
              options={
                users.filter((user) => 
                  !formData.assignedReviewers.some((u) => u.id === user.id
                )).map((user) => ({
                  id: user.id,
                  name: user.name,
                  surname: user.surname,
                  email: user.email,
                })) || []
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
              popupIcon={<KeyboardArrowDown />}
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
                ...{
                  width: "350px",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "3px",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "none",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#888",
                      borderWidth: "1px",
                    },
                  },
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
        <Stack sx={{ gap: 4, width: "50%" }}>
          <Select
            id="status-input"
            label="Status"
            placeholder="Select status"
            value={formData.status || ""}
            onChange={(e) => {
              const statusValue = e.target.value;
              if (typeof statusValue === 'string') {
                setFormData((prev) => ({ ...prev, status: statusValue }));
              }
            }}
            items={statuses.map((s) => ({ _id: s, name: s }))}
            sx={{
              width: "372px",
              backgroundColor: theme.palette.background.main,
            }}
            error={errors.status}
            isRequired
          />
          <DatePicker
            label="Next review date"
            date={
              formData.nextReviewDate
                ? dayjs(formData.nextReviewDate)
                : null
            }
            handleDateChange={handleDateChange}
            sx={{
              width: "130px",
              "& input": { width: "85px" },
            }}
            isRequired
            error={errors.nextReviewDate}
          />
        </Stack>
      </Stack>
      <Stack>
        <Stack sx={{ width: "100%" }}>
            <Typography
              sx={{
                fontSize: theme.typography.fontSize,
                fontWeight: 500,
                mb: 2,
              }}
            >
              Tags
            </Typography>
            <Autocomplete
              multiple
              id="users-input"
              size="small"
              value={formData.tags}
              options={
                tags.filter(
                  (tag) => !formData.tags.some((t) => t === tag)
                )
              }
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
                    <Typography sx={{ fontSize: "13px" }}>
                      {option}
                    </Typography>
                  </Box>
                );
              }}
              filterSelectedOptions
              popupIcon={<KeyboardArrowDown />}
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
                ...{
                  // width: "350px",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "3px",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "none",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#888",
                      borderWidth: "1px",
                    },
                  },
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
    </Stack>
  );
};

export default PolicyForm;
