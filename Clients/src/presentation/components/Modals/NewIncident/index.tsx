/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, useState, useEffect, useMemo, Suspense } from "react";
import {
    Drawer,
    Stack,
    Box,
    Typography,
    FormControlLabel,
    Checkbox,
    FormGroup,
    FormLabel,
    useTheme,
    Divider,
} from "@mui/material";
import Toggle from "../../Inputs/Toggle";
import dayjs, { Dayjs } from "dayjs";
import CustomizableButton from "../../Button/CustomizableButton";
import { ReactComponent as CloseIcon } from "../../../assets/icons/close.svg";
import { ReactComponent as SaveIconSVGWhite } from "../../../assets/icons/save-white.svg";
import { getAllEntities } from "../../../../application/repository/entity.repository";
import { getAllProjects } from "../../../../application/repository/project.repository";
import { User } from "../../../../domain/types/User";
import { Project } from "../../../../domain/types/Project";
import { useModalKeyHandling } from "../../../../application/hooks/useModalKeyHandling";
import {
    Severity,
    IncidentManagementStatus,
    AIIncidentManagementApprovalStatus,
    IncidentType,
    HarmCategory,
} from "../../../../domain/enums/aiIncidentManagement.enum";

// To
import Field from "../../Inputs/Field";
import DatePicker from "../../Inputs/Datepicker";
import SelectComponent from "../../Inputs/Select";

interface SideDrawerIncidentProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onSuccess?: (data: NewIncidentFormValues) => void;
    initialData?: NewIncidentFormValues;
    isEdit?: boolean;
    mode?: string;
}

export interface NewIncidentFormValues {
    incident_id?: string;
    ai_project: string;
    type: string;
    severity: Severity;
    status: IncidentManagementStatus;
    occurred_date: string;
    date_detected: string;
    reporter: string;
    categories_of_harm: string[];
    affected_persons_groups?: string;
    description: string;
    relationship_causality?: string;
    immediate_mitigations?: string;
    planned_corrective_actions?: string;
    model_system_version?: string;
    interim_report: boolean;
    approval_status: AIIncidentManagementApprovalStatus;
    approved_by?: string;
    approval_date?: string;
    approval_notes?: string;
}

interface NewIncidentFormErrors {
    ai_project?: string;
    type?: string;
    severity?: string;
    status?: string;
    occurred_date?: string;
    date_detected?: string;
    reporter?: string;
    categories_of_harm?: string;
    description?: string;
}

const initialState: NewIncidentFormValues = {
    ai_project: "",
    type: "",
    severity: Severity.MINOR,
    status: IncidentManagementStatus.OPEN,
    occurred_date: new Date().toISOString().split("T")[0],
    date_detected: new Date().toISOString().split("T")[0],
    reporter: "",
    categories_of_harm: [],
    description: "",
    affected_persons_groups: "",
    relationship_causality: "",
    immediate_mitigations: "",
    planned_corrective_actions: "",
    model_system_version: "",
    interim_report: false,
    approval_status: AIIncidentManagementApprovalStatus.PENDING,
    approved_by: "",
    approval_date: "",
    approval_notes: "",
};

const severityOptions = [
    { _id: Severity.MINOR, name: "Minor" },
    { _id: Severity.SERIOUS, name: "Serious" },
    { _id: Severity.VERY_SERIOUS, name: "Very Serious" },
];

const statusOptions = [
    { _id: IncidentManagementStatus.OPEN, name: "Open" },
    { _id: IncidentManagementStatus.INVESTIGATED, name: "Investigating" },
    { _id: IncidentManagementStatus.MITIGATED, name: "Mitigated" },
    { _id: IncidentManagementStatus.CLOSED, name: "Closed" },
];

const approvalStatusOptions = [
    { _id: AIIncidentManagementApprovalStatus.PENDING, name: "Pending" },
    { _id: AIIncidentManagementApprovalStatus.APPROVED, name: "Approved" },
    { _id: AIIncidentManagementApprovalStatus.REJECTED, name: "Rejected" },
    {
        _id: AIIncidentManagementApprovalStatus.NOT_REQUIRED,
        name: "Not Required",
    },
];

