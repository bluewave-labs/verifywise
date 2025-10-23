import React, { useState, useEffect, useMemo } from "react";
import { Stack, Box, Typography, Button, Tooltip } from "@mui/material";
import { Info as InfoIcon } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageTour from "../../components/PageTour";
import useMultipleOnScreen from "../../../application/hooks/useMultipleOnScreen";
import FileSteps from "./FileSteps";
import CustomizableSkeleton from "../../components/Skeletons";
import { useUserFilesMetaData } from "../../../application/hooks/useUserFilesMetaData";
import { useProjects } from "../../../application/hooks/useProjects";
import FileTable from "../../components/Table/FileTable/FileTable";
import { filesTableFrame, filesTablePlaceholder } from "./styles";
import Select from "../../components/Inputs/Select";
import HelperDrawer from "../../components/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
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

  // Handle upload button click
  const handleUploadClick = () => {
    // TODO: Implement file upload dialog/modal
    console.log("Upload new file clicked");
  };

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
    <Stack className="vwhome" gap={"16px"}>
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
        open={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(false)}
        title="Evidence & documents"
        description="Centralize compliance documentation and audit evidence management"
        whatItDoes="Store and organize all *governance documentation*, *audit evidence*, and *compliance artifacts*. View file details, filter by project, and download individual files."
        whyItMatters="**Evidence management** is critical for demonstrating *compliance* during *audits* and *regulatory reviews*. It provides a centralized view of all uploaded documents and their sources."
        quickActions={[
          {
            label: "Filter by Project",
            description: "Use the project dropdown to view files from specific use cases",
            primary: true
          },
          {
            label: "Download Files",
            description: "Download individual files directly from the table"
          }
        ]}
        useCases={[
          "View all files uploaded through *framework evidence uploads* and *compliance activities*",
          "Track which files belong to specific *projects and frameworks*"
        ]}
        keyFeatures={[
          "**Centralized file listing** showing all uploaded evidence and documents",
          "*Project filtering* to view files from specific use cases",
          "*Source navigation* to jump directly to the framework section where files were uploaded"
        ]}
        tips={[
          "Use the *project filter* to focus on files from specific use cases",
          "Click on the *source* to navigate to where the file was originally uploaded",
          "Files shown here are uploaded through various *framework and compliance sections*"
        ]}
      />
      <FileManagerHeader
        onHelperClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        onUploadClick={handleUploadClick}
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
        <Stack gap={"16px"}>
          <Box sx={{ display: "flex", justifyContent: "flex-start", width: "100%" }}>
            <Select
              id="project-filter"
              value={selectedProject || "all"}
              items={[
                { _id: "all", name: "All use cases" },
                ...projects.map((project: Project) => ({
                  _id: project.id.toString(),
                  name: project.project_title,
                }))
              ]}
              onChange={(e) => setSelectedProject(e.target.value)}
              sx={{
                width: "fit-content",
                minWidth: "200px",
                height: "34px",
                bgcolor: "#fff",
              }}
            />
          </Box>
          <Box sx={boxStyles}>
            <FileTable cols={COLUMNS} files={filteredFiles} />
          </Box>
        </Stack>
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
  onUploadClick?: () => void;
}

const FileManagerHeader: React.FC<FileManagerHeaderProps> = ({
  onHelperClick,
  onUploadClick,
}) => (
  <PageHeader
    title="Evidences & documents"
    description="This table lists all the files uploaded to the system."
    rightContent={
      <Stack direction="row" spacing={2} alignItems="center">
        <Button
          variant="contained"
          onClick={onUploadClick}
          sx={{
            backgroundColor: "#FF4081",
            color: "#fff",
            textTransform: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            fontWeight: 500,
            fontSize: "14px",
            "&:hover": {
              backgroundColor: "#E91E63",
            },
          }}
        >
          Upload new file
        </Button>
        {onHelperClick && <HelperIcon onClick={onHelperClick} size="small" />}
      </Stack>
    }
  />
);

export default FileManager;
