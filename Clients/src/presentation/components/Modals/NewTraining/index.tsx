import React, { FC, useState, useMemo, useCallback } from "react";
import {
  Button,
  Stack,
  useTheme,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from "@mui/material";
import { Suspense, lazy } from "react";
const Field = lazy(() => import("../../Inputs/Field"));
import Select from "../../Inputs/Select";

interface NewTrainingProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: (data: any) => void;
}

type StatusType = "Planned" | "In Progress" | "Completed";

interface NewTrainingFormValues {
  training_name: string;
  duration: number;
  provider: string;
  department: string;
  status: StatusType;
  numberOfPeople: number;
  description: string;
}

interface NewTrainingFormErrors {
  training_name?: string;
  duration?: number;
  provider?: string;
  department?: string;
  status?: string;
  numberOfPeople?: number;
  description?: string;
}

const initialState: NewTrainingFormValues = {
  training_name: "",
  duration:0,
  provider: "",
  department: "",
  status: "Planned",
  numberOfPeople: 0,
  description: "",
};

const statusOptions = [
  { _id: "Planned", name: "Planned" },
  { _id: "In Progress", name: "In Progress" },
  { _id: "Completed", name: "Completed" },
];

const NewTraining: FC<NewTrainingProps> = ({ isOpen, setIsOpen, onSuccess }) => {
  const theme = useTheme();
  const [values, setValues] = useState<NewTrainingFormValues>(initialState);
  const [errors, setErrors] = useState<NewTrainingFormErrors>({});

  const handleOnTextFieldChange = useCallback(
    (prop: keyof NewTrainingFormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setValues({ ...values, [prop]: event.target.value });
        setErrors({ ...errors, [prop]: "" });
      },
    [values, errors]
  );

  const handleOnSelectChange = useCallback(
    (prop: keyof NewTrainingFormValues) =>
      (event: any) => {
        setValues({ ...values, [prop]: event.target.value });
        setErrors({ ...errors, [prop]: "" });
      },
    [values, errors]
  );

  // const handleStatusChange = useCallback((newStatus: string) => {
  //   setValues((prev) => ({ ...prev, status: newStatus as StatusType }));
  //   setErrors((prev) => ({ ...prev, status: "" }));
  // }, []);
const handleOnChange = (field: string, value: string | number) => {
    setValues((prevValues) => ({
      ...prevValues,
      [field]: value,
    }));
    setErrors({ ...errors, [field]: "Error setting the Status" });
  };


  const validateForm = (): boolean => {
    const newErrors: NewTrainingFormErrors = {};
    if (!values.training_name.trim()) {
      newErrors.training_name = "Training name is required.";
    }
    if (!values.duration.trim() || isNaN(Number(values.duration))) {
      newErrors.duration = "Duration is required and must be a number.";
    }
    if (!values.provider.trim()) {
      newErrors.provider = "Provider is required.";
    }
    if (!values.department.trim()) {
      newErrors.department = "Department is required.";
    }
    if (!values.status) {
      newErrors.status = "Status is required.";
    }
    if (
      values.numberOfPeople === undefined ||
      values.numberOfPeople === null ||
      isNaN(Number(values.numberOfPeople)) ||
      Number(values.numberOfPeople) < 1
    ) {
      newErrors.numberOfPeople = "Number of people is required and must be a positive number.";
    }
    if (!values.description.trim() || values.description.length < 10) {
      newErrors.description = "Description is required and should be at least 10 characters.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setIsOpen(false);
    setValues(initialState);
    setErrors({});
  };

  const handleSubmit = (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (validateForm()) {
      if (onSuccess) {
        onSuccess({
          ...values,
          duration: Number(values.duration),
          numberOfPeople: Number(values.numberOfPeople),
        });
      }
      handleClose();
    }
  };

  const fieldStyle = useMemo(
    () => ({
      backgroundColor: theme.palette.background.main,
      "& input": {
        padding: "0 14px",
      },
    }),
    [theme.palette.background.main]
  );

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ borderBottom: "1px solid #E0E0E0", paddingBottom: theme.spacing(2) }}>
          New Training
        </DialogTitle>
        <DialogContent sx={{ paddingTop: theme.spacing(3), paddingBottom: theme.spacing(3) }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Suspense fallback={<div>Loading...</div>}>
                <Field
                  id="training-name"
                  label="Training name"
                  value={values.training_name}
                  onChange={handleOnTextFieldChange("training_name")}
                  error={errors.training_name}
                  isRequired
                  sx={fieldStyle}
                />
              </Suspense>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Suspense fallback={<div>Loading...</div>}>
                <Field
                  id="duration"
                  label="Duration"
                  value={values.duration.toString()}
                  onChange={handleOnTextFieldChange("duration")}
                  error={errors.duration ? String(errors.duration) : undefined}
                  isRequired
                  sx={fieldStyle}
                  type="number"
                />
              </Suspense>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Suspense fallback={<div>Loading...</div>}>
                <Field
                  id="provider"
                  label="Provider"
                  value={values.provider}
                  onChange={handleOnTextFieldChange("provider")}
                  error={errors.provider}
                  isRequired
                  sx={fieldStyle}
                />
              </Suspense>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Suspense fallback={<div>Loading...</div>}>
                <Field
                  id="department"
                  label="Department"
                  value={values.department}
                  onChange={handleOnTextFieldChange("department")}
                  error={errors.department}
                  isRequired
                  sx={fieldStyle}
                />
              </Suspense>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Suspense fallback={<div>Loading...</div>}>
                <Select
                items={statusOptions}
                value={values.status}
                error={errors.status}
                sx={{ width: '100%' }}
                  id="status"
                  label="Status"
                  isRequired
                  onChange={handleOnSelectChange("status")}
                />
                {errors.status && (
                  <Typography variant="caption" sx={{ color: "#f04438", fontWeight: 300 }}>
                    {errors.status}
                  </Typography>
                )}
              </Suspense>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Suspense fallback={<div>Loading...</div>}>
                <Field
                  id="number-of-people"
                  label="Number of People"
                  value={values.numberOfPeople.toString()}
                  onChange={handleOnTextFieldChange("numberOfPeople")}
                  error={errors.numberOfPeople ? String(errors.numberOfPeople) : undefined}
                  isRequired
                  sx={fieldStyle}
                  type="number"
                />
              </Suspense>
            </Grid>
            <Grid item xs={12}>
              <Suspense fallback={<div>Loading...</div>}>
                <Field
                  id="description"
                  label="Description"
                  value={values.description}
                  onChange={handleOnTextFieldChange("description")}
                  error={errors.description}
                  isRequired
                  sx={{
                    ...fieldStyle,
                    "& textarea": {
                      minHeight: "80px",
                      fontSize: "14px",
                    },
                  }}
                  multiline
                  rows={1}
                  type="description"
                />
              </Suspense>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid #E0E0E0", paddingTop: theme.spacing(2), justifyContent: "flex-end", paddingRight: theme.spacing(3), paddingBottom: theme.spacing(3) }}>
          <Button
            onClick={handleClose}
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              gap: 2,
              color: "#fff",
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              gap: 2,
              color: "#fff",
            }}
          >
            Create Training
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default NewTraining;