const checkbox = {
    "& .MuiCheckbox-root": {
        color: "#13715B",
        "&.Mui-checked": {
            color: "#13715B",
        },
        "&:hover": {
            backgroundColor: "rgba(19, 113, 91, 0.04)",
        },
    },
};

const incidentTypes = Object.values(IncidentType);
const harmCategories = Object.values(HarmCategory);

const SideDrawerIncident: FC<SideDrawerIncidentProps> = ({
    isOpen,
    setIsOpen,
    onSuccess,
    initialData,
    isEdit = false,
    mode,
}) => {
    const theme = useTheme();
    const [values, setValues] = useState<NewIncidentFormValues>(
        initialData || initialState
    );
    const [errors, setErrors] = useState<NewIncidentFormErrors>({});
    const [users, setUsers] = useState<User[]>([]);
    const [projectList, setProjects] = useState<Project[]>([]);
    const [, setIsLoadingUsers] = useState(false);

    // Fetch Users & Projects
    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            fetchProjects();
        }
    }, [isOpen]);

    useEffect(() => {
        if (initialData) {
            setValues((prev) => ({
                ...prev,
                ...initialData,
            }));
        }
    }, [initialData]);

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const response = await getAllEntities({ routeUrl: "/users" });
            if (response?.data) setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await getAllProjects();
            if (response?.data) setProjects(response.data);
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    };

    const projectOptions = useMemo(() => {
        // Use a Set to track unique project titles
        const seen = new Set<string>();

        return projectList
            .filter((p) => {
                // Only keep the first occurrence of each project_title
                if (seen.has(p.project_title)) return false;
                seen.add(p.project_title);
                return true;
            })
            .map((p) => ({
                _id: p.project_title,
                name: p.project_title,
            }));
    }, [projectList]);

    const userOptions = useMemo(
        () =>
            users.map((u) => ({ _id: u.name, name: `${u.name} ${u.surname}` })),
        [users]
    );

    const handleOnTextFieldChange =
        (prop: keyof NewIncidentFormValues) => (e: any) => {
            const value = e.target.value;
            setValues((prev) => ({ ...prev, [prop]: value }));
            setErrors((prev) => ({ ...prev, [prop]: "" }));
        };

    const handleSelectChange =
        (prop: keyof NewIncidentFormValues) => (e: any) => {
            const value = e.target.value;
            setValues((prev) => ({ ...prev, [prop]: value }));
            setErrors((prev) => ({ ...prev, [prop]: "" }));
        };

    const handleDateChange =
        (prop: "occurred_date" | "detected_date" | "approval_date") =>
        (newDate: Dayjs | null) => {
            if (newDate?.isValid()) {
                setValues((prev) => ({
                    ...prev,
                    [prop]: newDate.format("YYYY-MM-DD"),
                }));
                setErrors((prev) => ({ ...prev, [prop]: "" }));
            }
        };

    const handleSwitchChange =
        (prop: "interim_report") =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setValues((prev) => ({ ...prev, [prop]: e.target.checked }));
        };

    const handleHarmCategoryChange = (category: string) => {
        setValues((prev) => {
            const newCategories = prev.categories_of_harm.includes(category)
                ? prev.categories_of_harm.filter((c) => c !== category)
                : [...prev.categories_of_harm, category];
            return { ...prev, categories_of_harm: newCategories };
        });
        setErrors((prev) => ({ ...prev, categories_of_harm: "" }));
    };

    const validateForm = (): boolean => {
        const newErrors: NewIncidentFormErrors = {};
        if (!values.ai_project) newErrors.ai_project = "Project is required.";
        if (!values.occurred_date)
            newErrors.occurred_date = "Occurred date is required.";
        else if (dayjs(values.occurred_date).isAfter(dayjs()))
            newErrors.occurred_date = "Cannot be in the future.";
        if (!values.date_detected)
            newErrors.date_detected = "Detected date is required.";
        if (!values.reporter) newErrors.reporter = "Reporter is required.";
        // ----- Description with min/max length -----
        if (!values.description) {
            newErrors.description = "Description is required.";
        }
        // ----- Impact Assessment: Categories of Harm -----
        if (
            !values.categories_of_harm ||
            values.categories_of_harm.length < 1
        ) {
            newErrors.categories_of_harm =
                "Please select at least one Category of Harm.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleClose = () => {
        setIsOpen(false);
        setValues(initialState);
        setErrors({});
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (validateForm()) {
            onSuccess?.(values);
            handleClose();
        }
    };

    const isViewMode = mode === "view";

    useModalKeyHandling({ isOpen, onClose: handleClose });

    return (
        <Drawer anchor="right" open={isOpen} onClose={handleClose}>
            <Stack
                sx={{
                    width: 700,
                    maxHeight: "100vh",
                    overflowY: "auto",
                    p: theme.spacing(10),
                    bgcolor: theme.palette.background.paper,
                }}
            >
                {/* Header */}

                {mode !== "view" && (
                    <>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={3}
                        >
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography
                                    fontWeight={600}
                                    color={theme.palette.text.primary}
                                >
                                    {isEdit ? "Edit incident" : "Create new incident"}
                                </Typography>
                                {isEdit && values.incident_id && (
                                    <Typography
                                        fontWeight={400}
                                        fontSize={14}
                                        sx={{
                                            ml: 1,
                                        }}
                                    >
                                        <Typography
                                            component="span"
                                            color={theme.palette.text.secondary}
                                            fontSize={14}
                                        >
                                            (Incident ID:{" "}
                                        </Typography>
                                        <Typography
                                            component="span"
                                            color={theme.palette.text.tertiary}
                                            fontSize={14}
                                        >
                                            {values.incident_id})
                                        </Typography>
                                    </Typography>
                                )}
                            </Stack>
                            <Box onClick={handleClose} sx={{ cursor: "pointer" }}>
                                <CloseIcon />
                            </Box>
                        </Stack>
                        <Divider sx={{
                            mb: 4,
                            mx: `calc(-1 * ${theme.spacing(10)})`,
                        }} />
                    </>
                )}

                <form onSubmit={handleSubmit}>
                    <Stack spacing={4} width="100%">
                        {/* SECTION 1: INCIDENT INFORMATION */}
                        <Stack spacing={4}>
                            <Stack direction="row" spacing={1} alignItems="baseline">
                                <Typography
                                    sx={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        color: theme.palette.text.secondary,
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    INCIDENT INFORMATION
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 12,
                                        fontWeight: 400,
                                        color: theme.palette.text.tertiary,
                                    }}
                                >
                                    (Basic incident details)
                                </Typography>
                            </Stack>

                            {/* Row: AI Project + Incident Type */}
                            <Stack direction={"row"} gap={theme.spacing(8)} sx={{ mt: 2 }}>
                                <Stack sx={{ gap: 3, width: "50%" }}>
                                    <SelectComponent
                                        id="ai_project"
                                        label="AI use case or framework"
                                        placeholder="Select AI use case or framework"
                                        items={projectOptions}
                                        value={values.ai_project}
                                        onChange={handleSelectChange("ai_project")}
                                        error={errors.ai_project}
                                        isRequired
                                        sx={{ flex: 1 }}
                                        disabled={isViewMode}
                                    />
                                </Stack>
                                <Stack sx={{ gap: 3, width: "50%" }}>
                                    <SelectComponent
                                        id="type"
                                        label="Incident type"
                                        placeholder="Select incident type"
                                        items={incidentTypes.map((t) => ({
                                            _id: t,
                                            name: t,
                                        }))}
                                        value={values.type}
                                        onChange={handleSelectChange("type")}
                                        error={errors.type}
                                        sx={{ flex: 1 }}
                                        disabled={isViewMode}
                                    />
                                </Stack>
                            </Stack>

                            {/* Row: Severity + Status */}
                            <Stack direction={"row"} gap={theme.spacing(8)} sx={{ mt: 2 }}>
                                <Stack sx={{ gap: 3, width: "50%" }}>
                                    <SelectComponent
                                        id="severity"
                                        label="Severity"
                                        items={severityOptions}
                                        placeholder="Select severity"
                                        value={values.severity}
                                        onChange={handleSelectChange("severity")}
                                        error={errors.severity}
                                        sx={{ flex: 1 }}
                                        disabled={isViewMode}
                                    />
                                </Stack>
                                <Stack sx={{ gap: 3, width: "50%" }}>
                                    <SelectComponent
                                        id="status"
                                        label="Status"
                                        placeholder="Select status"
                                        items={statusOptions}
                                        value={values.status}
                                        onChange={handleSelectChange("status")}
                                        error={errors.status}
                                        sx={{ flex: 1 }}
                                        disabled={isViewMode}
                                    />
                                </Stack>
                            </Stack>

                            {/* Row: Occurred Date + Detected Date */}
                            <Stack direction={"row"} gap={theme.spacing(8)} sx={{ mt: 2 }}>
                                <Suspense fallback={<div>Loading...</div>}>
                                    <Stack sx={{ gap: 3, width: "50%" }}>
                                        <DatePicker
                                            label="Occurred date"
                                            date={dayjs(values.occurred_date)}
                                            handleDateChange={handleDateChange(
                                                "occurred_date"
                                            )}
                                            isRequired
                                            error={errors.occurred_date}
                                            sx={{ flex: 1 }}
                                            disabled={isViewMode}
                                        />
                                    </Stack>
                                    <Stack sx={{ gap: 3, width: "50%" }}>
                                        <DatePicker
                                            label="Detected date"
                                            date={dayjs(values.date_detected)}
                                            handleDateChange={handleDateChange(
                                                "detected_date"
                                            )}
                                            isRequired
                                            error={errors.date_detected}
                                            sx={{ flex: 1 }}
                                            disabled={isViewMode}
                                        />
                                    </Stack>
                                </Suspense>
                            </Stack>

                            {/* Row: Reporter + Model/System Version */}
                            <Stack direction={"row"} gap={theme.spacing(8)} sx={{ mt: 2 }}>
                                <Stack sx={{ gap: 3, width: "50%" }}>
                                    <SelectComponent
                                        id="reporter"
                                        label="Reporter"
                                        placeholder="Select reporter"
                                        items={userOptions}
                                        value={values.reporter}
                                        onChange={handleSelectChange("reporter")}
                                        error={errors.reporter}
                                        isRequired
                                        sx={{ flex: 1 }}
                                        disabled={isViewMode}
                                    />
                                </Stack>
                                <Stack sx={{ gap: 3, width: "50%" }}>
                                    <Field
                                        id="model_version"
                                        label="Model / system version"
                                        value={values.model_system_version || ""}
                                        onChange={handleOnTextFieldChange(
                                            "model_system_version"
                                        )}
                                        placeholder="Model/system version"
                                        sx={{ flex: 1 }}
                                        disabled={isViewMode}
                                    />
                                </Stack>
                            </Stack>
                        </Stack>

                        <Box sx={{ py: 6 }}>
                            <Divider sx={{
                                mx: `calc(-1 * ${theme.spacing(10)})`,
                            }} />
                        </Box>

                        {/* SECTION 2: IMPACT ASSESSMENT */}
                        <Stack spacing={4}>
                            <Stack direction="row" spacing={1} alignItems="baseline">
                                <Typography
                                    sx={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        color: theme.palette.text.secondary,
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    IMPACT ASSESSMENT
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 12,
                                        fontWeight: 400,
                                        color: theme.palette.text.tertiary,
                                    }}
                                >
                                    (What was affected)
                                </Typography>
                            </Stack>

                            {/* Categories of harm */}
                            <FormLabel
                                sx={{
                                    color: theme.palette.text.secondary,
                                    fontSize: 13,
                                    fontWeight: 500,
                                }}
                            >
                                Categories of harm
                            </FormLabel>
                            <FormGroup row sx={{ gap: theme.spacing(3), flexWrap: 'nowrap' }}>
                                {harmCategories.map((category) => (
                                    <FormControlLabel
                                        key={category}
                                        control={
                                            <Checkbox
                                                checked={values.categories_of_harm.includes(
                                                    category
                                                )}
                                                onChange={() =>
                                                    handleHarmCategoryChange(
                                                        category
                                                    )
                                                }
                                            />
                                        }
                                        label={category}
                                        sx={{
                                            flex: 1,
                                            mr: 0,
                                            "& .MuiFormControlLabel-label": {
                                                fontSize: 13,
                                                color: theme.palette.text.primary,
                                            },
                                            checkbox,
                                        }}
                                        disabled={isViewMode}
                                    />
                                ))}
                            </FormGroup>

                            {errors.categories_of_harm && (
                                <Typography
                                    color="error"
                                    sx={{ mt: 0.5, fontSize: 13 }}
                                >
                                    {errors.categories_of_harm}
                                </Typography>
                            )}

                            <Field
                                id="affected_persons"
                                label="Affected persons / groups"
                                value={values.affected_persons_groups || ""}
                                onChange={handleOnTextFieldChange(
                                    "affected_persons_groups"
                                )}
                                placeholder="List affected persons or groups"
                                rows={2}
                                disabled={isViewMode}
                            />
                            <Field
                                id="description"
                                label="Description"
                                value={values.description}
                                onChange={handleOnTextFieldChange("description")}
                                error={errors.description}
                                placeholder="Describe the incident"
                                rows={3}
                                isRequired
                                disabled={isViewMode}
                            />
                            <Field
                                id="relationship"
                                label="Relationship / causality"
                                value={values.relationship_causality || ""}
                                onChange={handleOnTextFieldChange(
                                    "relationship_causality"
                                )}
                                placeholder="Explain the relationship to AI system"
                                rows={2}
                                disabled={isViewMode}
                            />
                        </Stack>

                        <Box sx={{ py: 6 }}>
                            <Divider sx={{
                                mx: `calc(-1 * ${theme.spacing(10)})`,
                            }} />
                        </Box>

                        {/* SECTION 3: RESPONSE & ACTIONS */}
                        <Stack spacing={4}>
                            <Stack direction="row" spacing={1} alignItems="baseline">
                                <Typography
                                    sx={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        color: theme.palette.text.secondary,
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    RESPONSE & ACTIONS
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 12,
                                        fontWeight: 400,
                                        color: theme.palette.text.tertiary,
                                    }}
                                >
                                    (What was/will be done)
                                </Typography>
                            </Stack>

                            <Field
                                id="immediate_mitigations"
                                label="Immediate mitigations taken"
                                value={values.immediate_mitigations || ""}
                                onChange={handleOnTextFieldChange(
                                    "immediate_mitigations"
                                )}
                                placeholder="Describe immediate mitigations"
                                rows={2}
                                disabled={isViewMode}
                            />
                            <Field
                                id="planned_corrective_actions"
                                label="Planned corrective actions"
                                value={values.planned_corrective_actions || ""}
                                onChange={handleOnTextFieldChange(
                                    "planned_corrective_actions"
                                )}
                                placeholder="Describe planned corrective actions"
                                rows={2}
                                disabled={isViewMode}
                            />
                        </Stack>

                        <Box sx={{ py: 6 }}>
                            <Divider sx={{
                                mx: `calc(-1 * ${theme.spacing(10)})`,
                            }} />
                        </Box>

                        {/* SECTION 4: APPROVAL & REPORTING */}
                        <Stack spacing={4}>
                            <Stack direction="row" spacing={1} alignItems="baseline">
                                <Typography
                                    sx={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        color: theme.palette.text.secondary,
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    APPROVAL & REPORTING
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 12,
                                        fontWeight: 400,
                                        color: theme.palette.text.tertiary,
                                    }}
                                >
                                    (Approval workflow)
                                </Typography>
                            </Stack>

                            {/* Row: Approval Status + Approved By */}
                            <Stack direction={"row"} gap={theme.spacing(8)} sx={{ mt: 2 }}>
                                <Stack sx={{ gap: 3, width: "50%" }}>
                                    <SelectComponent
                                        id="approval_status"
                                        placeholder="Select approval status"
                                        label="Approval status"
                                        items={approvalStatusOptions}
                                        value={values.approval_status}
                                        onChange={handleSelectChange(
                                            "approval_status"
                                        )}
                                        sx={{ flex: 1 }}
                                        disabled={isViewMode}
                                    />
                                </Stack>
                                <Stack sx={{ gap: 3, width: "50%" }}>
                                    <SelectComponent
                                        id="approved_by"
                                        label="Approved by"
                                        placeholder="Select approver"
                                        items={userOptions}
                                        value={values.approved_by || ""}
                                        onChange={handleSelectChange("approved_by")}
                                        sx={{ flex: 1 }}
                                        disabled={isViewMode}
                                    />
                                </Stack>
                            </Stack>

                            {/* Row: Approval Date */}
                            <Stack direction={"row"} gap={theme.spacing(8)} sx={{ mt: 2 }}>
                                <Suspense fallback={<div>Loading...</div>}>
                                    <Stack sx={{ gap: 3, width: "50%" }}>
                                        <DatePicker
                                            label="Approval date"
                                            date={
                                                values.approval_date
                                                    ? dayjs(values.approval_date)
                                                    : null
                                            }
                                            handleDateChange={(d) =>
                                                setValues((prev) => ({
                                                    ...prev,
                                                    approval_date: d
                                                        ? d.format("YYYY-MM-DD")
                                                        : "",
                                                }))
                                            }
                                            sx={{ flex: 1 }}
                                            disabled={isViewMode}
                                        />
                                    </Stack>
                                </Suspense>
                            </Stack>

                            <Field
                                id="approval_notes"
                                label="Approval notes / comments"
                                value={values.approval_notes || ""}
                                onChange={handleOnTextFieldChange("approval_notes")}
                                placeholder="Add approval notes"
                                rows={2}
                                disabled={isViewMode}
                            />

                            {/* Interim Report Toggle */}
                            <FormControlLabel
                                control={
                                    <Toggle
                                        checked={values.interim_report}
                                        onChange={handleSwitchChange(
                                            "interim_report"
                                        )}
                                    />
                                }
                                label="This incident has an interim report"
                                sx={{
                                    mt: 2,
                                    "& .MuiFormControlLabel-label": {
                                        fontSize: 13,
                                    }
                                }}
                                disabled={isViewMode}
                            />
                        </Stack>
                    </Stack>

                    {/* Buttons */}
                    <Stack
                        direction="row"
                        spacing={2}
                        mt={6}
                        justifyContent={
                            mode === "view" ? "flex-start" : "flex-end"
                        }
                    >
                        {mode === "view" ? (
                            <CustomizableButton
                                variant="contained"
                                text="Close"
                                onClick={handleClose}
                            />
                        ) : (
                            <>
                                <CustomizableButton
                                    variant="outlined"
                                    text="Cancel"
                                    onClick={handleClose}
                                />
                                <CustomizableButton
                                    variant="contained"
                                    text={
                                        isEdit
                                            ? "Update incident"
                                            : "Save incident"
                                    }
                                    icon={<SaveIconSVGWhite />}
                                    onClick={handleSubmit}
                                    sx={{
                                        backgroundColor: "#13715B",
                                        border: "1px solid #13715B",
                                    }}
                                />
                            </>
                        )}
                    </Stack>
                </form>
            </Stack>
        </Drawer>
    );
};
export default SideDrawerIncident;
