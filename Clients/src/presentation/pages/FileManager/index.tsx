import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Stack, Box, Typography } from "@mui/material";
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
import HelperIcon from "../../components/HelperIcon";
import { Project } from "../../../domain/types/Project";
import { FileModel } from "../../../domain/models/Common/File/file.model";
import PageHeader from "../../components/Layout/PageHeader";
import CustomizableButton from "../../components/Button/CustomizableButton";
import FileManagerUploadModal from "../../components/Modals/FileManagerUpload";
import { secureLogError } from "../../../application/utils/secureLogger.utils"; // SECURITY: No PII
import { useAuth } from "../../../application/hooks/useAuth"; // RBAC
import TipBox from "../../components/TipBox";
import { SearchBox } from "../../components/Search";
import { GroupBy } from "../../components/Table/GroupBy";
import { useTableGrouping, useGroupByState } from "../../../application/hooks/useTableGrouping";
import { GroupedTableView } from "../../components/Table/GroupedTableView";
import { FilterBy, FilterColumn } from "../../components/Table/FilterBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";

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
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [runFileTour, setRunFileTour] = useState(false);
  const { allVisible } = useMultipleOnScreen<HTMLDivElement>({
    countToTrigger: 1,
  });

  // Fetch projects for the dropdown options
  const { data: projects = [], isLoading: loadingProjects } = useProjects();

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

  // GroupBy state
  const { groupBy, groupSortOrder, handleGroupChange } = useGroupByState();

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

  // FilterBy - Dynamic options generators
  const getUniqueProjects = useCallback(() => {
    const projectIds = new Set<string>();
    filesData.forEach((file) => {
      if (file.projectId) {
        projectIds.add(file.projectId.toString());
      }
    });
    return Array.from(projectIds)
      .map((projectId) => {
        const project = projects.find((p: Project) => p.id.toString() === projectId);
        return {
          value: projectId,
          label: project?.project_title || `Project ${projectId}`,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filesData, projects]);

  const getUniqueUploaders = useCallback(() => {
    const uploaders = new Set<string>();
    filesData.forEach((file) => {
      if (file.uploaderName || file.uploader) {
        uploaders.add(file.uploaderName || file.uploader || '');
      }
    });
    return Array.from(uploaders)
      .filter(Boolean)
      .sort()
      .map((uploader) => ({
        value: uploader,
        label: uploader,
      }));
  }, [filesData]);

  // FilterBy - Filter columns configuration
  const fileFilterColumns: FilterColumn[] = useMemo(() => [
    {
      id: 'fileName',
      label: 'File name',
      type: 'text' as const,
    },
    {
      id: 'projectId',
      label: 'Use case',
      type: 'select' as const,
      options: getUniqueProjects(),
    },
    {
      id: 'uploader',
      label: 'Uploader',
      type: 'select' as const,
      options: getUniqueUploaders(),
    },
    {
      id: 'uploadDate',
      label: 'Upload date',
      type: 'date' as const,
    },
  ], [getUniqueProjects, getUniqueUploaders]);

  // FilterBy - Field value getter
  const getFileFieldValue = useCallback(
    (item: FileModel, fieldId: string): string | number | Date | null | undefined => {
      switch (fieldId) {
        case 'fileName':
          return item.fileName;
        case 'projectId':
          return item.projectId?.toString();
        case 'uploader':
          return item.uploaderName || item.uploader;
        case 'uploadDate':
          return item.uploadDate;
        default:
          return null;
      }
    },
    []
  );

  // FilterBy - Initialize hook
  const { filterData: filterFileData, handleFilterChange: handleFileFilterChange } = useFilterBy<FileModel>(getFileFieldValue);

  // Filter files using FilterBy and search
  const filteredFiles = useMemo(() => {
    // First apply FilterBy conditions
    let result = filterFileData(filesData);

    // Apply search filter last
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter((file) =>
        file.fileName?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [filterFileData, filesData, searchTerm]);

  // Define how to get the group key for each file
  const getFileGroupKey = useCallback((file: FileModel, field: string): string => {
    switch (field) {
      case 'project':
        return file.projectTitle || 'No Project';
      case 'uploader':
        return file.uploaderName || file.uploader || 'Unknown';
      default:
        return 'Other';
    }
  }, []);

  // Apply grouping to filtered files
  const groupedFiles = useTableGrouping({
    data: filteredFiles,
    groupByField: groupBy,
    sortOrder: groupSortOrder,
    getGroupKey: getFileGroupKey,
  });

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
      <FileManagerHeader />
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
            <Box sx={{ display: "flex", gap: 2, flex: 1, alignItems: "center" }}>
              <FilterBy
                columns={fileFilterColumns}
                onFilterChange={handleFileFilterChange}
              />
              <GroupBy
                options={[
                  { id: 'project', label: 'Project' },
                  { id: 'uploader', label: 'Uploader' },
                ]}
                onGroupChange={handleGroupChange}
              />
              <SearchBox
                placeholder="Search files by name..."
                value={searchTerm}
                onChange={setSearchTerm}
                inputProps={{ "aria-label": "Search files" }}
                fullWidth={false}
              />
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
            <GroupedTableView
              groupedData={groupedFiles}
              ungroupedData={filteredFiles}
              renderTable={(data, options) => (
                <FileTable
                  cols={COLUMNS}
                  files={data}
                  onFileDeleted={handleFileDeleted}
                  hidePagination={options?.hidePagination}
                />
              )}
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
const FileManagerHeader: React.FC = () => (
  <PageHeader
    title="Evidence & documents"
    description="This table lists all the files uploaded to the system."
    rightContent={
      <HelperIcon articlePath="ai-governance/evidence-collection" size="small" />
    }
  />
);

export default FileManager;
