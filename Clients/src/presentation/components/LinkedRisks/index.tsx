import { Stack } from "@mui/material";
import React, { useState, useEffect } from "react";
import Field from "../Inputs/Field";
import useProjectRisks from "../../../application/hooks/useProjectRisks";
import { getAllProjectRisks } from "../../../application/repository/projectRisk.repository";
import LinkedRisksTable from "../Table/LinkedRisksTable";
import { useSearchParams } from "react-router-dom";
import StandardModal from "../Modals/StandardModal";

import { textfieldStyle } from "./styles";
import { LinkedRisksModalProps } from "../../types/interfaces/i.table";

const LinkedRisksPopup: React.FC<LinkedRisksModalProps> = ({
  onClose,
  currentRisks,
  setSelectecRisks,
  _setDeletedRisks,
  projectId: propProjectId,
  frameworkId,
  isOrganizational = false,
}) => {
  const [searchParams] = useSearchParams();
  const pId = searchParams.get("projectId");
  const projectId = propProjectId || parseInt(pId ?? "0");

  // State for framework-based risks (used for organizational frameworks, EU AI Act, or when projectId is invalid)
  const [frameworkRisks, setFrameworkRisks] = useState<any[]>([]);

  // Use project-based risks hook (only when projectId is valid, not organizational, and not EU AI Act)
  // EU AI Act (frameworkId = 1) uses frameworkId instead of projectId
  const shouldUseProjectRisks =
    !isOrganizational && projectId > 0 && frameworkId !== 1;
  const { projectRisks } = useProjectRisks({
    projectId: shouldUseProjectRisks ? projectId : 0,
  });

  // Fetch risks based on the scenario:
  // 1. Organizational frameworks: fetch ALL risks (so users can link any risk to subcategories)
  // 2. EU AI Act (frameworkId = 1): fetch risks by frameworkId
  // 3. Invalid projectId: fetch all risks as fallback
  useEffect(() => {
    if (isOrganizational) {
      // For organizational frameworks, fetch ALL risks
      const fetchAllRisks = async () => {
        try {
          const response = await getAllProjectRisks({ filter: "active" });
          setFrameworkRisks(response.data || []);
        } catch (error) {
          console.error("Error fetching all risks:", error);
          setFrameworkRisks([]);
        }
      };
      fetchAllRisks();
    } else if (frameworkId === 1) {
      // For EU AI Act, fetch ALL risks (not just those already linked to framework)
      // The framework association will be created when the risk is linked to the subcategory
      const fetchAllRisks = async () => {
        try {
          const response = await getAllProjectRisks({ filter: "active" });
          setFrameworkRisks(response.data || []);
        } catch (error) {
          console.error("Error fetching all risks for EU AI Act:", error);
          setFrameworkRisks([]);
        }
      };
      fetchAllRisks();
    } else if (projectId === 0) {
      // Fallback: if projectId is 0, fetch all risks
      const fetchAllRisks = async () => {
        try {
          const response = await getAllProjectRisks({ filter: "active" });
          setFrameworkRisks(response.data || []);
        } catch (error) {
          console.error("Error fetching all risks:", error);
          setFrameworkRisks([]);
        }
      };
      fetchAllRisks();
    } else {
      // Reset frameworkRisks when using project-based risks
      setFrameworkRisks([]);
    }
  }, [isOrganizational, frameworkId, projectId]);

  // Determine which risks to use
  // If organizational, EU AI Act (frameworkId=1), OR projectId is 0/invalid, use frameworkRisks
  // Otherwise, use projectRisks (project-specific risks)
  const risks =
    isOrganizational || frameworkId === 1 || projectId === 0
      ? frameworkRisks
      : projectRisks;
  const [searchInput, setSearchInput] = useState<string>("");
  const [checkedRows, setCheckedRows] = useState<number[]>(currentRisks);
  const [deletedRisks, setDeletedRisks] = useState<number[]>([]);

  const handleFormSubmit = () => {
    setSelectecRisks(checkedRows.filter((r) => !currentRisks.includes(r)));
    _setDeletedRisks(deletedRisks);
    onClose();
  };

  const handleOnTextFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchInput(event.target.value);
  };

  const filteredRisks = risks.filter((risk) =>
    risk.risk_name.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <StandardModal
      isOpen={true}
      onClose={onClose}
      title="Link a risk from risk database"
      description="Search from the risk database:"
      onSubmit={handleFormSubmit}
      submitButtonText="Use selected risks"
      maxWidth="1500px"
    >
      <Stack spacing={6}>
        <Field
          id="risk-input"
          width="350px"
          sx={textfieldStyle}
          value={searchInput}
          onChange={handleOnTextFieldChange}
          disabled={risks.length === 0}
        />
        <LinkedRisksTable
          projectRisksGroup={risks}
          filteredRisksGroup={filteredRisks}
          currentRisks={currentRisks}
          checkedRows={checkedRows}
          setCheckedRows={setCheckedRows}
          deletedRisks={deletedRisks}
          setDeletedRisks={setDeletedRisks}
        />
      </Stack>
    </StandardModal>
  );
};

export default LinkedRisksPopup;
