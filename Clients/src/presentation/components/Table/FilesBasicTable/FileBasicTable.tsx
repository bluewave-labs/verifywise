import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
  IconButton,
  Menu,
  MenuItem
} from "@mui/material";
import TablePaginationActions from "../../TablePagination";
import singleTheme from "../../../themes/v1SingleTheme";
import { useState, useEffect, useCallback} from "react";
import { FileData } from "../../../../domain/File";
import { ReactComponent as EvidencesDownload} from "../../../assets/icons/evidences-download.svg";


const DEFAULT_ROWS_PER_PAGE = 5;

interface Column {
  id: number;
  name: keyof FileData | string;
  sx?: object;
}

interface FileBasicTableProps {
  data: {
    rows: any[];
    cols: Column[];
  };
  bodyData: FileData[];
  paginated?: boolean;
  table: string;
  onRowClick: (id: string) => void;
  setSelectedRow: (row: any) => void;
  setAnchorEl: (element: HTMLElement | null) => void;
}

const FileBasicTable: React.FC<FileBasicTableProps> = ({
  data,
  bodyData,
  paginated = false,
  table,
  onRowClick,
  setSelectedRow,
  setAnchorEl,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);

  useEffect(() => setPage(0), [data]);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  const onRowClickHandler = (
    event: React.MouseEvent<HTMLTableRowElement>,
    rowData: any
  ) => {
    setSelectedRow(rowData);
    setAnchorEl(event.currentTarget);
    onRowClick(rowData.id);
  };

  const paginatedRows = bodyData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  //download file
  const handleDownload = async (fileId: string, fileName:string) => {
    const token = localStorage.getItem("token");
    try{
      const res = await fetch(`http://localhost:3000/files/${fileId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };
  return (
    <>
      <TableContainer id={table}>
        <Table sx={singleTheme.tableStyles.primary.frame}>
          <TableHead
            sx={{
              backgroundColor:
                singleTheme.tableStyles.primary.header.backgroundColors,
            }}
          >
            <TableRow sx={singleTheme.tableStyles.primary.header.row}>
              {data.cols.map((col) => (
                <TableCell
                  key={col.id}
                  style={{
                    ...singleTheme.tableStyles.primary.header.cell,
                    ...col.sx,
                  }}
                >
                  {col.name.toString().toUpperCase()}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((row) => (
              <TableRow
                key={row.id}
                onClick={(e) => onRowClickHandler(e, row)}
                sx={{
                  ...singleTheme.tableStyles.primary.body.row,
                  height: "36px",
                  "&:hover": { backgroundColor: "#FBFBFB", cursor: "pointer" },
                }}
              >
                <TableCell>{row.fileName}</TableCell>
                <TableCell>{row.uploadDate}</TableCell>
                <TableCell>{row.uploader}</TableCell>
                <TableCell>
                  <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(row);
                    setAnchorEl(e.currentTarget);
                    setSelectedRow(row);
                    setMenuAnchorEl(e.currentTarget);
                  }}
                  >
                    <EvidencesDownload />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}>
<MenuItem
onClick={()=> {
  if (selectedFile) {
    handleDownload(selectedFile.id, selectedFile.fileName);
  }
  setMenuAnchorEl(null);
}}
>
  Download
</MenuItem>
        </Menu>
      {paginated && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          px={theme.spacing(4)}
          sx={{
            width: "100%",
            display: "flex",
          }}
        >
          <Typography px={theme.spacing(2)} fontSize={12} sx={{ opacity: 0.7 }}>
            Showing {page * rowsPerPage + 1} -
            {Math.min(page * rowsPerPage + rowsPerPage, bodyData.length)} of{" "}
            {bodyData.length} items
          </Typography>
          <TablePagination
            count={bodyData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 15, 20, 25]}
            onRowsPerPageChange={handleChangeRowsPerPage}
            ActionsComponent={
              TablePaginationActions as React.ComponentType<any>
            }
            labelRowsPerPage="Rows per page"
            sx={{ mt: theme.spacing(6) }}
          />
        </Stack>
      )}
    </>
  );
};

export default FileBasicTable;
