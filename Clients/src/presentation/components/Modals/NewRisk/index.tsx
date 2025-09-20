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
  Box,
  Modal,
  Stack,
  Typography,
  useTheme,
  Divider,
} from "@mui/material";
import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";
import { ReactComponent as Close } from "../../../assets/icons/close.svg";
import { Suspense, useEffect, useState, lazy, useCallback } from "react";
import Alert from "../../Alert";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import useUsers from "../../../../application/hooks/useUsers";
import CustomizableToast from "../../Toast";
import { logEngine } from "../../../../application/tools/log.engine";
import CustomizableButton from "../../Button/CustomizableButton";
import SaveIcon from "@mui/icons-material/Save";
import { RiskCalculator } from "../../../tools/riskCalculator";
import { RiskLikelihood, RiskSeverity } from "../../RiskLevel/riskValues";
import allowedRoles from "../../../../application/constants/permissions";
import { SelectChangeEvent } from "@mui/material";
import {
  useCreateVendorRisk,
  useUpdateVendorRisk,
} from "../../../../application/hooks/useVendorRiskMutations";
import { useAuth } from "../../../../application/hooks/useAuth";
const RiskLevel = lazy(() => import("../../RiskLevel"));

interface ExistingRisk {
  id?: number;
  risk_description: string;
  impact_description: string;
  project_name?: string;
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
  vendors: any[];
}

const initialState = {
  risk_description: "",
  impact_description: "",
  action_owner: "",
  risk_severity: "1",
  likelihood: "1",
  risk_level: "",
  action_plan: "",
  vendor_id: "",
};

const RISK_LEVEL_OPTIONS = [
  { _id: "", name: "Select risk level" },
  { _id: 1, name: "Very high risk" },
  { _id: 2, name: "High risk" },
  { _id: 3, name: "Medium risk" },
  { _id: 4, name: "Low risk" },
  { _id: 5, name: "Very low risk" },
];

const LIKELIHOOD_OPTIONS = [
  { _id: "", name: "Select likelihood" },
  { _id: 1, name: RiskLikelihood.Rare },
  { _id: 2, name: RiskLikelihood.Unlikely },
  { _id: 3, name: RiskLikelihood.Possible },
  { _id: 4, name: RiskLikelihood.Likely },
  { _id: 5, name: RiskLikelihood.AlmostCertain },
] as const;

const RISK_SEVERITY_OPTIONS = [
  { _id: "", name: "Select severity" },
  { _id: 1, name: RiskSeverity.Negligible },
  { _id: 2, name: RiskSeverity.Minor },
  { _id: 3, name: RiskSeverity.Moderate },
  { _id: 4, name: RiskSeverity.Major },
  { _id: 5, name: RiskSeverity.Catastrophic },
] as const;

