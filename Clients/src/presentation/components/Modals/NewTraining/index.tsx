import React, { FC, useState, useMemo, useCallback, useEffect } from "react";
import {
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Stack,
  Box,
} from "@mui/material";
import { Suspense, lazy } from "react";
const Field = lazy(() => import("../../Inputs/Field"));
import Select from "../../Inputs/Select";
import SaveIcon from "@mui/icons-material/Save";
import CustomizableButton from "../../../vw-v2-components/Buttons";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";

interface NewTrainingProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: (data: NewTrainingFormValues) => void;
  initialData?: NewTrainingFormValues;
  isEdit?: boolean;
}

type StatusType = "Planned" | "In Progress" | "Completed";

interface NewTrainingFormValues {
  training_name: string;
  duration: string;
  provider: string;
  department: string;
  status: StatusType;
  numberOfPeople: number;
}

interface NewTrainingFormErrors {
  training_name?: string;
  duration?: string;
  provider?: string;
  department?: string;
  status?: string;
  numberOfPeople?: string;
}

const initialState: NewTrainingFormValues = {
  training_name: "",
  duration: "",
  provider: "",
  department: "",
  status: "Planned",
  numberOfPeople: 0,
};

const statusOptions = [
  { _id: "Planned", name: "Planned" },
  { _id: "In Progress", name: "In Progress" },
  { _id: "Completed", name: "Completed" },
];

const NewTraining: FC<NewTrainingProps> = ({
  isOpen,
  setIsOpen,
  onSuccess,
  initialData,
  isEdit = false,
}) => {
  const theme = useTheme();
  const [values, setValues] = useState<NewTrainingFormValues>(
    initialData || initialState
  );
  const [errors, setErrors] = useState<NewTrainingFormErrors>({});

  useEffect(() => {
    if (initialData) {
      setValues(initialData);
    } else if (!isEdit) {
      setValues(initialState);
    }
  }, [initialData, isEdit]);

  useEffect(() => {
    if (!isOpen) {
      setValues(initialState);
      setErrors({});
    }
  }, [isOpen]);

  const handleOnTextFieldChange = useCallback(
    (prop: keyof NewTrainingFormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setValues((prev) => ({ ...prev, [prop]: value }));
        setErrors((prev) => ({ ...prev, [prop]: "" }));
      },
    []
  );

  const handleOnSelectChange = useCallback(
    (prop: keyof NewTrainingFormValues) => (event: React.ChangeEvent<{ value: unknown }>) => {
      const value = event.target.value;
      setValues((prev) => ({ ...prev, [prop]: value }));
      setErrors((prev) => ({ ...prev, [prop]: "" }));
    },
    []
  );

  const validateForm = (): boolean => {
    const newErrors: NewTrainingFormErrors = {};

    if (!values.training_name.trim()) {
      newErrors.training_name = "Training name is required.";
    }

    if (
      !values.duration 
    ) {
      newErrors.duration =
        "Duration cannot be empty";
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
      !values.numberOfPeople ||
      isNaN(Number(values.numberOfPeople)) ||
      Number(values.numberOfPeople) < 1
    ) {
      newErrors.numberOfPeople =
        "Number of people is required and must be a positive number.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (validateForm()) {
      if (onSuccess) {
        onSuccess({
          ...values,
          duration: values.duration,
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
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: theme.shape.borderRadius,
          padding: theme.spacing(4),

          boxShadow:
            "0px 8px 8px -4px rgba(16, 24, 40, 0.03), 0px 20px 24px -4px rgba(16, 24, 40, 0.08)",
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={4}
        sx={
          {
            padding: theme.spacing(8)
          }
        }>
          <Stack
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <DialogTitle
              sx={{
                fontSize: 16,
                fontWeight: 600,
                color: theme.palette.text.primary,
                padding: 0,
              }}
            >
              {isEdit ? "Edit Training" : "New Training"}
            </DialogTitle>
            <Box
              component="span"
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              sx={{
                gap: theme.spacing(5),
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                padding: "8px",
                "&:hover": {
                  opacity: 0.8,
                },
              }}
            >
              <CloseIcon />
            </Box>
          </Stack>
          <DialogContent sx={{ p: 0 }}>
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
                    value={values.duration}
                    onChange={handleOnTextFieldChange("duration")}
                    error={errors.duration}
                    isRequired
                    sx={fieldStyle}
                    type="text"
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
                    sx={{ width: "100%" }}
                    id="status"
                    label="Status"
                    isRequired
                    onChange={handleOnSelectChange("status")}
                  />
                </Suspense>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="number-of-people"
                    label="Number of People"
                    value={values.numberOfPeople.toString()}
                    onChange={handleOnTextFieldChange("numberOfPeople")}
                    error={errors.numberOfPeople}
                    isRequired
                    sx={fieldStyle}
                    type="number"
                  />
                </Suspense>
              </Grid>
            </Grid>
          </DialogContent>
          <Stack
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
              mt: 2,
            }}
          >
            <CustomizableButton
              variant="contained"
              text={isEdit ? "Update Training" : "Create Training"}
              sx={{
                mt: theme.spacing(5),
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
              }}
              onClick={handleSubmit}
              icon={<SaveIcon />}
            />
          </Stack>
        </Stack>
      </form>
    </Dialog>
  );
};

export default NewTraining;
