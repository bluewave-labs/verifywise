/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, useState, useMemo, useCallback, useEffect } from "react";
import {
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  Box,
  Typography,
} from "@mui/material";
import { Suspense, lazy } from "react";
const Field = lazy(() => import("../../Inputs/Field"));
import Select from "../../Inputs/Select";
import { ReactComponent as SaveIconSVGWhite } from "../../../assets/icons/save-white.svg";
import CustomizableButton from "../../Button/CustomizableButton";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import { useModalKeyHandling } from "../../../../application/hooks/useModalKeyHandling";

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
  description: string;
}

interface NewTrainingFormErrors {
  training_name?: string;
  duration?: string;
  provider?: string;
  department?: string;
  status?: string;
  numberOfPeople?: string;
  description?: string;
}

const initialState: NewTrainingFormValues = {
  training_name: "",
  duration: "",
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
        if (prop === "numberOfPeople") {
          const numValue = value === "" ? 0 : Number(value);
          if (!isNaN(numValue) && numValue >= 0) {
            setValues((prev) => ({ ...prev, [prop]: numValue }));
          }
        } else {
          setValues((prev) => ({ ...prev, [prop]: value }));
        }
        setErrors((prev) => ({ ...prev, [prop]: "" }));
      },
    []
  );

  const handleOnSelectChange = useCallback(
    (prop: keyof NewTrainingFormValues) => (event: any) => {
      const value = event.target.value;
      setValues((prev) => ({ ...prev, [prop]: value }));
      setErrors((prev) => ({ ...prev, [prop]: "" }));
    },
    []
  );

  const validateForm = (): boolean => {
    const newErrors: NewTrainingFormErrors = {};

    if (!values.training_name || !String(values.training_name).trim()) {
      newErrors.training_name = "Training name is required.";
    }

    if (!values.duration || !String(values.duration).trim()) {
      newErrors.duration = "Duration is required.";
    } else {
      // Validate duration format
      const durationPattern = /\b(hour|hours|day|days|week|weeks|month|months|minute|minutes|h|hr|hrs|d|w|m)\b/i;
      const parts = values.duration.split(",").map(p => p.trim());
      const invalidParts = parts.filter(part => !durationPattern.test(part));
  
      if (invalidParts.length > 0) {
        newErrors.duration = `Invalid duration format. Each part should include a number and a unit (e.g., "2 hours, 3 days, 4 weeks")`;
      }
    }

    if (!values.provider || !String(values.provider).trim()) {
      newErrors.provider = "Provider is required.";
    }

    if (!values.department || !String(values.department).trim()) {
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
          numberOfPeople: values.numberOfPeople,
          duration: values.duration,
          description: values.description,
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

    useModalKeyHandling({
        isOpen,
        onClose: handleClose,
    });

  return (
    <Dialog
      open={isOpen}
      onClose={(_event, reason) => {
          if (reason !== 'backdropClick') {
              handleClose();
          }
      }}
      maxWidth="md"
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
        <Stack
          spacing={2}
          sx={{
            padding: theme.spacing(4),
          }}
        >
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
              {isEdit ? "Edit training" : "New training"}
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
                gap: theme.spacing(2),
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
          <Typography 
            sx={{ 
              fontSize: 13, 
              color: theme.palette.text.secondary,
              mt: 1,
              mb: 18
            }}
          >
            Record and manage your organization's AI literacy and compliance trainings. Enter training details such as name, provider, duration, department, participants, and status to keep a clear history of all AI-related education initiatives.
          </Typography>
          <DialogContent sx={{ p: 0 }}>
            <Stack sx={{ gap: "16px", mt: 4 }}>
              <Stack direction="row" spacing={2} sx={{ gap: "16px" }}>
                <Box sx={{ width: "50%" }}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Field
                      id="training-name"
                      label="Training name"
                      value={values.training_name}
                      onChange={handleOnTextFieldChange("training_name")}
                      error={errors.training_name}
                      isRequired
                      sx={fieldStyle}
                      placeholder="e.g., Introduction to AI Ethics"
                    />
                  </Suspense>
                </Box>
                <Box sx={{ width: "50%" }}>
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
                      placeholder="e.g., 2 hours, 3 days, 6 weeks"
                    />
                  </Suspense>
                </Box>
              </Stack>
              <Stack direction="row" spacing={2} sx={{ gap: "16px" }}>
                <Box sx={{ width: "50%" }}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Field
                      id="provider"
                      label="Provider"
                      value={values.provider}
                      onChange={handleOnTextFieldChange("provider")}
                      error={errors.provider}
                      isRequired
                      sx={fieldStyle}
                      placeholder="e.g., VerifyWise, External Vendor, Internal Team"
                    />
                  </Suspense>
                </Box>
                <Box sx={{ width: "50%" }}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Field
                      id="department"
                      label="Department"
                      value={values.department}
                      onChange={handleOnTextFieldChange("department")}
                      error={errors.department}
                      isRequired
                      sx={fieldStyle}
                      placeholder="e.g., Compliance, Engineering, HR"
                    />
                  </Suspense>
                </Box>
              </Stack>
              <Stack direction="row" spacing={2} sx={{ gap: "16px" }}>
                <Box sx={{ width: "50%" }}>
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
                      placeholder="Select status"
                    />
                  </Suspense>
                </Box>
                <Box sx={{ width: "50%" }}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Field
                      id="number-of-people"
                      label="Number of people"
                      value={values.numberOfPeople?.toString() || ""}
                      onChange={handleOnTextFieldChange("numberOfPeople")}
                      error={errors.numberOfPeople}
                      isRequired
                      sx={fieldStyle}
                      type="number"
                      placeholder="Enter total participants (e.g., 25)"
                    />
                  </Suspense>
                </Box>
              </Stack>
              <Box sx={{ width: "100%" }}>
                <Suspense fallback={<div>Loading...</div>}>
                  <Field
                    id="description"
                    label="Description"
                    type="description"
                    value={values.description}
                    onChange={handleOnTextFieldChange("description")}
                    error={errors.description}
                    sx={fieldStyle}
                    placeholder="Provide a short overview of the training goals and content"
                  />
                </Suspense>
              </Box>
            </Stack>
          </DialogContent>
          <Stack
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <CustomizableButton
              variant="contained"
              text={isEdit ? "Update training" : "Create training"}
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
                mt: "16px",
              }}
              onClick={handleSubmit}
              icon={<SaveIconSVGWhite />}
            />
          </Stack>
        </Stack>
      </form>
    </Dialog>
  );
};

export default NewTraining;
