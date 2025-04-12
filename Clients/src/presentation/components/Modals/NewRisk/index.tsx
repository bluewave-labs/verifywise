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
import { Box, Modal, Stack, Typography, useTheme } from "@mui/material";
import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";
import { ReactComponent as Close } from "../../../assets/icons/close.svg";
import { Suspense, useContext, useEffect, useState } from "react";
import {
  createNewUser,
  updateEntityById,
} from "../../../../application/repository/entity.repository";
import Alert from "../../Alert";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import useUsers from "../../../../application/hooks/useUsers";
import { Likelihood, RISK_LABELS } from "../../RiskLevel/constants";
import { RiskLikelihood } from "../../RiskLevel/riskValues";
import VWToast from "../../../vw-v2-components/Toast";
import { logEngine } from "../../../../application/tools/log.engine";
import { User } from "../../../../domain/User";
import { getUserForLogging } from "../../../../application/tools/userHelpers";
import VWButton from "../../../vw-v2-components/Buttons";
import SaveIcon from "@mui/icons-material/Save";
import { riskSeverityItems, likelihoodItems } from "../../AddNewRiskForm/projectRiskValue";

interface ExistingRisk {
  id?: number;
  risk_description: string;
  impact_description: string;
  project_name?: string;
  impact: string;
  action_owner: string;
  risk_severity: string;
  likelihood: string;
  risk_level: string;
  action_plan: string;
  vendor_id: string;
}
interface FormErrors {
  risk_description: string;
  impact_description: string;
  impact: string;
  action_owner: string;
  risk_severity: string;
  likelihood: string;
  risk_level?: string;
  action_plan: string;
  vendor_id: string;
}
interface AddNewRiskProps {
  isOpen: boolean;
  setIsOpen: () => void;
  value: string;
  handleChange: (event: React.SyntheticEvent, newValue: string) => void;
  existingRisk?: ExistingRisk | null;
  onSuccess?: () => void;
}

const initialState = {
  risk_description: "",
  impact_description: "",
  impact: 0,
  action_owner: "0",
  risk_severity: 0,
  likelihood: 0,
  risk_level: 0,
  action_plan: "",
  vendor_id: "",
};

const RISK_LEVEL_OPTIONS = [
  { _id: 1, name: "Very high risk" },
  { _id: 2, name: "High risk" },
  { _id: 3, name: "Medium risk" },
  { _id: 4, name: "Low risk" },
  { _id: 5, name: "Very low risk" },
];

const LIKELIHOOD_OPTIONS = [
  { _id: Likelihood.Rare, name: RiskLikelihood.Rare },
  { _id: Likelihood.Unlikely, name: RiskLikelihood.Unlikely },
  { _id: Likelihood.Possible, name: RiskLikelihood.Possible },
  { _id: Likelihood.Likely, name: RiskLikelihood.Likely },
  { _id: Likelihood.AlmostCertain, name: RiskLikelihood.AlmostCertain },
];

const IMPACT_OPTIONS = [
  { _id: 1, name: "Negligible" },
  { _id: 2, name: "Minor" },
  { _id: 3, name: "Moderate" },
  { _id: 4, name: "Major" },
  { _id: 5, name: "Critical" },
];


