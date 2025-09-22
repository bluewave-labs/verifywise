import { Button, Stack, Typography } from "@mui/material";
import { ClearIcon } from "@mui/x-date-pickers/icons";
import React, { useState, useEffect } from "react";
import Field from "../Inputs/Field";
import useProjectRisks from "../../../application/hooks/useProjectRisks";
import { getAllRisksByFrameworkId } from "../../../application/repository/projectRisk.repository";
import LinkedRisksTable from "../Table/LinkedRisksTable";
import { useSearchParams } from "react-router-dom";
import CustomizableButton from "../Button/CustomizableButton";

import { textfieldStyle, styles } from "./styles";

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
    <Stack sx={styles.container}>
      <Stack>
        <Stack sx={styles.headingSection}>
          <Typography sx={styles.textTitle}>
            Link a risk from risk database
          </Typography>
          <ClearIcon sx={styles.clearIconStyle} onClick={onClose} />
        </Stack>
        <Stack component="form" sx={styles.searchInputWrapper}>
          <Typography sx={{ fontSize: 13, color: "#344054", mr: 8 }}>
            Search from the risk database:
          </Typography>
          <Stack>
            <Field
              id="risk-input"
              width="350px"
              sx={textfieldStyle}
              value={searchInput}
              onChange={handleOnTextFieldChange}
              disabled={risks.length === 0}
            />
          </Stack>
        </Stack>
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
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        <Button sx={styles.cancelBtn} onClick={onClose}>
          Cancel
        </Button>
        <CustomizableButton
          sx={styles.CustomizableButton}
          variant="contained"
          text="Use selected risks"
          onClick={handleFormSubmit}
        />
      </Stack>
    </Stack>
  );
};

export default LinkedRisksPopup;
