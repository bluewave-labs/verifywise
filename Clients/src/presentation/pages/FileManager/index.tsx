import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Stack, Box, Typography, SelectChangeEvent, useTheme } from "@mui/material";
import { Upload as UploadIcon } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageTour from "../../components/PageTour";
import useMultipleOnScreen from "../../../application/hooks/useMultipleOnScreen";
import FileSteps from "./FileSteps";
import CustomizableSkeleton from "../../components/Skeletons";
import { useUserFilesMetaData } from "../../../application/hooks/useUserFilesMetaData";
import { useProjects } from "../../../application/hooks/useProjects";
import FileTable from "../../components/Table/FileTable/FileTable";
import { getUserFilesMetaData } from "../../../application/repository/file.repository";
import { transformFilesData } from "../../../application/utils/fileTransform.utils";
import { filesTableFrame, filesTablePlaceholder } from "./styles";
import Select from "../../components/Inputs/Select";
import HelperDrawer from "../../components/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import { Project } from "../../../domain/types/Project";
import { FileModel } from "../../../domain/models/Common/file/file.model";
import PageHeader from "../../components/Layout/PageHeader";
import CustomizableButton from "../../components/Button/CustomizableButton";
import FileManagerUploadModal from "../../components/Modals/FileManagerUpload";
import { secureLogError } from "../../../application/utils/secureLogger.utils"; // SECURITY: No PII
import { useAuth } from "../../../application/hooks/useAuth"; // RBAC
import TipBox from "../../components/TipBox";
import { SearchBox } from "../../components/Search";

// Constants (DRY + Maintainability)
const FILE_MANAGER_CONTEXT = "FileManager";
const AUDITOR_ROLE = "Auditor"; // Role that cannot upload files

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
  const [searchTerm, setSearchTerm] = useState<string>("");
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

  // Use hook for initial data load (keeps hook unchanged as requested)
  const { filesData: initialFilesData, loading: initialLoading } =
    useUserFilesMetaData();

  // Local state to manage files (allows manual refresh)
  const [filesData, setFilesData] = useState<FileModel[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(initialLoading);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Sync initial data from hook to local state (always sync, even if empty)
  useEffect(() => {
    setFilesData(initialFilesData);
    setLoadingFiles(initialLoading);
  }, [initialFilesData, initialLoading]);

  // RBAC: Get user role for permission checks
  const { userRoleName } = useAuth();

  // REQUIREMENT: "Upload allowed for all users except Auditors"
  // SECURITY: Default-deny - require authenticated role that is not Auditor
  // Note: Server-side must also enforce this to prevent authorization bypass via direct API calls
  const isUploadAllowed =
    Boolean(userRoleName) && userRoleName !== AUDITOR_ROLE;

  // Manual refetch function (KISS: direct repository call with shared transform utility - DRY)
  const refetch = useCallback(async () => {
    try {
      setLoadingFiles(true);
      const response = await getUserFilesMetaData();
      setFilesData(transformFilesData(response));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // SECURITY FIX: Use secure logger (no PII leak) instead of logEngine
      //  includes user ID/email/name which violates GDPR/compliance
      secureLogError("Error refetching files", FILE_MANAGER_CONTEXT);
      setFilesData([]);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  // Handle upload button click (Defensive: Check permissions)
  const handleUploadClick = useCallback(() => {
    // Defensive: Double-check permission before opening modal
    if (!isUploadAllowed) {
      console.warn(
        "[FileManager] Upload attempt by unauthorized role:",
        userRoleName,
      );
      return;
    }
    setIsUploadModalOpen(true);
  }, [isUploadAllowed, userRoleName]);

  // Handle upload success - refetch files
  const handleUploadSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle file deleted - refetch files
  const handleFileDeleted = useCallback(() => {
    refetch();
  }, [refetch]);

  const filteredFiles = useMemo(() => {
    let filtered = filesData;

    if (selectedProject !== "all" && selectedProject !== null) {
      filtered = filtered.filter((file) => file.projectId === selectedProject);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((file) =>
        file.fileName?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [filesData, selectedProject, searchTerm]);

  const boxStyles = useMemo(
    () => ({
      ...filesTableFrame,
      alignItems: filteredFiles.length === 0 ? "center" : "stretch",
      pointerEvents: loadingFiles ? "none" : "auto",
      opacity: loadingFiles ? 0.5 : 1,
    }),
    [filteredFiles.length, loadingFiles],
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
            description:
              "Use the project dropdown to view files from specific use cases",
            primary: true,
          },
          {
            label: "Download Files",
            description: "Download individual files directly from the table",
          },
        ]}
        useCases={[
          "View all files uploaded through *framework evidence uploads* and *compliance activities*",
          "Track which files belong to specific *projects and frameworks*",
        ]}
        keyFeatures={[
          "**Centralized file listing** showing all uploaded evidence and documents",
          "*Project filtering* to view files from specific use cases",
          "*Source navigation* to jump directly to the framework section where files were uploaded",
        ]}
        tips={[
          "Use the *project filter* to focus on files from specific use cases",
          "Click on the *source* to navigate to where the file was originally uploaded",
          "Files shown here are uploaded through various *framework and compliance sections*",
        ]}
      />
      <FileManagerHeader
        onHelperClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
      />
      <TipBox entityName="file-manager" />
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
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", gap: 2, flex: 1 }}>
              <Select
                id="project-filter"
                value={selectedProject || "all"}
                items={[
                  { _id: "all", name: "All use cases" },
                  ...projects.map((project: Project) => ({
                    _id: project.id.toString(),
                    name: project.project_title,
                  })),
                ]}
                onChange={(e: SelectChangeEvent<string | number>) =>
                  setSelectedProject(e.target.value)
                }
                sx={{
                  width: "fit-content",
                  minWidth: "200px",
                  height: "34px",
                  backgroundColor: selectedProject && selectedProject !== "all" ? theme.palette.background.fill : '#fff',
                }}
              />
              <Box sx={{ width: "300px" }}>
                <SearchBox
                  placeholder="Search files by name..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                  inputProps={{ "aria-label": "Search files" }}
                />
              </Box>
            </Box>
            {/* RBAC: Only show upload button for non-Auditors */}
            {isUploadAllowed && (
              <CustomizableButton
                variant="contained"
                text="Upload new file"
                sx={{
                  gap: 2,
                }}
                icon={<UploadIcon size={16} />}
                onClick={handleUploadClick}
              />
            )}
          </Box>
          <Box sx={boxStyles}>
            <FileTable
              cols={COLUMNS}
              files={filteredFiles}
              onFileDeleted={handleFileDeleted}
            />
          </Box>
        </Stack>
      )}
      {/* Upload Modal */}
      {isUploadModalOpen && (
        <FileManagerUploadModal
          open={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={handleUploadSuccess}
        />
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
    title="Evidence & documents"
    description="This table lists all the files uploaded to the system."
    rightContent={
      onHelperClick && <HelperIcon onClick={onHelperClick} size="small" />
    }
  />
);

export default FileManager;
