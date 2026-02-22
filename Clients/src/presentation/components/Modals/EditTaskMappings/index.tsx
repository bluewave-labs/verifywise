/* eslint-disable @typescript-eslint/no-explicit-any */
import  { FC, useState, useCallback, useEffect } from "react";
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
import { getAllEntities, getAllFrameworks } from "../../../../application/repository/entity.repository";
import { getAllVendors } from "../../../../application/repository/vendor.repository";
import { TaskModel } from "../../../../domain/models/Common/task/task.model";
import { mapTaskResponseDTOToModel } from "../../../../application/mappers";

interface EditTaskMappingsModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    task: TaskModel | null;
    onSuccess?: (updatedTask: TaskModel) => void;
}

interface MappingData {
    use_cases: string[];
    models: string[];
    frameworks: string[];
    vendors: string[];
}

interface DropdownOptions {
    useCases: { id: string; label: string }[];
    models: { id: string; label: string }[];
    frameworks: { id: string; label: string }[];
    vendors: { id: string; label: string }[];
}

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

    // Fetch dropdown options on mount
    useEffect(() => {
        if (isOpen && !isLoading && dropdownOptions.useCases.length === 0) {
            fetchDropdownOptions();
        }
    }, [isOpen]);

    // Initialize mappings when task changes
    useEffect(() => {
        if (isOpen && task) {
            setMappings({
                use_cases: task.categories?.filter((c: string) => c.includes("usecase")) || [],
                models: task.categories?.filter((c: string) => c.includes("model")) || [],
                frameworks: task.categories?.filter((c: string) => c.includes("framework")) || [],
                vendors: task.categories?.filter((c: string) => c.includes("vendor")) || [],
            });
        }
    }, [isOpen, task]);

    const fetchDropdownOptions = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch all data in parallel
            // const [projectsRes, frameworksRes, vendorsRes] = await Promise.all([
            //     getAllProjects(),
            //     getAllFrameworks(),
            //     getAllVendors(),
            // ]);

            const [projectsRes, frameworksRes, vendorsRes, modelsRes] = await Promise.all([
                getAllProjects(),
                getAllFrameworks(),
                getAllVendors(),
                getAllEntities({ routeUrl: "/modelInventory" }),
            ]);

            // Transform project data
            const projects = (projectsRes?.data?.projects || projectsRes?.data || []).map(
                (p: any) => ({
                    id: String(p.id),
                    label: p.project_title || "Unknown",
                })
            );

            // Transform frameworks data
            const frameworks = (frameworksRes?.data || []).map((f: any) => ({
                id: String(f.id),
                label: f.name || "Unknown",
            }));

            // Transform vendors data
            const vendors = (vendorsRes?.data || []).map((v: any) => ({
                id: String(v.id),
                label: v.vendor_name || "Unknown",
            }));

            // For models, we'll use frameworks as a placeholder
            // In a real implementation, fetch actual models from an API
            // const models = frameworks.filter((f: any) => 
            //     f.label.toLowerCase().includes("model")
            // );

            const models = (modelsRes?.data || []).map((m: any) => ({
                id: String(m.id),
                label: m.model || "Unknown",
            }));

            setDropdownOptions({
                useCases: projects,
                models: models,
                frameworks: frameworks,
                vendors: vendors,
            });
        } catch (err) {
            console.error("Error fetching dropdown options:", err);
            setError("Failed to load options. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleMappingChange = useCallback(
        (field: keyof MappingData, newValues: any[]) => {
            setMappings((prev) => ({
                ...prev,
                [field]: newValues.map((v) => (typeof v === "string" ? v : v.id)),
            }));
        },
        []
    );

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setError(null);
    }, [setIsOpen]);

    // Replace the entire handleSubmit function:

    const handleSubmit = useCallback(async () => {
        if (!task?.id) return;
    
        try {
            setIsSubmitting(true);
            setError(null);
    
            // Extract IDs from selected options
            const useCaseIds = mappings.use_cases.map((opt) => Number(opt));
            const modelIds = mappings.models.map((opt) => Number(opt));
            const frameworkIds = mappings.frameworks.map((opt) => Number(opt));
            const vendorIds = mappings.vendors.map((opt) => Number(opt));
    
            // Prepare update payload with ONLY IDs
            const updatePayload = {
                ...task,
                use_cases: useCaseIds,
                models: modelIds,
                frameworks: frameworkIds,
                vendors: vendorIds,
            };
    
            // Call update API
            const response = await updateTask({
                id: task.id,
                body: updatePayload,
            });
    
            if (response?.data) {
                // ✅ FIX: Map API response to TaskModel before passing to parent
                const updatedTaskModel = mapTaskResponseDTOToModel(response.data);
                
                // Call success callback with properly typed TaskModel
                if (onSuccess) {
                    onSuccess(updatedTaskModel);
                }
                
                // Close modal
                handleClose();
            }
        } catch (err) {
            console.error("Error updating task mappings:", err);
            setError("Failed to update mappings. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }, [task, mappings, onSuccess, handleClose]);

    if (!task) return null;

    const renderAutocomplete = (
        field: keyof MappingData,
        label: string,
        options: { id: string; label: string }[]
    ) => (
        <Stack gap={theme.spacing(2)} sx={{ width: "100%" }}>
            <Typography
                component="p"
                variant="body1"
                color={theme.palette.text.secondary}
                fontWeight={500}
                fontSize={"13px"}
                sx={{ margin: 0, height: "22px" }}
            >
                {label}
            </Typography>
            <Autocomplete
                multiple
                id={field}
                size="small"
                value={options.filter((opt) => mappings[field].includes(opt.id))}
                options={options}
                getOptionLabel={(option) => option.label}
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
            title="Edit Task Mappings"
            description="Update the use cases, models, frameworks, and vendors associated with this task."
            onSubmit={handleSubmit}
            submitButtonText="Update Mappings"
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
                    {/* Row 1: Use Cases | Models */}
                    <Stack direction="row" spacing={6} sx={{ width: "748px" }}>
                        {renderAutocomplete("use_cases", "Use Cases", dropdownOptions.useCases)}
                        {renderAutocomplete("models", "Models", dropdownOptions.models)}
                    </Stack>

                    {/* Row 2: Frameworks | Vendors */}
                    <Stack direction="row" spacing={6} sx={{ width: "748px" }}>
                        {renderAutocomplete(
                            "frameworks",
                            "Frameworks",
                            dropdownOptions.frameworks
                        )}
                        {renderAutocomplete("vendors", "Vendors", dropdownOptions.vendors)}
                    </Stack>
                </Stack>
            )}
        </StandardModal>
    );
};

export default EditTaskMappingsModal;