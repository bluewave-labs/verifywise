import { Stack, Typography } from "@mui/material";
import CustomizableButton from "../Button/CustomizableButton";
import { AuditRiskTable } from "../Table/AuditRiskTable/AuditRiskTable";
import { useState } from "react";

interface AuditRiskModalProps {
  onClose: () => void;
  risks: number[];
  _deletedRisks: number[];
  _setDeletedRisks: (deletedRisks: number[]) => void;
  _selectedRisks: number[];
  _setSelectedRisks: (selectedRisks: number[]) => void;
}

export const AuditRiskPopup: React.FC<AuditRiskModalProps> = ({
  onClose,
  risks,
  _deletedRisks,
  _setDeletedRisks,
  _selectedRisks,
  _setSelectedRisks,
}) => {
  const [checkedRows, setCheckedRows] = useState<number[]>([]);

  const handleUnlinkRisk = () => {
    let newSelectedRisks = new Set(_selectedRisks);
    let newDeletedRisks = [..._deletedRisks];

    for (const riskId of checkedRows) {
      if (_selectedRisks.includes(riskId)) {
        newSelectedRisks.delete(riskId);
      } else {
        newDeletedRisks.push(riskId);
      }
      _setSelectedRisks([...newSelectedRisks]);
      _setDeletedRisks(newDeletedRisks);
    }
    onClose();
  };

  return (
    <Stack
      sx={{
        width: "100%",
        backgroundColor: "#FCFCFD",
        padding: 10,
        borderRadius: "4px",
        gap: 10,
        justifyContent: "space-between",
        minHeight: "300px",
      }}
    >
      <Stack>
        <Stack
          sx={{
            width: "100%",
            marginBottom: "20px",
          }}
        >
          <Typography
            sx={{
              fontSize: 16,
              color: "#344054",
              fontWeight: "bold",
            }}
          >
            Marked as done but linked risk detected
          </Typography>
        </Stack>
        <Stack
          sx={{
            width: "100%",
            marginBottom: "20px",
          }}
        >
          <Typography
            sx={{
              fontSize: "14px",
              color: "#475467",
            }}
          >
            This section has been been marked as done, but there's still a risk
            linked to it:
          </Typography>
        </Stack>
        <Stack
          sx={{
            width: "100%",
            marginBottom: "20px",
          }}
        >
          <AuditRiskTable
            risks={risks}
            deletedRisks={_deletedRisks}
            checkedRows={checkedRows}
            setCheckedRows={setCheckedRows}
          />
        </Stack>
        <Stack
          sx={{
            width: "100%",
          }}
        >
          <Typography
            sx={{
              fontSize: "14px",
              color: "#475467",
            }}
          >
            Marking it as done doesn't automatically resolve this risk. What
            would you like to do?
          </Typography>
        </Stack>
      </Stack>
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 2,
        }}
      >
        <CustomizableButton
          sx={{
            backgroundColor: "#13715B",
            color: "#fff",
            border: "1px solid #13715B",
          }}
          variant="contained"
          text="Keep risk as is"
          onClick={onClose}
        />
        <CustomizableButton
          sx={{
            backgroundColor: "#13715B",
            color: "#fff",
            border: "1px solid #13715B",
          }}
          variant="contained"
          text="Unlink risk"
          onClick={handleUnlinkRisk}
          isDisabled={checkedRows.length === 0}
        />
      </Stack>
    </Stack>
  );
};

export default AuditRiskPopup;
