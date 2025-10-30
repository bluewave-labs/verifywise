import { Stack, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import Field from "../Inputs/Field";
import useProjectRisks from "../../../application/hooks/useProjectRisks";
import { getAllRisksByFrameworkId } from "../../../application/repository/projectRisk.repository";
import LinkedRisksTable from "../Table/LinkedRisksTable";
import { useSearchParams } from "react-router-dom";
import StandardModal from "../Modals/StandardModal";

import { textfieldStyle } from "./styles";

interface LinkedRisksModalProps {
  onClose: () => void;
  currentRisks: number[];
  setSelectecRisks: (selectedRisks: number[]) => void;
  _setDeletedRisks: (deletedRisks: number[]) => void;
  projectId?: number; // Optional project ID to override URL search params
  frameworkId?: number; // Optional framework ID for organizational projects
  isOrganizational?: boolean; // Flag to determine which endpoint to use
}

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

  // State for framework-based risks
  const [frameworkRisks, setFrameworkRisks] = useState<any[]>([]);

  // Use project-based risks hook
  const { projectRisks } = useProjectRisks({ projectId });

  // Fetch framework-based risks when needed
  useEffect(() => {
    if (isOrganizational && frameworkId) {
      const fetchFrameworkRisks = async () => {
        try {
          const response = await getAllRisksByFrameworkId({ frameworkId });
          setFrameworkRisks(response.data || []);
        } catch (error) {
          console.error("Error fetching framework risks:", error);
          setFrameworkRisks([]);
        }
      };
      fetchFrameworkRisks();
    }
  }, [isOrganizational, frameworkId]);

  // Determine which risks to use
  const risks = isOrganizational ? frameworkRisks : projectRisks;
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
