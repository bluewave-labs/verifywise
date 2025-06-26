import { Stack, Typography } from '@mui/material';
import { ClearIcon } from '@mui/x-date-pickers/icons';
import React from 'react'

interface LinkedRisksModalProps {
  onClose: () => void;
}

const LinkedRisksPopup: React.FC<LinkedRisksModalProps> = ({
  onClose
}) => {
  return (
    <Stack sx={{
      width: "100%",
      backgroundColor: "#FCFCFD",
      padding: 10,
      borderRadius: "4px",
      gap: 10,
      maxWidth: "960px",
    }}>
      <Stack sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        width: '100%'
      }}>
        <Typography sx={{ fontSize: 16, color: "#344054", fontWeight: "bold" }}>Link a risk from risk database</Typography>
        <ClearIcon
          sx={{ color: "#98A2B3", cursor: "pointer" }}
          onClick={onClose}
        />
      </Stack>
    </Stack>
  )
}

export default LinkedRisksPopup