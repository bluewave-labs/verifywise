/**
 * Component for adding a new vendor through a modal interface.
 *
 * @component
 * @param {AddNewVendorProps} props - The properties for the AddNewVendor component.
 * @param {boolean} props.isOpen - Determines if the modal is open.
 * @param {() => void} props.setIsOpen - Function to set the modal open state.
 * @param {string} props.value - The current value of the selected tab.
 * @param {(event: React.SyntheticEvent, newValue: string) => void} props.handleChange - Function to handle tab change events.
 *
 * @returns {JSX.Element} The rendered AddNewVendor component.
 */

import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

import {
    Box,
    Button,
    Modal,
    Stack,
    Tab,
    Typography,
    useTheme,
} from "@mui/material";
import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";
import DatePicker from "../../Inputs/Datepicker";
import { ReactComponent as Close } from "../../../assets/icons/close.svg";
import { Suspense, useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import {
    createNewUser,
    getAllEntities,
    updateEntityById,
} from "../../../../application/repository/entity.repository";
import Alert from "../../Alert";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import DualButtonModal from "../../../vw-v2-components/Dialogs/DualButtonModal";

export interface VendorDetails {
    id?: number;
    project_id: number,
    vendor_name: string;
    vendor_provides: string;
    website: string;
    vendor_contact_person: string;
    review_result: string;
    review_status: string;
    reviewer: string;
    risk_status: string;
    review_date: string;
    assignee: string;
}

interface Risks {
    riskDescription: string;
    impactDescription: string;
    projectName: string;
    probability: string;
    impact: string;
    actionOwner: string;
    riskSeverity: string;
    likelihood: string;
    riskLevel: string;
}

interface Values {
    vendorDetails: VendorDetails;
    risks: Risks;
}

interface FormErrors {
    vendorName?: string;
    vendorProvides?: string;
    website?: string;
    projectId?: string;
    vendorContactPerson?: string;
    reviewStatus?: string;
    assignee?: string
}

const initialState = {
    vendorDetails: {
        vendorName: "",
        website: "",
        projectId: 0,
        vendorProvides: "",
        vendorContactPerson: "",
        reviewStatus: "0",
        reviewer: "0",
        reviewResult: "",
        riskStatus: "0",
        assignee: "0",
        reviewDate: new Date().toISOString(),
    },
    risks: {
        riskDescription: "",
        impactDescription: "",
        impact: 0,
        probability: 0,
        actionOwner: 0,
        riskSeverity: 0,
        likelihood: 0,
        riskLevel: 0,
        actionPlan: "",
    },
};

interface AddNewVendorProps {
    isOpen: boolean;
    setIsOpen: () => void;
    value: string;
    handleChange: (event: React.SyntheticEvent, newValue: string) => void;
    existingVendor?: VendorDetails;
    onVendorChange?: () => void;
}

const ASSIGNEE_OPTIONS = [
    { _id: 1, name: "Assignee 1" },
    { _id: 2, name: "Assignee 2" },
    { _id: 3, name: "Assignee 3" },
]

const REVIEW_STATUS_OPTIONS = [
    { _id: "active", name: "Active" },
    { _id: "underReview", name: "Under review" },
    { _id: "notActive", name: "Not active" },
]

const REVIEWER_OPTIONS = [
    { _id: "George Michael", name: "George Michael" },
    { _id: "Sarah Lee", name: "Sarah Lee" },
    { _id: "Michael Lee", name: "Michael Lee" },
]

const RISK_LEVEL_OPTIONS = [
    { _id: 1, name: "Very high risk" },
    { _id: 2, name: "High risk" },
    { _id: 3, name: "Medium risk" },
    { _id: 4, name: "Low risk" },
    { _id: 5, name: "Very low risk" },
];

const LIKELIHOOD_OPTIONS = [
    { _id: 1, name: "Rare" },
    { _id: 2, name: "Unlikely" },
    { _id: 3, name: "Possible" },
    { _id: 4, name: "Likely" },
    { _id: 5, name: "Almost certain" },
]

const ACTION_OWNER_OPTIONS = [
    { _id: 1, name: "John McAllen" },
    { _id: 2, name: "Jessica Parker" },
    { _id: 3, name: "Michael Johnson" },
]

const IMPACT_OPTIONS = [
    { _id: 1, name: "Negligible" },
    { _id: 2, name: "Minor" },
    { _id: 3, name: "Moderate" },
    { _id: 4, name: "Major and Critical" },
]

const PROBABILITY_OPTIONS = [
    { _id: 1, name: "4" },
    { _id: 2, name: "3" },
    { _id: 3, name: "2" },
];

const RISK_SEVERITY_OPTIONS = [
    { _id: 1, name: "Low" },
    { _id: 2, name: "Medium" },
    { _id: 3, name: "High and Critical" },
]

const AddNewVendor: React.FC<AddNewVendorProps> = ({
    isOpen,
    setIsOpen,
    value,
    handleChange,
    existingVendor,
    onVendorChange = () => { },
}) => {
    const theme = useTheme();
    const [values, setValues] = useState({
        vendorDetails: {
            vendorName: existingVendor?.vendor_name || "",
            website: "",
            projectId: existingVendor?.project_id || "" ,
            vendorProvides: "",
            vendorContactPerson: "",
            reviewStatus: "0",
            reviewer: "0",
            reviewResult: "",
            riskStatus: "0",
            assignee: existingVendor?.assignee || "",
            reviewDate: existingVendor?.review_date || new Date().toISOString(),
        },
        risks: {
            riskDescription: "",
            impactDescription: "",
            impact: 0,
            probability: 0,
            actionOwner: 0,
            riskSeverity: 0,
            likelihood: 0,
            riskLevel: 0,
            actionPlan: "",
        },
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [alert, setAlert] = useState<{
        variant: "success" | "info" | "warning" | "error";
        title?: string;
        body: string;
    } | null>(null);

    const [projectOptions, setProjectOptions] = useState<
        { _id: number; name: string }[]
    >([]);
    const [projectsLoaded, setProjectsLoaded] = useState(false); // Track if projects are loaded
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchProjects = async () => {
        try {
            const response = await getAllEntities({ routeUrl: "/projects" });
            console.log("API response ===> ", response);

            if (response.data) {
                const formattedProjects = response.data.map((project: any) => ({
                    _id: project.id,
                    name: project.project_title,
                }));
                setProjectOptions(formattedProjects);
                setProjectsLoaded(true); // Mark projects as loaded
            } else {
                console.error("Unexpected response structure:", response);
                setProjectOptions([]);
            }
        } catch (error: any) {
            console.error("Error fetching projects:", error);
            setProjectOptions([]);
        }
    };

    useEffect(() => {
        if (isOpen && !projectsLoaded) {
            fetchProjects();
        }
    }, [isOpen, projectsLoaded]);

    useEffect(() => {
        if (existingVendor) {
            setValues((prevValues) => ({
                ...prevValues,
                vendorDetails: {
                    ...prevValues.vendorDetails,
                    vendorName: existingVendor.vendor_name,
                    website: existingVendor.website,
                    projectId: existingVendor.project_id,
                    vendorProvides: existingVendor.vendor_provides,
                    vendorContactPerson: existingVendor.vendor_contact_person,
                    reviewStatus:  REVIEW_STATUS_OPTIONS.find(s => s.name === existingVendor.review_status)?._id || "",
                    reviewer: existingVendor.reviewer,
                    reviewResult: existingVendor.review_result,
                    riskStatus: String(RISK_LEVEL_OPTIONS.find(s => s.name === existingVendor.risk_status)?._id) || ""  ,
                    assignee: String(ASSIGNEE_OPTIONS.find(s => s.name === existingVendor.assignee)?._id) || "0",
                    reviewDate: existingVendor.review_date,
                },
            }));
        }
    }, [existingVendor]);

    /**
     * Opens the confirmation modal if form validation passes
     */
    const handleSave = () => {
        if (validateForm()) {
            existingVendor ? setIsModalOpen(true) : handleOnSave();
        }
    };

    /**
     * Updates the review date in the vendor details
     * @param newDate - The new date value or null
     */
    const handleDateChange = (newDate: Dayjs | null) => {
        if (newDate?.isValid()) {
            setValues((prevValues) => ({
                ...prevValues,
                vendorDetails: {
                    ...prevValues.vendorDetails,
                    reviewDate: newDate ? newDate.toISOString() : "",
                },
            }));
        }
    };

    /**
     * Generic change handler for form fields
     * @param section - The section of the form (vendorDetails or risks)
     * @param field - The field name to update
     * @param value - The new value
     */
    const handleOnChange = (
        section: keyof Values,
        field: string,
        value: string | number
    ) => {
        console.log("handleOnChange", section, field, value);
        setValues((prevValues) => ({
            ...prevValues,
            [section]: {
                ...prevValues[section],
                [field]: value,
            },
        }));
        setErrors({ ...errors, [field]: "" });
    };

    /**
     * Validates all required fields in the form
     * @returns boolean indicating if form is valid
     */
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        const vendorName = checkStringValidation("Vendor Name", values.vendorDetails.vendorName, 1, 64);
        if (!vendorName.accepted) {
            newErrors.vendorName = vendorName.message;
        }
        const vendorWebsite = checkStringValidation("Vendor Website", values.vendorDetails.website, 1, 64);
        if (!vendorWebsite.accepted) {
            newErrors.website = vendorWebsite.message;
        }
        if (!values.vendorDetails.projectId || Number(values.vendorDetails.projectId) === 0) {
            newErrors.projectId = "Please select a project from the dropdown";
        }
        const vendorProvides = checkStringValidation("Vendor Provides", values.vendorDetails.vendorProvides, 1, 64);
        if (!vendorProvides.accepted) {
            newErrors.vendorProvides = vendorProvides.message;
        }
        const vendorContactPerson = checkStringValidation("Vendor Contact Person", values.vendorDetails.vendorContactPerson, 1, 64);
        if (!vendorContactPerson.accepted) {
            newErrors.vendorContactPerson = vendorContactPerson.message;
        }
        if (!values.vendorDetails.reviewStatus || Number(values.vendorDetails.reviewStatus) === 0) {
            newErrors.reviewStatus = "Please select a review status from the dropdown";
        }
        if (!values.vendorDetails.assignee || Number(values.vendorDetails.assignee) === 0) {
            newErrors.assignee = "Please select an assignee from the dropdown";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
    * Handles the final save operation after confirmation
    * Creates new vendor or updates existing one
    */
    const handleOnSave = async () => {
        const _vendorDetails = {
            projectId: values.vendorDetails.projectId,
            vendorName: values.vendorDetails.vendorName,
            assignee: ASSIGNEE_OPTIONS.find(a => a._id === Number(values.vendorDetails.assignee))?.name || "",
            vendorProvides: values.vendorDetails.vendorProvides,
            website: values.vendorDetails.website,
            vendorContact_person: values.vendorDetails.vendorContactPerson,
            reviewResult: values.vendorDetails.reviewResult,
            reviewStatus: REVIEW_STATUS_OPTIONS.find(s => s._id === values.vendorDetails.reviewStatus)?.name || "",
            reviewer: REVIEWER_OPTIONS.find(r => r._id === values.vendorDetails.reviewer)?.name || "",
            risk_status: RISK_LEVEL_OPTIONS.find(s => s._id === Number(values.vendorDetails.riskStatus))?.name || "",
            reviewDate: values.vendorDetails.reviewDate,
            riskDescription: values.risks.riskDescription,
            impactDescription: values.risks.impactDescription,
            impact: Number(values.risks.impact), 
            probability: Number(values.risks.probability), 
            actionOwner: ACTION_OWNER_OPTIONS.find(a => a._id === Number(values.risks.actionOwner))?.name || "",
            actionPlan: values.risks.actionPlan,
            riskSeverity: Number(values.risks.riskSeverity), 
            riskLevel: RISK_LEVEL_OPTIONS.find(r => r._id === values.risks.riskLevel)?.name || "",
            likelihood: Number(values.risks.likelihood) 
        };
        if (existingVendor) {
            await updateVendor(existingVendor.id!, _vendorDetails);
        } else {
            await createVendor(_vendorDetails);
        }
        setIsModalOpen(false);
    };

    /**
    * Creates a new vendor in the system
    * @param vendorDetails - The vendor details to create
    */
    const createVendor = async (vendorDetails:object) => {
        console.log(vendorDetails);
        await createNewUser({
            routeUrl: "/vendors",
            body: vendorDetails,
        }).then((response) => {
            setValues(initialState);
            if (response.status === 201) {
                setAlert({
                    variant: "success",
                    body: "Vendor created successfully",
                });
                setTimeout(() => {
                    setAlert(null);
                    onVendorChange();
                    setIsOpen();
                }, 1000);
            } else if (response.status === 400 || response.status === 500) {
                setAlert({
                    variant: "error",
                    body: response.data.data.message,
                });
                setTimeout(() => {
                    setAlert(null);
                    onVendorChange();
                    setIsOpen();
                }, 1000);
            }
        });
    };

    /**
     * Updates an existing vendor in the system
     * @param vendorId - The ID of the vendor to update
     * @param updatedVendorDetails - The new vendor details
     */
    const updateVendor = async (
        vendorId: number,
        updatedVendorDetails: object
    ) => {
        // Make a call to backend and update the vendor'
        console.log("Edit Vendor", vendorId, updatedVendorDetails);
        await updateEntityById({
            routeUrl: `/vendors/${vendorId}`,
            body: updatedVendorDetails,
        }).then((response) => {
            setValues(initialState);
            if (response.status === 202) {
                setAlert({
                    variant: "success",
                    body: "Vendor updated successfully",
                });
                setTimeout(() => {
                    setAlert(null);
                    onVendorChange();
                    setIsOpen();
                }, 1000);
            } else if (response.status == 400) {
                setAlert({
                    variant: "error",
                    body: response.data.data.message,
                });
            }
        });
    };

    const vendorDetailsPanel = (
        <TabPanel value="1" sx={{ paddingTop: theme.spacing(15), paddingX: 0 }}>
            <Stack
                direction={"row"}
                justifyContent={"space-between"}
                marginBottom={theme.spacing(8)}
            >
                <Field // vendorName
                    label="Vendor name"
                    width={220}
                    value={values.vendorDetails.vendorName}
                    // onChange={handleOnChange1("vendorDetails")}
                    onChange={(e) =>
                        handleOnChange("vendorDetails", "vendorName", e.target.value)
                    }
                    error={errors.vendorName}
                    isRequired
                />
                <Field // website
                    label="Website"
                    width={220}
                    value={values.vendorDetails.website}
                    onChange={(e) =>
                        handleOnChange("vendorDetails", "website", e.target.value)
                    }
                    error={errors.website}
                    isRequired
                />
                <Select // projectId
                    items={projectOptions}
                    label="Project name"
                    placeholder="Select project"
                    isHidden={false}
                    id=""
                    value={values.vendorDetails.projectId}
                    onChange={(e) =>
                        handleOnChange("vendorDetails", "projectId", e.target.value)
                    }
                    sx={{
                        width: 220,
                    }}
                    error={errors.projectId}
                    isRequired
                />
            </Stack>
            <Stack marginBottom={theme.spacing(8)}>
                <Field // vendorProvides
                    label="What does the vendor provide?"
                    width={"100%"}
                    type="description"
                    value={values.vendorDetails.vendorProvides}
                    onChange={(e) =>
                        handleOnChange("vendorDetails", "vendorProvides", e.target.value)
                    }
                    isRequired
                    error={errors.vendorProvides}
                />
            </Stack>
            <Stack
                direction={"row"}
                justifyContent={"space-between"}
                marginBottom={theme.spacing(8)}
            >
                <Field // vendorContactPerson
                    label="Vendor contact person"
                    width={220}
                    value={values.vendorDetails.vendorContactPerson}
                    onChange={(e) =>
                        handleOnChange("vendorDetails", "vendorContactPerson", e.target.value)
                    }
                    isRequired
                    error={errors.vendorContactPerson}
                />
                <Select // reviewStatus
                    items={REVIEW_STATUS_OPTIONS}
                    label="Review status"
                    placeholder="Select review status"
                    isHidden={false}
                    id=""
                    onChange={(e) =>
                        handleOnChange("vendorDetails", "reviewStatus", e.target.value)
                    }
                    value={values.vendorDetails.reviewStatus}
                    sx={{
                        width: 220,
                    }}
                    error={errors.reviewStatus}
                    isRequired
                />
                <Select // reviewer
                    items={REVIEWER_OPTIONS}
                    label="Reviewer"
                    placeholder="Select reviewer"
                    isHidden={false}
                    id=""
                    onChange={(e) =>
                        handleOnChange("vendorDetails", "reviewer", e.target.value)
                    }
                    value={values.vendorDetails.reviewer}
                    sx={{
                        width: 220,
                    }}
                />
            </Stack>
            <Stack
                display={"flex"}
                justifyContent={"space-between"}
                marginBottom={theme.spacing(8)}
                flexDirection={"row"}
            >
                <Field // reviewResult
                    label="Review result"
                    width={"100%"}
                    type="description"
                    value={values.vendorDetails.reviewResult}
                    onChange={(e) =>
                        handleOnChange("vendorDetails", "reviewResult", e.target.value)
                    }
                />
            </Stack>
            <Stack
                display={"flex"}
                justifyContent={"space-between"}
                marginBottom={theme.spacing(8)}
                flexDirection={"row"}
            >
                <Select // riskStatus
                    items={RISK_LEVEL_OPTIONS}
                    label="Risk status"
                    placeholder="Select risk status"
                    isHidden={false}
                    id=""
                    onChange={(e) =>
                        handleOnChange("vendorDetails", "riskStatus", e.target.value)
                    }
                    value={values.vendorDetails.riskStatus}
                    sx={{
                        width: 220,
                    }}
                />
                <Select // assignee (not in the server model!)
                    items={ASSIGNEE_OPTIONS}
                    label="Assignee"
                    placeholder="Select person"
                    isHidden={false}
                    id=""
                    onChange={(e) =>
                        handleOnChange("vendorDetails", "assignee", e.target.value)
                    }
                    value={values.vendorDetails.assignee}
                    sx={{
                        width: 220,
                    }}
                    isRequired
                    error={errors.assignee}
                />
                <DatePicker // reviewDate
                    label="Review date"
                    sx={{
                        width: 220,
                    }}
                    date={
                        values.vendorDetails.reviewDate
                            ? dayjs(values.vendorDetails.reviewDate)
                            : dayjs(new Date())
                    }
                    handleDateChange={handleDateChange}
                />
            </Stack>
        </TabPanel>
    );

    const risksPanel = (
        <TabPanel value="2" sx={{ paddingTop: theme.spacing(15), paddingX: 0 }}>
            <Stack
                direction={"row"}
                justifyContent={"space-between"}
                marginBottom={theme.spacing(8)}
            >
                <Field // riskDescription
                    label="Risk description"
                    width={350}
                    value={values.risks.riskDescription}
                    onChange={(e) =>
                        handleOnChange("risks", "riskDescription", e.target.value)
                    }
                />
                <Field // impactDescription
                    label="Impact description"
                    width={350}
                    value={values.risks.impactDescription}
                    onChange={(e) =>
                        handleOnChange("risks", "impactDescription", e.target.value)
                    }
                />
            </Stack>
            <Stack
                direction={"row"}
                justifyContent={"space-between"}
                marginBottom={theme.spacing(8)}
            >
                <Select // impact
                    items={IMPACT_OPTIONS}
                    label="Impact"
                    placeholder="Select impact"
                    isHidden={false}
                    id=""
                    onChange={(e) => handleOnChange("risks", "impact", e.target.value)}
                    value={values.risks.impact}
                    sx={{
                        width: 350,
                    }}
                />

                <Select // probability
                    items={PROBABILITY_OPTIONS}
                    label="Probability"
                    placeholder="Select probability"
                    isHidden={false}
                    id=""
                    value={values.risks.probability}
                    onChange={(e) => handleOnChange("risks", "probability", e.target.value)}
                    sx={{
                        width: 350,
                    }}
                />
            </Stack>
            <Stack
                display={"flex"}
                justifyContent={"space-between"}
                marginBottom={theme.spacing(8)}
                flexDirection={"row"}
            >
                <Box
                    justifyContent={"space-between"}
                    display={"grid"}
                    gap={theme.spacing(8)}
                >
                    <Select // riskSeverity
                        items={RISK_SEVERITY_OPTIONS}
                        label="Risk severity"
                        placeholder="Select risk severity"
                        isHidden={false}
                        id=""
                        onChange={(e) => handleOnChange("risks", "riskSeverity", e.target.value)}
                        value={values.risks.riskSeverity}
                        sx={{
                            width: 350,
                        }}
                    />

                    <Select // actionOwner
                        items={ACTION_OWNER_OPTIONS}
                        label="Action owner"
                        placeholder="Select owner"
                        isHidden={false}
                        id=""
                        onChange={(e) => handleOnChange("risks", "actionOwner", e.target.value)}
                        value={values.risks.actionOwner}
                        sx={{
                            width: 350,
                        }}
                    />
                </Box>
                <Field // actionPlan
                    label="Action plan"
                    width={350}
                    type="description"
                    value={values.risks.actionPlan}
                    onChange={(e) => handleOnChange("risks", "actionPlan", e.target.value)}
                />
            </Stack>
            <Stack
                direction={"row"}
                justifyContent={"space-between"}
                marginBottom={theme.spacing(8)}
            >
                <Select // riskLevel
                    items={RISK_LEVEL_OPTIONS}
                    label="Risk level"
                    placeholder="Select risk level"
                    isHidden={false}
                    id=""
                    onChange={(e) => handleOnChange("risks", "riskLevel", e.target.value)}
                    value={values.risks.riskLevel}
                    sx={{
                        width: 350,
                    }}
                />
                <Select // likelihood
                    items={LIKELIHOOD_OPTIONS}
                    label="Likelihood"
                    placeholder="Select risk severity"
                    isHidden={false}
                    id=""
                    onChange={(e) => handleOnChange("risks", "likelihood", e.target.value)}
                    value={values.risks.likelihood}
                    sx={{
                        width: 350,
                    }}
                />
            </Stack>
        </TabPanel>
    );

    return (
        <Stack>
            {alert && (
                <Suspense fallback={<div>Loading...</div>}>
                    <Alert
                        variant={alert.variant}
                        title={alert.title}
                        body={alert.body}
                        isToast={true}
                        onClick={() => setAlert(null)}
                    />
                </Suspense>
            )}
            <Modal
                open={isOpen}
                onClose={(_event, reason) => {
                    if (reason !== 'backdropClick') {
                        setIsOpen();
                    }
                }}
                disableEscapeKeyDown
                sx={{ overflowY: "scroll" }}
            >
                <Stack
                    gap={theme.spacing(2)}
                    color={theme.palette.text.secondary}
                    sx={{
                        backgroundColor: "#D9D9D9",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 800,
                        bgcolor: theme.palette.background.main,
                        border: 1,
                        borderColor: theme.palette.border,
                        borderRadius: theme.shape.borderRadius,
                        boxShadow: 24,
                        p: theme.spacing(15),
                        "&:focus": {
                            outline: "none",
                        },
                        mt: 5,
                        mb: 5,
                    }}
                >
                    <Stack
                        display={"flex"}
                        flexDirection={"row"}
                        justifyContent={"space-between"}
                        alignItems={"center"}
                    >
                        <Typography
                            fontSize={16}
                            fontWeight={600}
                            marginBottom={theme.spacing(5)}
                        >
                            {existingVendor ? "Edit vendor" : "Add new vendor"}
                        </Typography>
                        <Close style={{ cursor: "pointer" }} onClick={setIsOpen} />
                    </Stack>
                    <TabContext value={value}>
                        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                            <TabList onChange={handleChange}>
                                <Tab
                                    sx={{
                                        width: 120,
                                        paddingX: 0,
                                        textTransform: "inherit",
                                        fontSize: 13,
                                        "& .MuiTouchRipple-root": {
                                            display: "none",
                                        },
                                    }}
                                    label="Vendor details"
                                    value="1"
                                />
                                <Tab
                                    sx={{
                                        width: 60,
                                        paddingX: 0,
                                        textTransform: "capitalize",
                                        fontSize: 13,
                                        "& .MuiTouchRipple-root": {
                                            display: "none",
                                        },
                                    }}
                                    label="Risks"
                                    value="2"
                                />
                            </TabList>
                        </Box>
                        {vendorDetailsPanel}
                        {risksPanel}
                        <Stack
                            sx={{
                                alignItems: "flex-end",
                            }}
                        >
                            <Button
                                disableRipple
                                variant="contained"
                                sx={{
                                    width: 70,
                                    height: 34,
                                    fontSize: 13,
                                    textTransform: "capitalize",
                                    backgroundColor: "#4C7DE7",
                                    boxShadow: "none",
                                    borderRadius: "4px",
                                    border: "1px solid #175CD3",
                                    "&:hover": {
                                        boxShadow: "none",
                                        backgroundColor: "#175CD3 ",
                                    },
                                }}
                                onClick={handleSave}
                            >
                                Save
                            </Button>
                        </Stack>
                        {isModalOpen && (
                            <DualButtonModal
                                title="Confirm Save"
                                body={
                                    <Typography>Are you sure you want to save the changes?</Typography>
                                }
                                cancelText="Cancel"
                                proceedText="Confirm"
                                onCancel={() => setIsModalOpen(false)}
                                onProceed={handleOnSave}
                                proceedButtonColor="primary"
                                proceedButtonVariant="contained"
                            />
                        )}
                    </TabContext>
                </Stack>
            </Modal>
        </Stack>
    );
};

export default AddNewVendor;
