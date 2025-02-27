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

import { Box, Button, Modal, Stack, Typography, useTheme } from "@mui/material";
import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";
import { ReactComponent as Close } from "../../../assets/icons/close.svg";
import { Suspense, useContext, useEffect, useState } from "react";
import { Dayjs } from "dayjs";
import {
    createNewUser,
  getAllEntities,
  updateEntityById,
} from "../../../../application/repository/entity.repository";
import Alert from "../../Alert";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";

import DualButtonModal from "../../../vw-v2-components/Dialogs/DualButtonModal";
import useUsers from "../../../../application/hooks/useUsers";

interface Risks {
  riskDescription: string;
  impactDescription: string;
  projectName: string;
  impact: string;
  actionOwner: string;
  riskSeverity: string;
  likelihood: string;
  riskLevel: string;
  actionPlan: string;
  vendorId:number;
}
interface FormErrors {
  vendorName?: string;
  vendorProvides?: string;
  website?: string;
  projectId?: string;
  vendorContactPerson?: string;
  reviewStatus?: string;
  assignee?: string;
}
interface AddNewRiskProps {
  isOpen: boolean;
  setIsOpen: () => void;
  value: string;
  handleChange: (event: React.SyntheticEvent, newValue: string) => void;
  existingRisk?: Risks;
  onRiskChange?: () => void;
}

const initialState = {
  riskDescription: "",
  impactDescription: "",
  impact: 0,
  actionOwner: "0",
  riskSeverity: 0,
  likelihood: 0,
  riskLevel: 0,
  actionPlan: "",
  vendorId:0
};

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

const LIKELIHOOD_OPTIONS = [
  { _id: 1, name: "Rare" },
  { _id: 2, name: "Unlikely" },
  { _id: 3, name: "Possible" },
  { _id: 4, name: "Likely" },
  { _id: 5, name: "Almost certain" },
];

const IMPACT_OPTIONS = [
  { _id: 1, name: "Negligible" },
  { _id: 2, name: "Minor" },
  { _id: 3, name: "Moderate" },
  { _id: 4, name: "Major and Critical" },
];

const RISK_SEVERITY_OPTIONS = [
  { _id: 1, name: "Low" },
  { _id: 2, name: "Medium" },
  { _id: 3, name: "High and Critical" },
];

