import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  useRef
} from "react";
import { Stack, Box, Typography, useTheme, Theme } from "@mui/material";
import { getEntityById } from "../../../application/repository/entity.repository";
import PageTour from "../../components/PageTour";
import CustomStep from "../../components/PageTour/CustomStep";
import VWSkeleton from "../../vw-v2-components/Skeletons";
import { vwhomeHeading } from "../Home/1.0Home/style";
import { useFetchFiles } from "../../../application/hooks/useFetchFiles";
import FileTable from "../../components/Table/FileTable/FileTable";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import { filesTableFrame, filesTablePlaceholder } from "./styles";

const COLUMN_NAMES = ["File", "Upload Date", "Uploader"];

interface FileStep {
  target: string;
  content: JSX.Element;
  placement: "left" | "right" | "top" | "bottom";
}

interface Column {
  id: number;
  name: string;
  sx: { width: string };
}

const FILE_STEPS: FileStep[] = [
  {
    target: '[data-joyride-id="file-manager-title"]',
    content: (
      <CustomStep body="This table lists all the files uploaded to the system." />
    ),
    placement: "left",
  },
];

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
  const titleRef = useRef<HTMLDivElement | null>(null);

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
    const shouldRun = localStorage.getItem("file-tour") !== "true";
    if (!shouldRun) return; 

    if (titleRef.current){
      setRunFileTour(true);
    }
  }, [titleRef.current]);

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Stack className="vwhome" gap={"20px"}>
      <PageTour
        steps={FILE_STEPS}
        run={runFileTour}
        onFinish={() => {
          localStorage.setItem("file-tour", "true");
          setRunFileTour(false)}}
      />
      <FileManagerHeader theme={theme} titleRef={titleRef}/>
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

const FileManagerHeader: React.FC<{ theme: Theme,titleRef:React.RefObject<HTMLDivElement> }> = ({ theme, titleRef }) => (
  <Stack className="vwhome-header" ref={titleRef} data-joyride-id="file-manager-title">
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
);

export default FileManager;
