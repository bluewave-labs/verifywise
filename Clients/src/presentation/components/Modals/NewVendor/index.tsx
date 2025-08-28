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
import {
  Autocomplete,
  AutocompleteRenderInputParams,
  Box,
  Modal,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";
import DatePicker from "../../Inputs/Datepicker";
import { ReactComponent as Close } from "../../../assets/icons/close.svg";
import { Suspense, useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import Alert from "../../Alert";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import { useAuth } from "../../../../application/hooks/useAuth";
import { useProjects } from "../../../../application/hooks/useProjects";
import useUsers from "../../../../application/hooks/useUsers";
import CustomizableToast from "../../../vw-v2-components/Toast";
import { logEngine } from "../../../../application/tools/log.engine";
import CustomizableButton from "../../../vw-v2-components/Buttons";
import SaveIcon from "@mui/icons-material/Save";
import { KeyboardArrowDown } from "@mui/icons-material";
import allowedRoles from "../../../../application/constants/permissions";
import { useCreateVendor, useUpdateVendor } from "../../../../application/hooks/useVendors";

export interface VendorDetails {
  id?: number;
  vendor_name: string;
  vendor_provides: string;
  website: string;
  vendor_contact_person: string;
  review_result: string;
  review_status: string;
  reviewer: string;
  review_date: string;
  assignee: string;
  projects: number[];
}

interface FormErrors {
  vendorName?: string;
  vendorProvides?: string;
  website?: string;
  projectIds?: string;
  vendorContactPerson?: string;
  reviewStatus?: string;
  assignee?: string;
  reviewer?: string;
  reviewResult?: string;
}

const initialState = {
  vendorDetails: {
    vendorName: "",
    website: "",
    projectIds: [] as number[],
    vendorProvides: "",
    vendorContactPerson: "",
    reviewStatus: "",
    reviewer: "",
    reviewResult: "",
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
  { _id: "notStarted", name: "Not started" },
  { _id: "inReview", name: "In review" },
  { _id: "reviewed", name: "Reviewed" },
  { _id: "requiresFollowUp", name: "Requires follow-up" },
];


const AddNewVendor: React.FC<AddNewVendorProps> = ({
  isOpen,
  setIsOpen,
  value,
  onSuccess,
  existingVendor,
  onChange = () => { },
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
  const { userRoleName } = useAuth();
  const { users } = useUsers();
  const { data: projects } = useProjects();

  // TanStack Query hooks
  const createVendorMutation = useCreateVendor();
  const updateVendorMutation = useUpdateVendor();

  const isEditingDisabled = !allowedRoles.vendors.edit.includes(userRoleName);

  const formattedUsers = users?.map((user: any) => ({
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
          projectIds: existingVendor.projects || [],
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
  const handleOnChange = (field: string, value: string | number | number[]) => {
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
      !values.vendorDetails.projectIds ||
      Number(values.vendorDetails.projectIds.length) === 0
    ) {
      newErrors.projectIds = "Please select a project from the dropdown";
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
        "Please select a status from the dropdown";
    }
    if (
      !values.vendorDetails.reviewer ||
      Number(values.vendorDetails.reviewer) === 0
    ) {
      newErrors.reviewer = "Please select a reviewer from the dropdown";
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
      projects: values.vendorDetails.projectIds,
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
      const response = await createVendorMutation.mutateAsync(vendorDetails);

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
        body: `An error occurred: ${(error as Error).message || "Please try again."
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
      const response = await updateVendorMutation.mutateAsync({
        id: vendorId,
        data: updatedVendorDetails,
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
        body: `An error occurred: ${(error as Error).message || "Please try again."
          }`,
      });

      setTimeout(() => setAlert(null), 3000);
    } finally {
      setIsSubmitting(false);
      setValues(initialState);
    }
  };

  const vendorDetailsPanel = (
    <TabPanel value="1" sx={{ paddingTop: theme.spacing(15), paddingX: 8 }}>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(8)}
        gap={theme.spacing(8)}
      >
        <Stack>
          <Field // vendorName
            label="Vendor name"
            width={220}
            value={values?.vendorDetails?.vendorName}
            onChange={(e) => handleOnChange("vendorName", e.target.value)}
            error={errors.vendorName}
            isRequired
            disabled={isEditingDisabled}
          />
          <Box mt={theme.spacing(8)}>
            <Field // website
              label="Website"
              width={220}
              value={values.vendorDetails.website}
              onChange={(e) => handleOnChange("website", e.target.value)}
              error={errors.website}
              isRequired
              disabled={isEditingDisabled}
            />
          </Box>
        </Stack>
        <Stack sx={{ flex: 1 }}
          mt={theme.spacing(1)}>
          <Stack >
            <Typography
              sx={{
                fontSize: theme.typography.fontSize,
                fontWeight: 500,
                mb: 2,
              }}
            >
              Projects*
            </Typography>
            <Autocomplete
              multiple
              id="projects-input"
              size="small"
              disabled={isEditingDisabled}
              value={
                projectOptions?.filter((project) =>
                  values.vendorDetails.projectIds?.includes(project._id)
                ) || []
              }
              options={projectOptions || []}
              noOptionsText={
                values?.vendorDetails?.projectIds?.length ===
                  projectOptions?.length
                  ? "All projects are selected"
                  : "No options"
              }
              onChange={(_event, newValue: { _id: number; name: string }[]) => {
                handleOnChange(
                  "projectIds",
                  newValue.map((project) => project._id)
                );
              }}
              getOptionLabel={(project: { _id: number; name: string }) =>
                project.name
              }
              renderOption={(props, option: { _id: number; name: string }) => {
                const { key, ...optionProps } = props;
                return (
                  <Box key={option._id} component="li" {...optionProps}>
                    <Typography sx={{ fontSize: "13px" }}>
                      {option.name}
                    </Typography>
                  </Box>
                );
              }}
              filterSelectedOptions
              popupIcon={<KeyboardArrowDown />}
              renderInput={(params: AutocompleteRenderInputParams) => (
                <TextField
                  {...params}
                  placeholder="Select projects"
                  required
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      minHeight: "34px",
                      height: "auto",
                      alignItems: "flex-start",
                      paddingY: "3px !important",
                      flexWrap: "wrap",
                      gap: "2px",
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
                "& .MuiOutlinedInput-root": {
                  borderRadius: "3px",
                  overflowY: "auto",
                  flexWrap: "wrap",
                  maxHeight: "115px",
                  alignItems: "flex-start",
                  "&:hover": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    border: "none",
                  },
                  "&.Mui-focused": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                  },
                },
                "& .MuiAutocomplete-tag": {
                  margin: "2px",
                  maxWidth: "calc(100% - 25px)",
                  "& .MuiChip-label": {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  },
                },
                border: errors.projectIds ? `1px solid #f04438` : `1px solid ${theme.palette.border.dark}`,
                borderRadius: "3px",
                opacity: errors.projectIds ? 0.8 : 1,
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
            {errors.projectIds && (
              <Typography
                color="error"
                variant="caption"
                sx={{ mt: 0.5, ml: 1, color: "#f04438", opacity: 0.8 }}
              >
                {errors.projectIds}
              </Typography>
            )}
          </Stack>
          <Stack
            direction={"row"}
            justifyContent={"space-between"}
            gap={theme.spacing(8)}
            mt={theme.spacing(8)}
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
              disabled={isEditingDisabled}
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
              disabled={isEditingDisabled}
            />
          </Stack>
        </Stack>

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
          disabled={isEditingDisabled}
        />
      </Stack>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(8)}
      >
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
          disabled={isEditingDisabled}
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
          disabled={isEditingDisabled}
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
          disabled={isEditingDisabled}
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
          disabled={isEditingDisabled}
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
        <CustomizableToast title="Processing your request. Please wait..." />
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
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            bgcolor: theme.palette.background.main,
            border: 1,
            borderColor: theme.palette.border,
            borderRadius: theme.shape.borderRadius,
            boxShadow: 24,
            p: theme.spacing(15),
            "&:focus": {
              outline: "none",
            },
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
          <Box
            sx={{ flex: 1, overflow: "auto", marginBottom: theme.spacing(8) }}
          >
            <TabContext value={value}>{vendorDetailsPanel}</TabContext>
          </Box>
          <Stack
            sx={{
              alignItems: "flex-end",
              marginTop: "auto",
            }}
          >
            <CustomizableButton
              variant="contained"
              text="Save"
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 2,
              }}
              onClick={handleSave}
              icon={<SaveIcon />}
              isDisabled={isEditingDisabled}
            />
          </Stack>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default AddNewVendor;