const AddNewRisk: React.FC<AddNewRiskProps> = ({
  isOpen,
  setIsOpen,
  value,
  existingRisk,
  onSuccess = () => {},
  vendors,
}) => {
  const theme = useTheme();
  const { userRoleName } = useAuth();
  const isEditingDisabled = !allowedRoles.vendors.edit.includes(userRoleName);
  const VENDOR_OPTIONS =
    vendors?.length > 0
      ? vendors.map((vendor: any) => ({
          _id: vendor.id,
          name: vendor.vendor_name,
        }))
      : [{ _id: "no-vendor", name: "No Vendor Exists" }];

  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({} as FormErrors);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const { users } = useUsers();
  const formattedUsers = users?.map((user) => ({
    _id: String(user.id),
    name: `${user.name} ${user.surname}`,
  }));

  // TanStack Query hooks
  const createVendorRiskMutation = useCreateVendorRisk();
  const updateVendorRiskMutation = useUpdateVendorRisk();
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
        action_owner: String(
          formattedUsers?.find(
            (user) => String(user._id) === String(existingRisk.action_owner)
          )?._id || ""
        ),
        risk_severity: Number(
          RISK_SEVERITY_OPTIONS.find(
            (r) => r.name === existingRisk.risk_severity
          )?._id ?? 1
        ).toString(),
        likelihood: Number(
          LIKELIHOOD_OPTIONS.find((r) => r.name === existingRisk.likelihood)
            ?._id ?? 1
        ).toString(),
        risk_level: String(
          RISK_LEVEL_OPTIONS.find((r) => r.name === existingRisk.risk_level)
            ?._id ?? ""
        ),
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
      256 // updated from 64
    );
    if (!risk_description.accepted) {
      newErrors.risk_description = risk_description.message;
    }
    const impact_description = checkStringValidation(
      "Impact description",
      values.impact_description,
      1,
      256 // updated from 64
    );
    if (!impact_description.accepted) {
      newErrors.impact_description = impact_description.message;
    }
    const action_plan = checkStringValidation(
      "Action plan",
      values.action_plan,
      1,
      256 // updated from 64
    );
    if (!action_plan.accepted) {
      newErrors.action_plan = action_plan.message;
    }
    if (!values.vendor_id || Number(values.vendor_id) === 0) {
      newErrors.vendor_id = "Please select a vendor from the dropdown";
    }
    if (!values.action_owner || values.action_owner === "") {
      newErrors.action_owner =
        "Please select an action owner from the dropdown";
    }
    if (!values.risk_severity || Number(values.risk_severity) < 1) {
      newErrors.risk_severity =
        "Please select a risk severity from the dropdown";
    }
    if (!values.likelihood || Number(values.likelihood) < 1) {
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
    const selectedLikelihood = LIKELIHOOD_OPTIONS.find(
      (r) => r._id === Number(values.likelihood)
    );
    const selectedSeverity = RISK_SEVERITY_OPTIONS.find(
      (r) => r._id === Number(values.risk_severity)
    );

    // Only call if both are valid (not the "Select ..." option)
    if (
      !selectedLikelihood ||
      !selectedSeverity ||
      selectedLikelihood._id === "" ||
      selectedSeverity._id === ""
    ) {
      console.error("Could not find selected likelihood or severity");
      return;
    }

    const risk_risklevel = RiskCalculator.getRiskLevel(
      selectedLikelihood.name as RiskLikelihood,
      selectedSeverity.name as RiskSeverity
    );
    const _riskDetails = {
      vendor_id: values.vendor_id,
      risk_description: values.risk_description,
      impact_description: values.impact_description,
      action_owner: formattedUsers?.find(
        (user) => String(user._id) === String(values.action_owner)
      )?._id,
      action_plan: values.action_plan,
      risk_severity: selectedSeverity.name,
      risk_level: risk_risklevel.level,
      likelihood: selectedLikelihood.name,
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
      const response = await createVendorRiskMutation.mutateAsync(riskDetails);

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
      const response = await updateVendorRiskMutation.mutateAsync({
        id: riskId,
        data: updatedRiskDetails,
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

  // Add this function to handle RiskLevel select changes, clearing errors as well
  const handleOnSelectChange = useCallback(
    (prop: "likelihood" | "riskSeverity") =>
      (event: SelectChangeEvent<string | number>) => {
        const key = prop === "riskSeverity" ? "risk_severity" : prop;
        setValues((prev) => ({
          ...prev,
          [key]: event.target.value,
        }));
        setErrors((prev) => ({ ...prev, [key]: "" }));
      },
    []
  );

  const risksPanel = (
    <TabPanel value="2" sx={{ paddingTop: theme.spacing(15), paddingX: 0 }}>
      <Stack direction="row" spacing={12}>
        <Stack flex={1} spacing={12}>
          <Stack direction="row" spacing={6}>
            <Box flex={1}>
              <Select
                items={VENDOR_OPTIONS}
                label="Vendor"
                placeholder="Select vendor"
                isHidden={false}
                id="vendor_id"
                onChange={(e) => handleOnChange("vendor_id", e.target.value)}
                value={values.vendor_id}
                error={errors.vendor_id}
                sx={{ width: "100%" }}
                isRequired
                disabled={isEditingDisabled}
              />
            </Box>
            <Box flex={1}>
              <Select
                items={formattedUsers}
                label="Action owner"
                placeholder="Select owner"
                isHidden={false}
                id="action_owner"
                onChange={(e) => handleOnChange("action_owner", e.target.value)}
                value={values.action_owner || ""}
                error={errors.action_owner}
                sx={{ width: "100%" }}
                isRequired
                disabled={isEditingDisabled}
              />
            </Box>
          </Stack>
          <Box>
            <Field
              label="Risk description"
              width="100%"
              value={values.risk_description}
              onChange={(e) =>
                handleOnChange("risk_description", e.target.value)
              }
              error={errors.risk_description}
              isRequired
              disabled={isEditingDisabled}
              type="description"
              rows={7}
              placeholder="Describe the specific risk related to this vendor (e.g., data breach, service outage, compliance gap)."
            />
          </Box>
        </Stack>
        <Stack flex={1} spacing={12}>
          <Box>
            <Field
              label="Action plan"
              width="100%"
              type="description"
              value={values.action_plan}
              error={errors.action_plan}
              onChange={(e) => handleOnChange("action_plan", e.target.value)}
              isRequired
              disabled={isEditingDisabled}
              rows={4}
              placeholder="Outline the steps or controls you will take to reduce or eliminate this risk."
            />
          </Box>
          <Box>
            <Field
              label="Impact description"
              width="100%"
              value={values.impact_description}
              onChange={(e) =>
                handleOnChange("impact_description", e.target.value)
              }
              error={errors.impact_description}
              isRequired
              disabled={isEditingDisabled}
              type="description"
              rows={4}
              placeholder="Explain the potential consequences if this risk occurs (e.g., financial, reputational, regulatory)."
            />
          </Box>
        </Stack>
      </Stack>
      <Divider sx={{ my: 6 }} />
      <Box mt={4} mb={2}>
        <Typography fontWeight={600} fontSize={16} mb={2}>
          Calculate risk level
        </Typography>
        <Typography fontSize={13} color="text.secondary" mb={4}>
          The Risk Level is calculated by multiplying the Likelihood and
          Severity scores. By assigning these scores, the risk level will be
          determined based on your inputs.
        </Typography>
        <Stack direction="row" spacing={12}>
          <Suspense fallback={<div>Loading...</div>}>
            <RiskLevel
              likelihood={Number(values.likelihood) || 1}
              riskSeverity={Number(values.risk_severity) || 1}
              handleOnSelectChange={handleOnSelectChange}
              disabled={isEditingDisabled}
            />
          </Suspense>
        </Stack>
      </Box>
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
            width: 1000,
            bgcolor: theme.palette.background.modal,
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
              {existingRisk ? "Edit risk" : "Add a new vendor risk"}
            </Typography>
            <Close style={{ cursor: "pointer" }} onClick={setIsOpen} />
          </Stack>
          {!existingRisk && (
            <Typography
              fontSize={13}
              color={theme.palette.text.secondary}
              marginBottom={theme.spacing(2)}
              sx={{ lineHeight: 1.4 }}
            >
              Document and assess a potential risk associated with your vendor. Provide details of the risk, its impact, and your mitigation plan.
            </Typography>
          )}
          <TabContext value={value}>
            {risksPanel}
            <Stack
              sx={{
                alignItems: "flex-end",
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
          </TabContext>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default AddNewRisk;
