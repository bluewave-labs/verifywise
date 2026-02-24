/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useState, useCallback, useEffect, useMemo } from "react";
import {
  useTheme,
  Stack,
  Typography,
  Box,
  Autocomplete,
  TextField,
  CircularProgress,
} from "@mui/material";

import StandardModal from "../StandardModal";
import { updateTask } from "../../../../application/repository/task.repository";
import { getAllProjects } from "../../../../application/repository/project.repository";
import {
  getAllEntities,
  getAllFrameworks,
} from "../../../../application/repository/entity.repository";
import { getAllVendors } from "../../../../application/repository/vendor.repository";
import { TaskModel } from "../../../../domain/models/Common/task/task.model";
import { mapTaskResponseDTOToModel } from "../../../../application/mappers";

import type { MappingOption } from "../../../../domain/types/task-mappings.type";

interface EditTaskMappingsModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  task: TaskModel | null;
  onSuccess?: (updatedTask: TaskModel) => void;
}

type MappingField = "use_cases" | "models" | "frameworks" | "vendors";

type MappingData = Record<MappingField, string[]>;

type DropdownOptions = {
  useCases: MappingOption[];
  models: MappingOption[];
  frameworks: MappingOption[];
  vendors: MappingOption[];
};

const normalizeIdsToStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v)).filter((s) => s.length > 0);
};

const toNumberIds = (ids: string[]): number[] =>
  ids.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0);

const EditTaskMappingsModal: FC<EditTaskMappingsModalProps> = ({
  isOpen,
  setIsOpen,
  task,
  onSuccess,
}) => {
  const theme = useTheme();
  const [mappings, setMappings] = useState<MappingData>({
    use_cases: [],
    models: [],
    frameworks: [],
    vendors: [],
  });
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOptions>({
    useCases: [],
    models: [],
    frameworks: [],
    vendors: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDropdownOptions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [projectsRes, frameworksRes, vendorsRes, modelsRes] =
        await Promise.all([
          getAllProjects(),
          getAllFrameworks(),
          getAllVendors(),
          getAllEntities({ routeUrl: "/modelInventory" }),
        ]);

      const projects: MappingOption[] = (
        projectsRes?.data?.projects ||
        projectsRes?.data ||
        []
      ).map((p: any) => ({
        id: String(p.id),
        label: p.project_title|| "Unknown",
      }));

      const frameworks: MappingOption[] = (frameworksRes?.data || []).map(
        (f: any) => ({
          id: String(f.id),
          label: f.name || "Unknown",
        })
      );

      const vendors: MappingOption[] = (vendorsRes?.data || []).map(
        (v: any) => ({
          id: String(v.id),
          label: v.vendor_name  || "Unknown",
        })
      );

      const models: MappingOption[] = (modelsRes?.data || []).map((m: any) => ({
        id: String(m.id),
        label: m.model || "Unknown",
      }));

      setDropdownOptions({
        useCases: projects,
        models,
        frameworks,
        vendors,
      });
    } catch (err) {
      console.error("Error fetching dropdown options:", err);
      setError("Failed to load options. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !isLoading && dropdownOptions.useCases.length === 0) {
      fetchDropdownOptions();
    }
  }, [isOpen, isLoading, dropdownOptions.useCases.length, fetchDropdownOptions]);

  // Prefill from task mapping fields
  useEffect(() => {
    if (isOpen && task) {
      setMappings({
        use_cases: normalizeIdsToStringArray((task as any).use_cases),
        models: normalizeIdsToStringArray((task as any).models),
        frameworks: normalizeIdsToStringArray((task as any).frameworks),
        vendors: normalizeIdsToStringArray((task as any).vendors),
      });
    }
  }, [isOpen, task]);

  const handleMappingChange = useCallback((field: MappingField, newValues: MappingOption[]) => {
    setMappings((prev) => ({
      ...prev,
      [field]: newValues.map((v) => v.id),
    }));
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setError(null);
  }, [setIsOpen]);

  const handleSubmit = useCallback(async () => {
    if (!task?.id) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const updatePayload = {
        use_cases: toNumberIds(mappings.use_cases),
        models: toNumberIds(mappings.models),
        frameworks: toNumberIds(mappings.frameworks),
        vendors: toNumberIds(mappings.vendors),
      };

      const response = await updateTask({
        id: task.id,
        body: updatePayload as any,
      });

      const updatedTaskDto = response?.data?.data ?? response?.data ?? response;
      if (updatedTaskDto) {
        const updatedTaskModel = mapTaskResponseDTOToModel(updatedTaskDto);
        onSuccess?.(updatedTaskModel);
        handleClose();
      }
    } catch (err) {
      console.error("Error updating task mappings:", err);
      setError("Failed to update mappings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [task, mappings, onSuccess, handleClose]);

  const labelSx = useMemo(
    () => ({
      margin: 0,
      height: "22px",
      fontSize: "13px",
      fontWeight: 500,
      color: theme.palette.text.secondary,
    }),
    [theme.palette.text.secondary]
  );

  if (!task) return null;

  const renderAutocomplete = (
    field: MappingField,
    label: string,
    options: MappingOption[]
  ) => (
    <Stack gap={theme.spacing(2)} sx={{ width: "100%" }}>
      <Typography component="p" variant="body1" sx={labelSx}>
        {label}
      </Typography>

      <Autocomplete
        multiple
        id={field}
        size="small"
        value={options.filter((opt) => mappings[field].includes(opt.id))}
        options={options}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        onChange={(_event, newValue) => handleMappingChange(field, newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={`Select ${label.toLowerCase()}`}
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
          width: "100%",
          backgroundColor: theme.palette.background.main,
          "& .MuiChip-root": {
            borderRadius: theme.shape.borderRadius,
            height: "26px",
            margin: "1px 2px",
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
  );

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit task mappings"
      description="Update the use cases, models, frameworks, and vendors associated with this task."
      onSubmit={handleSubmit}
      submitButtonText="Update mappings"
      isSubmitting={isSubmitting}
      maxWidth="800px"
    >
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: "24px",
          }}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ py: "16px" }}>
          {error}
        </Typography>
      ) : (
        <Stack spacing={6}>
          <Stack direction="row" spacing={6} sx={{ width: "748px" }}>
            {renderAutocomplete("use_cases", "Use cases", dropdownOptions.useCases)}
            {renderAutocomplete("models", "Models", dropdownOptions.models)}
          </Stack>

          <Stack direction="row" spacing={6} sx={{ width: "748px" }}>
            {renderAutocomplete("frameworks", "Frameworks", dropdownOptions.frameworks)}
            {renderAutocomplete("vendors", "Vendors", dropdownOptions.vendors)}
          </Stack>
        </Stack>
      )}
    </StandardModal>
  );
};

export default EditTaskMappingsModal;