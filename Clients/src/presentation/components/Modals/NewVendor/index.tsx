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
import TabPanel from "@mui/lab/TabPanel";
import { Modal, Stack, Typography, useTheme } from "@mui/material";
import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";
import DatePicker from "../../Inputs/Datepicker";
import { ReactComponent as Close } from "../../../assets/icons/close.svg";
import { Suspense, useContext, useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import {
  createNewUser,
  updateEntityById,
} from "../../../../application/repository/entity.repository";
import Alert from "../../Alert";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import VWToast from "../../../vw-v2-components/Toast";
import { logEngine } from "../../../../application/tools/log.engine";
import VWButton from "../../../vw-v2-components/Buttons";
import SaveIcon from "@mui/icons-material/Save";

export interface VendorDetails {
  id?: number;
  projectId?: number;
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
  projects: number[];
}

interface FormErrors {
  vendorName?: string;
  vendorProvides?: string;
  website?: string;
  projectId?: string;
  vendorContactPerson?: string;
  reviewStatus?: string;
  assignee?: string;
  reviewer?: string;
  reviewResult?: string;
  riskStatus?: string;
}

const initialState = {
  vendorDetails: {
    vendorName: "",
    website: "",
    projectId: 0,
    vendorProvides: "",
    vendorContactPerson: "",
    reviewStatus: "",
    reviewer: "",
    reviewResult: "",
    riskStatus: 0,
    assignee: "",
    reviewDate: new Date().toISOString(),
  },
};

interface AddNewVendorProps {
  isOpen: boolean;
  setIsOpen: () => void;
  value: string;
  onSuccess: () => void;
  existingVendor?: VendorDetails | null;
  onChange?: () => void;
}

const REVIEW_STATUS_OPTIONS = [
  { _id: "active", name: "Active" },
  { _id: "underReview", name: "Under review" },
  { _id: "notActive", name: "Not active" },
];

const RISK_LEVEL_OPTIONS = [
  { _id: 1, name: "Very high risk" },
  { _id: 2, name: "High risk" },
  { _id: 3, name: "Medium risk" },
  { _id: 4, name: "Low risk" },
  { _id: 5, name: "Very low risk" },
];

const AddNewVendor: React.FC<AddNewVendorProps> = ({
  isOpen,
  setIsOpen,
  value,
  onSuccess,
  existingVendor,
  onChange = () => {},
}) => {
  const theme = useTheme();
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false); // Track if projects are loaded
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const [projectOptions, setProjectOptions] = useState<
    { _id: number; name: string }[]
  >([]);
  const { dashboardValues } = useContext(VerifyWiseContext);
  const { projects } = dashboardValues;

  const formattedUsers = dashboardValues?.users?.map((user: any) => ({
    _id: user.id,
    name: `${user.name} ${user.surname}`,
  }));

  const formattedProjects = useMemo(() => {
    return Array.isArray(projects)
      ? projects?.map((project: any) => ({
          _id: project.id,
          name: project.project_title,
        }))
      : [];
  }, [projects]);

  useEffect(() => {
    if (!isOpen) {
      setValues(initialState);
      setErrors({} as FormErrors);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !projectsLoaded) {
      setProjectOptions(formattedProjects);
      setProjectsLoaded(true);
    }
  }, [isOpen, projectsLoaded, formattedProjects]);

  useEffect(() => {
    if (isOpen && !existingVendor) {
      setValues(initialState);
    }
    if (existingVendor) {
      setValues((prevValues) => ({
        ...prevValues,
        vendorDetails: {
          ...prevValues.vendorDetails,
          vendorName: existingVendor.vendor_name,
          website: existingVendor.website,
          projectId: existingVendor.projects?.length
            ? existingVendor.projects[0]
            : 0,
          vendorProvides: existingVendor.vendor_provides,
          vendorContactPerson: existingVendor.vendor_contact_person,
          reviewStatus:
            REVIEW_STATUS_OPTIONS?.find(
              (s) => s.name === existingVendor.review_status
            )?._id || "",
          reviewer:
            formattedUsers?.find(
              (user: any) => user._id === existingVendor.reviewer
            )?._id || "",
          reviewResult: existingVendor.review_result,
          riskStatus:
            RISK_LEVEL_OPTIONS?.find(
              (s) => s.name === existingVendor.risk_status
            )?._id || 0,
          assignee:
            formattedUsers?.find(
              (user: any) => user._id === existingVendor.assignee
            )?._id || " ",
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
      handleOnSave();
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
  const handleOnChange = (field: string, value: string | number) => {
    setValues((prevValues) => ({
      ...prevValues,

      vendorDetails: {
        ...prevValues.vendorDetails,
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
    const vendorName = checkStringValidation(
      "Vendor Name",
      values.vendorDetails.vendorName,
      1,
      64
    );
    if (!vendorName.accepted) {
      newErrors.vendorName = vendorName.message;
    }
    const vendorWebsite = checkStringValidation(
      "Vendor Website",
      values.vendorDetails.website,
      1,
      64
    );
    if (!vendorWebsite.accepted) {
      newErrors.website = vendorWebsite.message;
    }
    const vendorReviewResult = checkStringValidation(
      "Vendor review result",
      values.vendorDetails.reviewResult,
      1,
      64
    );
    if (!vendorReviewResult.accepted) {
      newErrors.reviewResult = vendorReviewResult.message;
    }
    if (
      !values.vendorDetails.projectId ||
      Number(values.vendorDetails.projectId) === 0
    ) {
      newErrors.projectId = "Please select a project from the dropdown";
    }
    const vendorProvides = checkStringValidation(
      "Vendor Provides",
      values.vendorDetails.vendorProvides,
      1,
      64
    );
    if (!vendorProvides.accepted) {
      newErrors.vendorProvides = vendorProvides.message;
    }
    const vendorContactPerson = checkStringValidation(
      "Vendor Contact Person",
      values.vendorDetails.vendorContactPerson,
      1,
      64
    );
    if (!vendorContactPerson.accepted) {
      newErrors.vendorContactPerson = vendorContactPerson.message;
    }
    if (
      !values.vendorDetails.reviewStatus ||
      Number(values.vendorDetails.reviewStatus) === 0
    ) {
      newErrors.reviewStatus =
        "Please select a review status from the dropdown";
    }
    if (
      !values.vendorDetails.reviewer ||
      Number(values.vendorDetails.reviewer) === 0
    ) {
      newErrors.reviewer = "Please select a reviewer from the dropdown";
    }
    if (
      !values.vendorDetails.riskStatus ||
      Number(values.vendorDetails.riskStatus) === 0
    ) {
      newErrors.riskStatus = "Please select a risk status from the dropdown";
    }
    if (
      !values.vendorDetails.assignee ||
      Number(values.vendorDetails.assignee) === 0
    ) {
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
      projects: [values.vendorDetails.projectId],
      vendor_name: values.vendorDetails.vendorName,
      assignee: formattedUsers?.find(
        (user: any) => user._id === values.vendorDetails.assignee
      )?._id,
      vendor_provides: values.vendorDetails.vendorProvides,
      website: values.vendorDetails.website,
      vendor_contact_person: values.vendorDetails.vendorContactPerson,
      review_result: values.vendorDetails.reviewResult,
      review_status:
        REVIEW_STATUS_OPTIONS?.find(
          (s) => s._id === values.vendorDetails.reviewStatus
        )?.name || "",
      reviewer: formattedUsers?.find(
        (user: any) => user._id === values.vendorDetails.reviewer
      )?._id,
      risk_status:
        RISK_LEVEL_OPTIONS?.find(
          (s) => s._id === values.vendorDetails.riskStatus
        )?.name || 0,
      review_date: values.vendorDetails.reviewDate,
    };
    if (existingVendor) {
      await updateVendor(existingVendor.id!, _vendorDetails);
    } else {
      await createVendor(_vendorDetails);
    }
  };

  /**
   * Creates a new vendor in the system
   * @param vendorDetails - The vendor details to create
   */
  const createVendor = async (vendorDetails: object) => {
    setIsSubmitting(true);
    try {
      const response = await createNewUser({
        routeUrl: "/vendors",
        body: vendorDetails,
      });

      if (response.status === 201) {
        setAlert({
          variant: "success",
          body: "Vendor created successfully",
        });
        setTimeout(() => setAlert(null), 3000);
        onSuccess();
        setIsOpen();
      } else {
        setAlert({
          variant: "error",
          body: response.data?.data?.message || "An error occurred.",
        });
        setTimeout(() => {
          setAlert(null);
          onChange();
        }, 3000);
      }
    } catch (error) {
      console.error("API Error:", error);
      logEngine({
        type: "error",
        message: "Unexpected response. Please try again.",
      });

      setAlert({
        variant: "error",
        body: `An error occurred: ${
          (error as Error).message || "Please try again."
        }`,
      });

      setTimeout(() => setAlert(null), 3000);
    } finally {
      setIsSubmitting(false);
      setValues(initialState);
    }
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
    setIsSubmitting(true);
    try {
      const response = await updateEntityById({
        routeUrl: `/vendors/${vendorId}`,
        body: updatedVendorDetails,
      });

      if (response.status === 202) {
        setAlert({
          variant: "success",
          body: "Vendor updated successfully",
        });
        setTimeout(() => setAlert(null), 3000);
        onSuccess();
        setIsOpen();
      } else {
        setAlert({
          variant: "error",
          body: response.data?.data?.message || "An error occurred.",
        });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (error) {
      console.error("API Error:", error);
      logEngine({
        type: "error",
        message: "Unexpected response. Please try again.",
      });
      setAlert({
        variant: "error",
        body: `An error occurred: ${
          (error as Error).message || "Please try again."
        }`,
      });

      setTimeout(() => setAlert(null), 3000);
    } finally {
      setIsSubmitting(false);
      setValues(initialState);
    }
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
          value={values?.vendorDetails?.vendorName}
          onChange={(e) => handleOnChange("vendorName", e.target.value)}
          error={errors.vendorName}
          isRequired
        />
        <Field // website
          label="Website"
          width={220}
          value={values.vendorDetails.website}
          onChange={(e) => handleOnChange("website", e.target.value)}
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
          onChange={(e) => handleOnChange("projectId", e.target.value)}
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
          onChange={(e) => handleOnChange("vendorProvides", e.target.value)}
          error={errors.vendorProvides}
          isRequired
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
            handleOnChange("vendorContactPerson", e.target.value)
          }
          error={errors.vendorContactPerson}
          isRequired
        />
        <Select // reviewStatus
          items={REVIEW_STATUS_OPTIONS}
          label="Review status"
          placeholder="Select review status"
          isHidden={false}
          id=""
          onChange={(e) => handleOnChange("reviewStatus", e.target.value)}
          value={values.vendorDetails.reviewStatus}
          sx={{
            width: 220,
          }}
          error={errors.reviewStatus}
          isRequired
        />
        <Select // reviewer
          items={formattedUsers}
          label="Reviewer"
          placeholder="Select reviewer"
          isHidden={false}
          id=""
          onChange={(e) => handleOnChange("reviewer", e.target.value)}
          value={values.vendorDetails.reviewer}
          error={errors.reviewer}
          sx={{
            width: 220,
          }}
          isRequired
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
          error={errors.reviewResult}
          onChange={(e) => handleOnChange("reviewResult", e.target.value)}
          isRequired
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
          onChange={(e) => handleOnChange("riskStatus", e.target.value)}
          value={values.vendorDetails.riskStatus}
          error={errors.riskStatus}
          sx={{
            width: 220,
          }}
          isRequired
        />
        <Select // assignee (not in the server model!)
          items={formattedUsers}
          label="Assignee"
          placeholder="Select person"
          isHidden={false}
          id=""
          onChange={(e) => handleOnChange("assignee", e.target.value)}
          value={values.vendorDetails.assignee}
          sx={{
            width: 220,
          }}
          error={errors.assignee}
          isRequired
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
          isRequired
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
      {isSubmitting && (
        <VWToast title="Processing your request. Please wait..." />
      )}
      <Modal
        open={isOpen}
        onClose={(_event, reason) => {
          if (reason !== "backdropClick") {
            setValues(initialState);
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
            {vendorDetailsPanel}
            <Stack
              sx={{
                alignItems: "flex-end",
              }}
            >
              <VWButton
                variant="contained"
                text="Save"
                sx={{
                  backgroundColor: "#13715B",
                  border: "1px solid #13715B",
                  gap: 2,
                }}
                onClick={handleSave}
                icon={<SaveIcon />}
              />
            </Stack>
          </TabContext>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default AddNewVendor;