const AddNewRisk: React.FC<AddNewRiskProps> = ({
  isOpen,
  setIsOpen,
  value,
  existingRisk,
  onSuccess = () => {},
}) => {
  const theme = useTheme();
  const { dashboardValues } = useContext(VerifyWiseContext);
  const VENDOR_OPTIONS =
    dashboardValues?.vendors?.length > 0
      ? dashboardValues.vendors.map((vendor: any) => ({
          _id: vendor.id,
          name: vendor.vendor_name,
        }))
      : [{ _id: "no-vendor", name: "No Vendor Exists" }];

  const [values, setValues] = useState({
    risk_description: "",
    impact_description: "",
    impact: 0,
    action_owner: "",
    risk_severity: 0,
    likelihood: 0,
    risk_level: 0,
    action_plan: "",
    vendor_id: "",
  });
  const [errors, setErrors] = useState({} as FormErrors);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const { users } = useUsers();

  const user: User = {
    id: Number(localStorage.getItem("userId")) || -1,
    email: "N/A",
    name: "N/A",
    surname: "N/A",
  };
  const formattedUsers = users?.map((user) => ({
    _id: user.id,
    name: `${user.name} ${user.surname}`,
  }));
  useEffect(() => {
    if (!isOpen) {
      setValues(initialState);
      setErrors({} as FormErrors);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !existingRisk) {
      setValues(initialState);
    } else if (existingRisk) {
      setValues((prevValues) => ({
        ...prevValues,
        risk_description: existingRisk.risk_description,
        impact_description: existingRisk.impact_description,
        impact:
          IMPACT_OPTIONS.find((r) => r.name === existingRisk.impact)?._id || 0,
        action_owner:
          formattedUsers?.find((user) => user._id === existingRisk.action_owner)
            ?._id || "",
        risk_severity:
        riskSeverityItems.find(
            (r) => r.name === existingRisk.risk_severity
          )?._id || 0,
        likelihood:
          LIKELIHOOD_OPTIONS.find((r) => r.name === existingRisk.likelihood)
            ?._id || 0,
        risk_level:
          RISK_LEVEL_OPTIONS.find((r) => r.name === existingRisk.risk_level)
            ?._id || 0,
        action_plan: existingRisk.action_plan,
        vendor_id: existingRisk.vendor_id,
      }));
    }
  }, [existingRisk, isOpen]);

  const handleSave = () => {
    if (validateForm()) {
      handleOnSave();
    }
  };

  /**
   * Generic change handler for form fields
   * @param section - The section of the form (riskDetails or risks)
   * @param field - The field name to update
   * @param value - The new value
   */
  const getRiskLevel = (score: number): { text: string; color: string } => {
    if (score <= 3) {
      return RISK_LABELS.low;
    } else if (score <= 6) {
      return RISK_LABELS.medium;
    } else if (score <= 9) {
      return RISK_LABELS.high;
    } else {
      return RISK_LABELS.critical;
    }
  };

  const handleOnChange = (field: string, value: string | number) => {
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
    const newErrors = {} as FormErrors;
    const risk_description = checkStringValidation(
      "Risk description",
      values.risk_description,
      1,
      64
    );
    if (!risk_description.accepted) {
      newErrors.risk_description = risk_description.message;
    }
    const impact_description = checkStringValidation(
      "Impact description",
      values.impact_description,
      1,
      64
    );
    if (!impact_description.accepted) {
      newErrors.impact_description = impact_description.message;
    }
    const action_plan = checkStringValidation(
      "Action plan",
      values.action_plan,
      1,
      64
    );
    if (!action_plan.accepted) {
      newErrors.action_plan = action_plan.message;
    }
    if (!values.vendor_id || Number(values.vendor_id) === 0) {
      newErrors.vendor_id = "Please select a vendor from the dropdown";
    }
    if (!values.action_owner || Number(values.action_owner) === 0) {
      newErrors.action_owner =
        "Please select an action owner from the dropdown";
    }
    if (!values.impact || Number(values.impact) === 0) {
      newErrors.impact = "Please select an impact status from the dropdown";
    }
    if (!values.risk_severity || Number(values.risk_severity) === 0) {
      newErrors.risk_severity =
        "Please select a risk severity from the dropdown";
    }
    if (!values.likelihood || Number(values.likelihood) === 0) {
      newErrors.likelihood =
        "Please select a risk likelihood from the dropdown";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles the final save operation after confirmation
   * Creates new vendor or updates existing one
   */

  const handleOnSave = async () => {
    const risk_risklevel = getRiskLevel(
      values.likelihood * values.risk_severity
    );
    const _riskDetails = {
      risk_description: values.risk_description,
      impact_description: values.impact_description,
      impact:
        IMPACT_OPTIONS.find((r) => r._id === Number(values.impact))?.name || "",
      action_owner: formattedUsers?.find(
        (user) => user._id === values.action_owner
      )?._id,
      action_plan: values.action_plan,
      risk_severity:
      riskSeverityItems.find((r) => r._id === values.risk_severity)
          ?.name || "",
      risk_level: risk_risklevel.text,
      likelihood:
        LIKELIHOOD_OPTIONS.find((r) => r._id === values.likelihood)?.name || "",
      vendor_id: values.vendor_id,
    };
    if (existingRisk) {
      await updateRisk(existingRisk.id!, _riskDetails);
    } else {
      await createRisk(_riskDetails);
    }
  };

  /**
   * Creates a new vendor in the system
   * @param riskDetails - The vendor details to create
   */

  const createRisk = async (riskDetails: object) => {
    setIsSubmitting(true);
    try {
      const response = await createNewUser({
        routeUrl: "/vendorRisks",
        body: riskDetails,
      });

      if (response.status === 201) {
        setAlert({
          variant: "success",
          body: "Vendor-Risk created successfully",
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
        user: getUserForLogging(user),
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
   * @param riskId - The ID of the vendor to update
   * @param updatedriskDetails - The new vendor details
   */

  const updateRisk = async (riskId: number, updatedRiskDetails: object) => {
    setIsSubmitting(true);
    try {
      const response = await updateEntityById({
        routeUrl: `/vendorRisks/${riskId}`,
        body: updatedRiskDetails,
      });

      if (response.status === 202) {
        setAlert({
          variant: "success",
          body: "Vendor-Risk updated successfully",
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
        user: getUserForLogging(user),
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

  const risksPanel = (
    <TabPanel value="2" sx={{ paddingTop: theme.spacing(15), paddingX: 0 }}>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(8)}
      >
        <Select
          items={VENDOR_OPTIONS}
          label="Vendor"
          placeholder="Select vendor"
          isHidden={false}
          id=""
          onChange={(e) => handleOnChange("vendor_id", e.target.value)}
          value={values.vendor_id}
          error={errors.vendor_id}
          sx={{
            width: 350,
          }}
          isRequired
        />
        <Field
          label="Risk description"
          width={350}
          value={values.risk_description}
          onChange={(e) => handleOnChange("risk_description", e.target.value)}
          error={errors.risk_description}
          isRequired
        />
      </Stack>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(8)}
      >
        <Select
          items={IMPACT_OPTIONS}
          label="Impact"
          placeholder="Select impact"
          isHidden={false}
          id=""
          onChange={(e) => handleOnChange("impact", e.target.value)}
          value={values.impact}
          error={errors.impact}
          sx={{
            width: 350,
          }}
          isRequired
        />
        <Select
          items={likelihoodItems}
          label="Likelihood"
          placeholder="Select likelihood"
          isHidden={false}
          id=""
          onChange={(e) => handleOnChange("likelihood", e.target.value)}
          value={values.likelihood}
          error={errors.likelihood}
          sx={{
            width: 350,
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
        <Box
          justifyContent={"space-between"}
          display={"grid"}
          gap={theme.spacing(8)}
        >
          <Select
            items={riskSeverityItems}
            label="Risk severity"
            placeholder="Select risk severity"
            isHidden={false}
            id=""
            onChange={(e) => handleOnChange("risk_severity", e.target.value)}
            value={values.risk_severity}
            error={errors.risk_severity}
            sx={{
              width: 350,
            }}
            isRequired
          />

          <Select
            items={formattedUsers}
            label="Action owner"
            placeholder="Select owner"
            isHidden={false}
            id=""
            onChange={(e) => handleOnChange("action_owner", e.target.value)}
            value={values.action_owner}
            error={errors.action_owner}
            sx={{
              width: 350,
            }}
            isRequired
          />
          <Field
            label="Impact description"
            width={350}
            value={values.impact_description}
            onChange={(e) =>
              handleOnChange("impact_description", e.target.value)
            }
            error={errors.impact_description}
            isRequired
          />
        </Box>

        <Field
          label="Action plan"
          width={350}
          type="description"
          value={values.action_plan}
          error={errors.action_plan}
          onChange={(e) => handleOnChange("action_plan", e.target.value)}
          isRequired
        />
      </Stack>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        marginBottom={theme.spacing(8)}
      ></Stack>
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
              {existingRisk ? "Edit risk" : "Add new risk"}
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

export default AddNewRisk;
