import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Stack, Box, Typography,useTheme } from "@mui/material";
import VWBasicTable from "../../components/Table";
import { getEntityById } from "../../../application/repository/entity.repository";
import EmptyTableImage from "../../assets/imgs/empty-state.svg";
import AscendingIcon from "../../assets/icons/up-arrow.svg";
import DescendingIcon from "../../assets/icons/down-arrow.svg";
import PageTour from "../../components/PageTour";
import CustomStep from "../../components/PageTour/CustomStep";
import VWSkeleton from "../../vw-v2-components/Skeletons";
import { vwhomeHeading } from "../Home/1.0Home/style";
import { File } from "../../../domain/File";
import { useFetchFiles } from "../../../application/hooks/useFetchFiles";

/**
 * Represents the props of the FileTable component.
 * @typedef {Object} FileTableProps
 * @property {Array} cols - The columns of the table.
 * @property {Array} rows - The rows of the table.   
 * @property {Array<File>} files - The list of files.
 * @property {Function} handleSort - Callback to handle sorting.
 * @property {keyof File|null} sortField - The field currently sorted by.
 * @property {SortDirection|null} sortDirection - The current sort direction.
 * @property {Function} onRowClick - Callback to handle row selection.    
 */ 
interface FileTableProps {
  cols: any[];
  rows: any[];
  files: File[];
  handleSort: (field: keyof File) => void;
  sortField: keyof File | null;
  sortDirection: SortDirection | null;
  onRowClick: (fileId: string) => void;
}

const COLUMN_NAMES = ["File", "Upload Date", "Uploader"];

const SORT_DIRECTIONS = {
  ASC: "asc",
  DESC: "desc",
} as const;

type SortDirection = (typeof SORT_DIRECTIONS)[keyof typeof SORT_DIRECTIONS];

/**
 * Displays an empty state when no files are available.
 * @returns {JSX.Element} The empty state component.
 */
const EmptyState: React.FC = (): JSX.Element => (
  <Stack
    direction="column"
    alignItems="center"
    justifyContent="center"
    sx={{
      flex: 1,
      height: "100%",
      width: "100%",
      textAlign: "center",
      border: "1px solid #eeeeee",
      padding: 4,
      boxSizing: "border-box",
    }}
  >
    <Box
      component="img"
      src={EmptyTableImage}
      alt="No files available"
      sx={{
        width: 250,
        height: 176,
        opacity: 0.7,
        mb: 4,
      }}
    />
    <Typography variant="body2" color="text.secondary" sx={{ margin: 0 }}>
      There are currently no pieces of evidence or other documents uploaded.
    </Typography>
  </Stack>
);

/**
 * Displays a table of files with sortable columns.
 * @param {Object} props - The component props.
 * @param {Array} props.cols - The columns of the table.
 * @param {Array} props.rows - The rows of the table.
 * @param {Array<File>} props.files - The list of files.
 * @param {Function} props.handleSort - Callback to handle sorting.
 * @param {keyof File|null} props.sortField - The field currently sorted by.
 * @param {SortDirection|null} props.sortDirection - The current sort direction.
 * @param {Function} props.onRowClick - Callback to handle row selection.
 * @returns {JSX.Element} The file table component.
 */
const FileTable: React.FC<FileTableProps> =({
  cols,
  rows,
  files,
  handleSort,
  sortField,
  sortDirection,
  onRowClick,
}) => {
  const sortedCols = useMemo(
    () =>
      cols.map((col) =>
        ["Upload Date", "Uploader"].includes(col.name)
          ? {
              ...col,
              name: (
                <Stack
                  direction="row"
                  alignItems="center"
                  onClick={() =>
                    handleSort(col.name.toLowerCase() as keyof File)
                  }
                  sx={{ cursor: "pointer" }}
                >
                  {col.name}
                  <Box
                    component="img"
                    src={
                      sortField === col.name.toLowerCase() &&
                      sortDirection === SORT_DIRECTIONS.ASC
                        ? AscendingIcon
                        : DescendingIcon
                    }
                    alt="Sort"
                    sx={{ width: 16, height: 16, ml: 0.5 }}
                  />
                </Stack>
              ),
            }
          : col
      ),
    [cols, handleSort, sortField, sortDirection]
  );

  const [fileData, _] = useState([]);

  return (
    <VWBasicTable
      data={{ cols: sortedCols, rows }}
      bodyData={fileData}
      paginated={files.length > 0}
      table="fileManager"
      setSelectedRow={(row) => {
        onRowClick(row.id);
      }}
      setAnchorEl={() => {}}
    />
  );
};

