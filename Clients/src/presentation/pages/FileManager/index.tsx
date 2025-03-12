import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Stack, Box, Typography } from "@mui/material"; //useTheme is not used
import VWBasicTable from "../../components/Table";
import { getEntityById } from "../../../application/repository/entity.repository";
import EmptyTableImage from "../../assets/imgs/empty-state.svg";
import AscendingIcon from "../../assets/icons/up-arrow.svg";
import DescendingIcon from "../../assets/icons/down-arrow.svg";
import PageTour from "../../components/PageTour";
import CustomStep from "../../components/PageTour/CustomStep";
import VWSkeleton from "../../vw-v2-components/Skeletons";

/**
 * Represents a file with its metadata.
 * @typedef {Object} File
 * @property {string} id - The unique identifier of the file.
 * @property {string} name - The name of the file.
 * @property {string} type - The type of the file.
 * @property {string} uploadDate - The date the file was uploaded.
 * @property {string} uploader - The uploader of the file.
 */
interface File {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  uploader: string;
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
const FileTable: React.FC<{
  cols: any[];
  rows: any[];
  files: File[];
  handleSort: (field: keyof File) => void;
  sortField: keyof File | null;
  sortDirection: SortDirection | null;
  onRowClick: (fileId: string) => void;
}> = ({ cols, rows, files, handleSort, sortField, sortDirection, onRowClick }) => {
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
      setSelectedRow={() => {}}
      setAnchorEl={() => {}}
      onRowClick={onRowClick}
    />
  );
};

/**
 * Main component for managing files, displaying a table,
 * sorting, and handling actions (Download/Remove).
 * @returns {JSX.Element} The FileManager component.
 */
const FileManager: React.FC = (): JSX.Element => {
  const [files, setFiles] = useState<File[]>([]);
  const [sortField, setSortField] = useState<keyof File | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(
    null
  );
  const [loading, setLoading] = useState(true);
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

    /**
     * Fetches all files from the '/files' endpoint.
     * This function retrieves a list of files and updates the state.
     * If an error occurs, it logs an error and sets the files to an empty array.
     * The loading state is managed to indicate the progress of the fetch.
     */
    const fetchAllFiles = async () => {
      try {
        setLoading(true);
        const files = await getEntityById({ routeUrl: "/files" });

        if (files && Array.isArray(files)) {
          setFiles(
            files.map((file) => ({
              id: file.id,
              name: file.name,
              type: file.type || "N/A",
              uploadDate: new Date(file.uploadDate).toLocaleDateString(),
              uploader: file.uploader || "N/A",
            }))
          );
        } else {
          setFiles([]);
        }
      } catch (error) {
        console.error("Error fetching files", error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllFiles();
  }, []);

  /**
   * Handles row selection in the file table.
   * Fetches and logs the file details when a row is clicked.
   * @param {string} fileId - The unique identifier of the selected file.
   */
  const handleRowClick = async (fileId: string) => {
    try {
      setLoading(true);
      const file = await getEntityById({ routeUrl: `/files/${fileId}` });

      if (file) {
        console.log("Selected File:", file);
      }
    } catch (error) {
      console.error("Error fetching file details", error);
    } finally {
      setLoading(false);
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

      setFiles(
        [...files].sort((a, b) => {
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
      );
    },
    [files, sortField, sortDirection]
  );

  const rows = useMemo(
    () =>
      files.map((file) => ({
        id: file.id,
        data: [
          { id: 1, data: file.name },
          { id: 2, data: file.uploadDate },
          { id: 3, data: file.uploader },
        ],
      })),
    [files]
  );

  const cols = COLUMN_NAMES.map((name,index)=>({
    id:index +1,
    name,
    sx: { width: "50%" },
  }))

  return (
    <Stack spacing={4} sx={{ padding: 4, marginBottom: 10 }}>
      <PageTour
        steps={fileSteps}
        run={runFileTour}
        onFinish={() => setRunFileTour(false)}
      />
      <Stack spacing={1} data-joyride-id="file-manager-title">
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Evidences & documents
        </Typography>
        <Typography variant="body2" color="text.secondary">
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
            justifyContent: files.length === 0 ? "center" : "flex-start",
            alignItems: files.length === 0 ? "center" : "stretch",
            position: "relative",
            borderRadius: "4px",
            overflow: "hidden",
            maxHeight: "400px",
            // borderBottom: files.length === 0 ? "1px solid #eeeeee" : "none",
          }}
        >
          <FileTable
            cols={cols}
            rows={rows}
            files={files}
            handleSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            onRowClick={handleRowClick}
          />
          {files.length === 0 && <EmptyState />}
        </Box>
      )}
    </Stack>
  );
};

export default FileManager;