const AddNewRisk: React.FC<AddNewRiskProps> = ({
  isOpen,
  setIsOpen,
  value,
  handleChange,
  existingRisk,
  onRiskChange = () => {},
}) => {
  const theme = useTheme();
    const { dashboardValues } = useContext(VerifyWiseContext);
  
  const [values, setValues] = useState({
    riskDescription: "",
    impactDescription: "",
    impact: 0,
    actionOwner: "",
    riskSeverity: 0,
    likelihood: 0,
    riskLevel: 0,
    actionPlan: "",
    vendorId:1
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
  const { users } = useUsers();

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
    if (existingRisk) {
      setValues((prevValues) => ({
        ...prevValues,

        riskDescription: existingRisk.riskDescription,
        impactDescription: existingRisk.impactDescription,
        impact: Number(existingRisk.impact),
        actionOwner: existingRisk.actionOwner,
        riskSeverity: Number(existingRisk.riskSeverity),
        likelihood: Number(existingRisk.likelihood),
        riskLevel: Number(existingRisk.riskLevel),
        actionPlan: existingRisk.actionPlan,


        // reviewStatus:  REVIEW_STATUS_OPTIONS.find(s => s.name === existingRisk.review_status)?._id || "",
        // reviewer: String(users?.find(s => s.name === existingRisk.reviewer)?.id) || "0",
        // reviewResult: existingRisk.review_result,
        // riskStatus: String(RISK_LEVEL_OPTIONS.find(s => s.name === existingRisk.risk_status)?._id) || ""  ,
        // assignee: String(users?.find(s => s.name === existingRisk.assignee)?.id) || "0",
        // reviewDate: existingRisk.review_date,
      }));
    }
  }, [existingRisk]);

  /**
   * Opens the confirmation modal if form validation passes
   */
  const handleSave = () => {
    if (validateForm()) {
      existingRisk ? setIsModalOpen(true) : handleOnSave();
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
        riskDetails: {
          ...prevValues,
          reviewDate: newDate ? newDate.toISOString() : "",
        },
      }));
    }
  };

  /**
   * Generic change handler for form fields
   * @param section - The section of the form (riskDetails or risks)
   * @param field - The field name to update
   * @param value - The new value
   */
  const handleOnChange = (field: string, value: string | number) => {
    console.log("handleOnChange", field, value);
    setValues((prevValues) => ({
      ...prevValues,

      [field]: value,
    }));
    setErrors({ ...errors, [field]: "" });
  };

  /**
   * Validates all required fields in the form
   * @returns boolean indicating if form is valid
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    // const vendorName = checkStringValidation(
    //   "Vendor Name",
    //   values.riskDetails.vendorName,
    //   1,
    //   64
    // );
    // if (!vendorName.accepted) {
    //   newErrors.vendorName = vendorName.message;
    // }
    // const vendorWebsite = checkStringValidation(
    //   "Vendor Website",
    //   values.riskDetails.website,
    //   1,
    //   64
    // );
    // if (!vendorWebsite.accepted) {
    //   newErrors.website = vendorWebsite.message;
    // }
    // if (
    //   !values.riskDetails.projectId ||
    //   Number(values.riskDetails.projectId) === 0
    // ) {
    //   newErrors.projectId = "Please select a project from the dropdown";
    // }
    // const vendorProvides = checkStringValidation(
    //   "Vendor Provides",
    //   values.riskDetails.vendorProvides,
    //   1,
    //   64
    // );
    // if (!vendorProvides.accepted) {
    //   newErrors.vendorProvides = vendorProvides.message;
    // }
    // const vendorContactPerson = checkStringValidation(
    //   "Vendor Contact Person",
    //   values.riskDetails.vendorContactPerson,
    //   1,
    //   64
    // );
    // if (!vendorContactPerson.accepted) {
    //   newErrors.vendorContactPerson = vendorContactPerson.message;
    // }
    // if (
    //   !values.riskDetails.reviewStatus ||
    //   Number(values.riskDetails.reviewStatus) === 0
    // ) {
    //   newErrors.reviewStatus =
    //     "Please select a review status from the dropdown";
    // }
    // if (
    //   !values.riskDetails.assignee ||
    //   Number(values.riskDetails.assignee) === 0
    // ) {
    //   newErrors.assignee = "Please select an assignee from the dropdown";
    // }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles the final save operation after confirmation
   * Creates new vendor or updates existing one
   */
  const handleOnSave = async () => {
    const _riskDetails = {
      risk_description: values.riskDescription,
      impact_description: values.impactDescription,
      impact: Number(values.impact),
      action_owner:
        users.find((a) => a.id === values.actionOwner)?.name || "",
      action_plan: values.actionPlan,
      risk_severity: Number(values.riskSeverity),
      risk_level:
        RISK_LEVEL_OPTIONS.find((r) => r._id === values.riskLevel)
          ?.name || "",
      likelihood: Number(values.likelihood),
      vendor_id: 1
    };
    if (existingRisk) {
    //   await updateRisk(existingRisk.id!, _riskDetails);
    } else {
      await createRisk(_riskDetails);
    }
    setIsModalOpen(false);
  };

  /**
   * Creates a new vendor in the system
   * @param riskDetails - The vendor details to create
   */
  const createRisk = async (riskDetails:object) => {
      console.log(riskDetails);
      await createNewUser({
          routeUrl: "/vendorRisks",
          body: riskDetails,
      }).then((response) => {
          setValues(initialState);
          if (response.status === 201) {
              setAlert({
                  variant: "success",
                  body: "Vendor-Risk created successfully",
              });
              setTimeout(() => {
                  setAlert(null);
                  onRiskChange();
                  setIsOpen();
              }, 1000);
          } else if (response.status === 400 || response.status === 500) {
              setAlert({
                  variant: "error",
                  body: response.data.data.message,
              });
              setTimeout(() => {
                  setAlert(null);
                  onRiskChange();
                  setIsOpen();
              }, 1000);
          }
      });
  };

  /**
   * Updates an existing vendor in the system
   * @param riskId - The ID of the vendor to update
   * @param updatedriskDetails - The new vendor details
   */
  const updateRisk = async (
    riskId: number,
    updatedriskDetails: object
  ) => {
    // Make a call to backend and update the vendor'
    console.log("Edit Vendor", riskId, updatedriskDetails);
    await updateEntityById({
      routeUrl: `/vendorRisks/${riskId}`,
      body: updatedriskDetails,
    }).then((response) => {
      setValues(initialState);
      if (response.status === 202) {
        setAlert({
          variant: "success",
          body: "Vendor-Risk updated successfully",
        });
        setTimeout(() => {
          setAlert(null);
          onRiskChange();
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
          value={values.riskDescription}
          onChange={(e) =>
            handleOnChange("riskDescription", e.target.value)
          }
        />
        <Field // impactDescription
          label="Impact description"
          width={350}
          value={values.impactDescription}
          onChange={(e) =>
            handleOnChange( "impactDescription", e.target.value)
          }
        />
      </Stack>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(8)}
      >
        {/* <Select // vendor
          items={IMPACT_OPTIONS}
          label="vendor"
          placeholder="Select vendor"
          isHidden={false}
          id=""
          onChange={(e) => handleOnChange( "vendor", e.target.value)}
          value={values.impact}
          sx={{
            width: 350,
          }}
        /> */}
        <Select // impact
          items={IMPACT_OPTIONS}
          label="Impact"
          placeholder="Select impact"
          isHidden={false}
          id=""
          onChange={(e) => handleOnChange( "impact", e.target.value)}
          value={values.impact}
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
          onChange={(e) =>
            handleOnChange("likelihood", e.target.value)
          }
          value={values.likelihood}
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
            onChange={(e) =>
              handleOnChange( "riskSeverity", e.target.value)
            }
            value={values.riskSeverity}
            sx={{
              width: 350,
            }}
          />

          <Select // actionOwner
            items={
              users?.map((user) => ({
                _id: String(user.id),
                name: `${user.name} ${user.surname}`,
              })) || []
            }
            label="Action owner"
            placeholder="Select owner"
            isHidden={false}
            id=""
            onChange={(e) =>
              handleOnChange("actionOwner", e.target.value)
            }
            value={values.actionOwner}
            sx={{
              width: 350,
            }}
          />
        </Box>
        <Field // actionPlan
          label="Action plan"
          width={350}
          type="description"
          value={values.actionPlan}
          onChange={(e) =>
            handleOnChange( "actionPlan", e.target.value)
          }
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
          onChange={(e) => handleOnChange("riskLevel", e.target.value)}
          value={values.riskLevel}
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
          if (reason !== "backdropClick") {
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
              {existingRisk ? "Edit vendor" : "Add new vendor"}
            </Typography>
            <Close style={{ cursor: "pointer" }} onClick={setIsOpen} />
          </Stack>
          <TabContext value={value}>
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
                  <Typography>
                    Are you sure you want to save the changes?
                  </Typography>
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

export default AddNewRisk;
