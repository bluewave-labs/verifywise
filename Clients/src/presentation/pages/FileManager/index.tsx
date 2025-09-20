import React, { useState, useEffect, useMemo } from "react";
import { Stack, Box, Typography } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageTour from "../../components/PageTour";
import useMultipleOnScreen from "../../../application/hooks/useMultipleOnScreen";
import FileSteps from "./FileSteps";
import CustomizableSkeleton from "../../components/Skeletons";
import { useUserFilesMetaData } from "../../../application/hooks/useUserFilesMetaData";
import { useProjects } from "../../../application/hooks/useProjects";
import FileTable from "../../components/Table/FileTable/FileTable";
import { filesTableFrame, filesTablePlaceholder } from "./styles";
import ProjectFilterDropdown from "../../components/Inputs/Dropdowns/ProjectFilter/ProjectFilterDropdown";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import evidencesHelpContent from "../../../presentation/helpers/evidences-help.html?raw";
import { Project } from "../../../domain/types/Project";
import PageHeader from "../../components/Layout/PageHeader";

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
  const [runFileTour, setRunFileTour] = useState(false);
  const { allVisible } = useMultipleOnScreen<HTMLDivElement>({
    countToTrigger: 1,
  });
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  // Fetch projects for the dropdown
  const { data: projects = [], isLoading: loadingProjects } = useProjects();

  // State for selected project
  const [selectedProject, setSelectedProject] = useState<
    string | number | null
  >("all");

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
      <PageBreadcrumbs />
      <PageTour
        steps={FileSteps}
        run={runFileTour}
        onFinish={() => {
          localStorage.setItem("file-tour", "true");
          setRunFileTour(false);
        }}
        tourKey="file-tour"
      />
      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent={evidencesHelpContent}
        pageTitle="Evidences & Documents"
      />
      <FileManagerHeader
        onHelperClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
      />
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
            projects={projects.map((project: Project) => ({
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
interface FileManagerHeaderProps {
  onHelperClick?: () => void;
}

const FileManagerHeader: React.FC<FileManagerHeaderProps> = ({
  onHelperClick,
}) => (
  <PageHeader
    title="Evidences & documents"
    description="This table lists all the files uploaded to the system."
    rightContent={
      onHelperClick && <HelperIcon onClick={onHelperClick} size="small" />
    }
  />
);

export default FileManager;
