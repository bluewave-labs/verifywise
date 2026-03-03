import React, { useState, useEffect } from "react";
import { Stack, Typography } from "@mui/material";
import { styles } from "./styles";
import { IStatusProps } from "../../../../../domain/interfaces/i.status";

const AI_PHASES = [
  "Collecting data...",
  "Generating AI analysis...",
  "Building document...",
];

const DownloadReportForm: React.FC<IStatusProps> = ({
  statusCode,
  aiEnhanced = false,
}) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!aiEnhanced || statusCode !== 200) return;

    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setPhase(1), 3000));
    timers.push(setTimeout(() => setPhase(2), 8000));

    return () => timers.forEach(clearTimeout);
  }, [aiEnhanced, statusCode]);

  return (
    <>
      {statusCode === 200 ? (
        <Stack sx={styles.container}>
          {aiEnhanced ? (
            <>
              <Typography sx={styles.titleText}>
                {AI_PHASES[phase]}
              </Typography>
              <Typography sx={styles.baseText}>
                AI-enhanced reports take a bit longer.
                <br />
                Your report will download automatically when ready.
              </Typography>
            </>
          ) : (
            <>
              <Typography sx={styles.titleText}>
                Preparing your report...
              </Typography>
              <Typography sx={styles.baseText}>
                Your report is being generated and will download automatically.
                <br /> Hang tight!
              </Typography>
            </>
          )}
        </Stack>
      ) : (
        <>
          {statusCode === 403 ? (
            <Stack sx={styles.container}>
              <Typography sx={{ ...styles.titleText, color: "error.main" }}>
                Access denied...
              </Typography>
              <Typography sx={{ ...styles.baseText, color: "error.main" }}>
                It looks like you're not authorized to generate this report, as
                you're not part of the selected project.
              </Typography>
            </Stack>
          ) : (
            <Stack sx={styles.container}>
              <Typography sx={{ ...styles.titleText, color: "error.main" }}>
                Sorry...
              </Typography>
              <Typography sx={{ ...styles.baseText, color: "error.main" }}>
                Unexpected error occurs while downloading the report.
              </Typography>
            </Stack>
          )}
        </>
      )}
    </>
  );
};

export default DownloadReportForm;
