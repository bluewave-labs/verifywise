import React, { FC, useState, useMemo, useCallback, useEffect } from "react";
import { useTheme, Stack, Box, SelectChangeEvent } from "@mui/material";
import { Suspense, lazy } from "react";
const Field = lazy(() => import("../../Inputs/Field"));
import Select from "../../Inputs/Select";

import { useModalKeyHandling } from "../../../../application/hooks/useModalKeyHandling";
import {
  TrainingRegistarDTO,
  NewTrainingProps,
  NewTrainingFormErrors,
} from "../../../../domain/models/Common/TrainingRegistar/trainingRegistar.model";
import { TrainingStatus } from "../../../../domain/enums/status.enum";
import StandardModal from "../StandardModal";
import { logEngine } from "../../../../application/utils/log.engine";

// Constants for validation (DRY + Maintainability)
const VALIDATION_RULES = {
  MIN_PEOPLE: 1,
  // DURATION_PATTERN: /^\d+\s*(hour|hours|day|days|week|weeks|month|months|minute|minutes|h|hr|hrs|d|w|m)$/i,
} as const;

const ERROR_MESSAGES = {
  REQUIRED_FIELD: (field: string) => `${field} is required.`,
  INVALID_DURATION:
    "Invalid duration format. Use formats like '2 hours, 3 days, 4 weeks'.",
  INVALID_PEOPLE_COUNT:
    "Number of people is required and must be a positive number.",
} as const;

type FormField = keyof NewTrainingFormErrors;

// Form state: status is always required (has default value), other fields optional during editing
type TrainingFormState = Omit<Partial<TrainingRegistarDTO>, "status"> & {
  status: TrainingStatus;
};

const initialState: TrainingFormState = {
  training_name: "",
  duration: "",
  provider: "",
  department: "",
  status: TrainingStatus.Planned,
  numberOfPeople: undefined, // Defensive: Don't default to 0
  description: "",
};

const statusOptions: Array<{ _id: string; name: string }> = [
  { _id: TrainingStatus.Planned, name: "Planned" },
  { _id: TrainingStatus.InProgress, name: "In Progress" },
  { _id: TrainingStatus.Completed, name: "Completed" },
];

// Utility: Validate required text field (DRY)
const validateRequiredField = (
  value: unknown,
  fieldName: string
): string | undefined => {
  if (!value || typeof value !== "string" || !value.trim()) {
    return ERROR_MESSAGES.REQUIRED_FIELD(fieldName);
  }
  return undefined;
};

// Utility: Validate duration format (Single Responsibility)
const validateDuration = (duration: string): string | undefined => {
  const requiredError = validateRequiredField(duration, "Duration");
  if (requiredError) return requiredError;

  // const parts = duration.split(",").map(p => p.trim()).filter(Boolean);
  // const invalidParts = parts.filter(part => !VALIDATION_RULES.DURATION_PATTERN.test(part));

  // return invalidParts.length > 0 ? ERROR_MESSAGES.INVALID_DURATION : undefined;
  return undefined;
};

// Utility: Validate people count (Single Responsibility)
const validatePeopleCount = (count: unknown): string | undefined => {
  const numValue = Number(count);
  if (!count || isNaN(numValue) || numValue < VALIDATION_RULES.MIN_PEOPLE) {
    return ERROR_MESSAGES.INVALID_PEOPLE_COUNT;
  }
  return undefined;
};

