import React from "react";
import { Typography } from "@mui/material";
import { styles } from "../styles";

interface DisabledProps {
  isDisabled: boolean;
}

const ReportStatus: React.FC<DisabledProps> = ({ isDisabled }) => {
  return (
    <>
      {isDisabled && (
        <Typography sx={styles.baseText}>
          There is no report to download.
        </Typography>
      )}
    </>
  );
};

export default ReportStatus;
