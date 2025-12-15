import { Stack } from "@mui/material";
import React, { useState, useEffect } from "react";
import Field from "../Inputs/Field";
import useProjectRisks from "../../../application/hooks/useProjectRisks";
import { getAllOrganizationalRisks } from "../../../application/repository/projectRisk.repository";
import LinkedRisksTable from "../Table/LinkedRisksTable";
import { useSearchParams } from "react-router-dom";
import StandardModal from "../Modals/StandardModal";

import { textfieldStyle } from "./styles";
import { LinkedRisksModalProps } from "../../../domain/interfaces/i.table";

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

  // State for organizational risks (for NIST, ISO 42001, ISO 27001)
  const [organizationalRisks, setOrganizationalRisks] = useState<any[]>([]);
  const [loadingOrgRisks, setLoadingOrgRisks] = useState(false);

  // Use project-based risks hook (for EU AI Act)
  const { projectRisks } = useProjectRisks({ projectId });

  // Fetch organizational risks when needed (for organizational frameworks)
  useEffect(() => {
    if (isOrganizational) {
      const fetchOrganizationalRisks = async () => {
        setLoadingOrgRisks(true);
        try {
          const response = await getAllOrganizationalRisks({});
          setOrganizationalRisks(response.data || []);
        } catch (error) {
          console.error("Error fetching organizational risks:", error);
          setOrganizationalRisks([]);
        } finally {
          setLoadingOrgRisks(false);
        }
      };
      fetchOrganizationalRisks();
    }
  }, [isOrganizational]);

  // Determine which risks to use
  const risks = isOrganizational ? organizationalRisks : projectRisks;
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