//mock files
const mockFiles: File[] = [
  {
    id: "1",
    name: "Document1.pdf",
    type: "PDF",
    uploadDate: "2025-01-01",
    uploader: "User1",
  },
  {
    id: "2",
    name: "Image1.png",
    type: "Image",
    uploadDate: "2025-01-02",
    uploader: "User2",
  },
  {
    id: "3",
    name: "Presentation1.pptx",
    type: "Presentation",
    uploadDate: "2025-01-03",
    uploader: "User3",
  },
];
/**
 * Main component for managing files, displaying a table,
 * sorting, and handling actions (Download/Remove).
 * @returns {JSX.Element} The FileManager component.
 */
const FileManager: React.FC = (): JSX.Element => {
  const theme = useTheme();
  const projectID = "1"; //need to replace with actual project ID
  const { filesData, loading } = useFetchFiles(projectID);
  const [sortField, setSortField] = useState<keyof File | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(
    null
  );
  const [runFileTour, setRunFileTour] = useState(false);

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

  /**
   * Handles sorting of files by a specified field.
   * @param {keyof File} field - The field to sort by.
   */
  const handleSort = useCallback(
    (field: keyof File) => {
      const isAsc =
        sortField === field && sortDirection === SORT_DIRECTIONS.ASC;
      const newDirection = isAsc ? SORT_DIRECTIONS.DESC : SORT_DIRECTIONS.ASC;

      setSortDirection(newDirection);
      setSortField(field);

      
        filesData.sort((a, b) => {
          if (typeof a[field] === "string" && typeof b[field] === "string") {
            return newDirection === SORT_DIRECTIONS.ASC
              ? a[field].localeCompare(b[field])
              : b[field].localeCompare(a[field]);
          }
          return newDirection === SORT_DIRECTIONS.ASC
            ? a[field] < b[field]
              ? -1
              : 1
            : a[field] > b[field]
            ? -1
            : 1;
        })
      ;
    },
    [filesData, sortField, sortDirection]
  );

  const rows = useMemo(
    () =>
      filesData.map((file) => ({
        id: file.id,
        file: file.name,
        uploadDate: file.uploadDate,
        uploader: file.uploader,
      })),
    [filesData]
  );

  const cols = COLUMN_NAMES.map((name, index) => ({
    id: index + 1,
    name,
    sx: { width: "50%" },
  }));

  return (
    <Stack className="vwhome">
      <PageTour
        steps={fileSteps}
        run={runFileTour}
        onFinish={() => setRunFileTour(false)}
      />
      <Stack className="vwhome-header" sx={{ mb: 15 }} data-joyride-id="file-manager-title">
        <Typography sx={vwhomeHeading}>
          Evidences & documents
        </Typography>
        <Typography sx={{color:theme.palette.text.secondary,
          fontSize:theme.typography.fontSize
        }}>
          This table lists all the files uploaded to the system.
        </Typography>
      </Stack>

      {loading && (
        <VWSkeleton
          variant="rectangular"
          width="100%"
          height="300px"
          minWidth={"100%"}
          minHeight={300}
          sx={{ borderRadius: 2 }}
        />
      )}

      {!loading && (
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
            rows={rows}
            files={filesData}
            handleSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            onRowClick={handleRowClick}
          />
          {filesData.length === 0 && <EmptyState />}
        </Box>
      )}
    </Stack>
  );
};

export default FileManager;
