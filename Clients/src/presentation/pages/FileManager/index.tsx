import React, { useState, useEffect } from "react";
import { Stack, Box, Typography,useTheme } from "@mui/material";
import { getEntityById } from "../../../application/repository/entity.repository";
import EmptyTableImage from "../../assets/imgs/empty-state.svg";
import PageTour from "../../components/PageTour";
import CustomStep from "../../components/PageTour/CustomStep";
import VWSkeleton from "../../vw-v2-components/Skeletons";
import { vwhomeHeading } from "../Home/1.0Home/style";
import { useFetchFiles } from "../../../application/hooks/useFetchFiles";
import FileTable from "./components/FileTable";


const COLUMN_NAMES = ["File", "Upload Date", "Uploader"];

/**
 * Main component for managing files, displaying a table,
 * sorting, and handling actions (Download/Remove).
 * @returns {JSX.Element} The FileManager component.
 */
const FileManager: React.FC = (): JSX.Element => {
  const theme = useTheme();
  const [runFileTour, setRunFileTour] = useState(false);
  const projectID = "1"; //need to replace with actual project ID
  const { filesData, loading } = useFetchFiles(projectID);
  
  const fileSteps = [
    {
      target: '[data-joyride-id="file-manager-title"]',
      content: (
        <CustomStep body="This table lists all the files uploaded to the system." />
      ),
      placement: "left" as const,
    },
  ];

  useEffect(() => {
    setRunFileTour(true);
  }, []);

  const cols = COLUMN_NAMES.map((name, index) => ({
    id: index + 1,
    name,
    sx: { width: "50%" },
  }));

  /**
   * Handles row selection in the file table.
   * Fetches the file details when a row is clicked.
   * @param {string} fileId - The unique identifier of the selected file.
   */
  const handleRowClick = async (fileId: string) => {
    try {
      await getEntityById({ routeUrl: `/files/${fileId}` });
    } catch (error) {
      console.error("Error fetching file details", error);
    }
  };

  return (
    <Stack className="vwhome">
      <PageTour
        steps={fileSteps}
        run={runFileTour}
        onFinish={() => setRunFileTour(false)}
      />
      <Stack className="vwhome-header"  data-joyride-id="file-manager-title">
        <Typography sx={vwhomeHeading}>
          Evidences & documents
        </Typography>
        <Typography sx={{color:theme.palette.text.secondary,
          fontSize:theme.typography.fontSize
        }}>
          This table lists all the files uploaded to the system.
        </Typography>
      </Stack>

      {loading ? (
        <VWSkeleton
          variant="rectangular"
          width="100%"
          height="300px"
          minWidth={"100%"}
          minHeight={300}
          sx={{ borderRadius: 2 }}
        />
      ) :(
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            width: "100%",
            justifyContent: filesData.length === 0 ? "center" : "flex-start",
            alignItems: filesData.length === 0 ? "center" : "stretch",
            position: "relative",
            borderRadius: "4px",
            overflow: "hidden",
            maxHeight: "400px",
            pointerEvents: loading ? "none" : "auto",
            opacity: loading ? 0.5 : 1,
            transition: "opacity 0.3s ease-in-out",
            // borderBottom: files.length === 0 ? "1px solid #eeeeee" : "none",
          }}
        >
          <FileTable
            cols={cols}
            files={filesData}
            onRowClick={handleRowClick}
          />
        </Box>
)}
    </Stack>
  );
};

export default FileManager;
