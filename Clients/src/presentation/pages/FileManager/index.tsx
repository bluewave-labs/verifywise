import React, { useState, useEffect, useMemo, forwardRef } from "react";
import { Stack, Box, Typography, useTheme, Theme } from "@mui/material";
import PageTour from "../../components/PageTour";
import useMultipleOnScreen from "../../../application/hooks/useMultipleOnScreen";
import FileSteps from "./FileSteps";
import CustomizableSkeleton from "../../vw-v2-components/Skeletons";
import { vwhomeHeading } from "../Home/1.0Home/style";
import { useUserFilesMetaData } from "../../../application/hooks/useUserFilesMetaData";
import { useProjects } from "../../../application/hooks/useProjects";
import FileTable from "../../components/Table/FileTable/FileTable";
import { filesTableFrame, filesTablePlaceholder } from "./styles";
import ProjectFilterDropdown from "../../components/Inputs/Dropdowns/ProjectFilter/ProjectFilterDropdown";

const COLUMN_NAMES = [
  "File",
  "Project Name",
  "Upload Date",
  "Uploader",
  "Source",
  "Action",
];

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
  const theme = useTheme();
  const [runFileTour, setRunFileTour] = useState(false);
  const { refs, allVisible } = useMultipleOnScreen<HTMLDivElement>({
    countToTrigger: 1,
  });

  // Fetch projects for the dropdown
  const {
    projects,
    loading: loadingProjects,
  } = useProjects();

  // State for selected project
  const [selectedProject, setSelectedProject] = useState<string | number | null>("all");

  // Fetch files based on selected project
  const { filesData, loading: loadingFiles } = useUserFilesMetaData();
  const filteredFiles = useMemo(() => {
    if (selectedProject === "all" || selectedProject === null) {
      return filesData;
    }

    return filesData.filter((file) => file.projectId === selectedProject);
  }, [filesData, selectedProject]);

  const boxStyles = useMemo(
    () => ({
      ...filesTableFrame,
      alignItems: filteredFiles.length === 0 ? "center" : "stretch",
      pointerEvents: loadingFiles ? "none" : "auto",
      opacity: loadingFiles ? 0.5 : 1,
    }),
    [filteredFiles.length, loadingFiles]
  );

  useEffect(() => {
    if (allVisible) {
      setRunFileTour(true);
    }
  }, [allVisible]);

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
      {/* Project filter dropdown */}
      {loadingProjects || loadingFiles ? (
        <>
          <Typography>Loading projects...</Typography>
          <CustomizableSkeleton
            variant="rectangular"
            sx={filesTablePlaceholder}
          />
        </>
      ) : (
        <>
          <ProjectFilterDropdown
            projects={projects.map((project) => ({
              id: project.id.toString(),
              name: project.project_title,
            }))}
            selectedProject={selectedProject}
            onChange={setSelectedProject}
          />
          <Box sx={boxStyles}>
            <FileTable cols={COLUMNS} files={filteredFiles} />
          </Box>
        </>
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
