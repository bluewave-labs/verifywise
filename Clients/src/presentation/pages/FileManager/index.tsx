import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  forwardRef,
} from "react";
import { Stack, Box, Typography, useTheme, Theme } from "@mui/material";
import { getEntityById } from "../../../application/repository/entity.repository";
import PageTour from "../../components/PageTour";
import useMultipleOnScreen from "../../../application/hooks/useMultipleOnScreen";
import FileSteps from "./FileSteps";
import VWSkeleton from "../../vw-v2-components/Skeletons";
import { vwhomeHeading } from "../Home/1.0Home/style";
import { useFetchFiles } from "../../../application/hooks/useFetchFiles";
import FileTable from "../../components/Table/FileTable/FileTable";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import { filesTableFrame, filesTablePlaceholder } from "./styles";

const COLUMN_NAMES = ["File", "Upload Date", "Uploader"];

interface Column {
  id: number;
  name: string;
  sx: { width: string };
}

const COLUMNS: Column[] = COLUMN_NAMES.map((name, index) => ({
  id: index + 1,
  name,
  sx: {
    minWidth: "fit-content",
    width: "fit-content",
    maxWidth: "50%",
  },
}));

/**
 * Main component for managing files, displaying a table,
 * sorting, and handling actions (Download/Remove).
 * @returns {JSX.Element} The FileManager component.
 */
const FileManager: React.FC = (): JSX.Element => {
  const { dashboardValues } = useContext(VerifyWiseContext);
  const theme = useTheme();
  const [runFileTour, setRunFileTour] = useState(false);
  const { refs, allVisible } = useMultipleOnScreen<HTMLDivElement>({
    countToTrigger: 1,
  });

  const { selectedProjectId } = dashboardValues;
  const projectID = selectedProjectId?.toString();
  const { filesData, loading } = useFetchFiles(projectID);
  const [error, setError] = useState<string | null>(null);

  const handleRowClick = useCallback(async (fileId: string) => {
    try {
      await getEntityById({ routeUrl: `/files/${fileId}` });
    } catch (error) {
      console.error("Error fetching file details", error);
      setError("Failed to fetch file details");
    }
  }, []);

  const boxStyles = useMemo(
    () => ({
      ...filesTableFrame,
      alignItems: filesData.length === 0 ? "center" : "stretch",
      pointerEvents: loading ? "none" : "auto",
      opacity: loading ? 0.5 : 1,
    }),
    [filesData.length, loading]
  );

  useEffect(() => {
    if (allVisible) {
      setRunFileTour(true);
    }
  }, [allVisible]);

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Stack className="vwhome" gap={"20px"}>
      <PageTour
        steps={FileSteps}
        run={runFileTour}
        onFinish={() => {
          localStorage.setItem("file-tour", "true");
          setRunFileTour(false);
        }}
        tourKey="file-tour"
      />
      <FileManagerHeader theme={theme} ref={refs[0]} />
      {loading ? (
        <VWSkeleton variant="rectangular" sx={filesTablePlaceholder} />
      ) : (
        <Box sx={boxStyles}>
          <FileTable
            cols={COLUMNS}
            files={filesData}
            onRowClick={handleRowClick}
          />
        </Box>
      )}
    </Stack>
  );
};

/**
 * Header component for the FileManager.
 * Uses React.forwardRef to handle the ref passed from the parent component.
 */
const FileManagerHeader = forwardRef<HTMLDivElement, { theme: Theme }>(
  ({ theme }, ref) => (
    <Stack
      className="vwhome-header"
      ref={ref}
      data-joyride-id="file-manager-title"
    >
      <Typography sx={vwhomeHeading}>Evidences & documents</Typography>
      <Typography
        sx={{
          color: theme.palette.text.secondary,
          fontSize: theme.typography.fontSize,
        }}
      >
        This table lists all the files uploaded to the system.
      </Typography>
    </Stack>
  )
);

export default FileManager;