const NewTraining: FC<NewTrainingProps> = ({
  isOpen,
  setIsOpen,
  onSuccess,
  initialData,
  isEdit = false,
}) => {
  const theme = useTheme();
  const [values, setValues] = useState<TrainingFormState>(
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

  // Handler: Text field change with proper typing (Type Safety)
  const handleOnTextFieldChange = useCallback(
    (prop: keyof TrainingRegistarDTO) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;

        // Defensive: Handle number fields explicitly
        if (prop === "numberOfPeople") {
          // Don't default to 0 - let validation catch empty values
          const numValue = value === "" ? undefined : Number(value);
          if (numValue === undefined || (!isNaN(numValue) && numValue >= 0)) {
            setValues((prev) => ({
              ...prev,
              numberOfPeople: numValue,
            }));
          }
        } else {
          setValues((prev: TrainingFormState) => ({ ...prev, [prop]: value }));
        }

        // Clear error for this field
        setErrors((prev: NewTrainingFormErrors) => ({
          ...prev,
          [prop as FormField]: "",
        }));
      },
    []
  );

  // Handler: Select change with proper typing (Type Safety)
  // DEFENSIVE: Cast value to TrainingStatus to ensure type safety end-to-end
  const handleOnSelectChange = useCallback(
    (prop: keyof TrainingRegistarDTO) =>
      (event: SelectChangeEvent<string | number>) => {
        const value = event.target.value as TrainingStatus;
        setValues((prev: TrainingFormState) => ({ ...prev, [prop]: value }));
        setErrors((prev: NewTrainingFormErrors) => ({
          ...prev,
          [prop as FormField]: "",
        }));
      },
    []
  );

  // Validation: Use utility functions (DRY + KISS)
  const validateForm = (): boolean => {
    const newErrors: NewTrainingFormErrors = {};

    // Validate required fields using utility
    const trainingNameError = validateRequiredField(
      values.training_name,
      "Training name"
    );
    if (trainingNameError) newErrors.training_name = trainingNameError;

    const durationError = validateDuration(values.duration ?? "");
    if (durationError) newErrors.duration = durationError;

    const providerError = validateRequiredField(values.provider, "Provider");
    if (providerError) newErrors.provider = providerError;

    const departmentError = validateRequiredField(
      values.department,
      "Department"
    );
    if (departmentError) newErrors.department = departmentError;

    const statusError = validateRequiredField(values.status, "Status");
    if (statusError) newErrors.status = statusError;

    const peopleError = validatePeopleCount(values.numberOfPeople);
    if (peopleError) newErrors.numberOfPeople = peopleError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  // Submit: With error boundary (Defensive Programming)
  // Await the onSuccess callback and only close modal on success
  const handleSubmit = useCallback(
    async (event?: React.FormEvent) => {
      if (event) event.preventDefault();

      if (!validateForm()) return;

      // Defensive: Guard against undefined callback
      if (!onSuccess) {
        logEngine({
          type: "error",
          message: "onSuccess callback not provided",
        });
        handleClose();
        return;
      }

      try {
        // Call success callback with validated data and await result
        // Type assertion: After validation, all required fields are guaranteed to exist
        const success = await onSuccess(values as TrainingRegistarDTO);

        // Only close modal if save was successful
        if (success) {
          handleClose();
        } else {
          // Failed to save - keep modal open, show generic error if parent didn't set specific one
          logEngine({
            type: "error",
            message: "Save operation failed, keeping modal open",
          });
          // Parent handler is responsible for setting the specific error alert
        }
      } catch (error) {
        // Defensive: Catch errors from parent callback (if they throw instead of returning false)
        logEngine({
          type: "error",
          message: `Error in onSuccess callback: ${error}`,
        });
        setErrors({
          training_name: "An error occurred while saving. Please try again.",
        });
        // Keep modal open to preserve user input
      }
    },
    [values, onSuccess, handleClose]
  );

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
    <StandardModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit training" : "New training"}
      description="Record and manage your organization's AI literacy and compliance trainings. Enter training details such as name, provider, duration, department, participants, and status to keep a clear history of all AI-related education initiatives."
      onSubmit={handleSubmit}
      submitButtonText={isEdit ? "Update training" : "Create training"}
      maxWidth="680px"
    >
      <Stack spacing={6}>
        <Stack direction="row" spacing={6}>
          <Box sx={{ width: "350px" }}>
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
          <Box sx={{ width: "350px" }}>
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
        <Stack direction="row" spacing={6}>
          <Box sx={{ width: "350px" }}>
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
          <Box sx={{ width: "350px" }}>
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
        <Stack direction="row" spacing={6}>
          <Box sx={{ width: "350px" }}>
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
          <Box sx={{ width: "350px" }}>
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
    </StandardModal>
  );
};

export default NewTraining;
