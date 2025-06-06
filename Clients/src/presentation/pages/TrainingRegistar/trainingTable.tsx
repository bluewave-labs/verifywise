import React, { useState } from "react";
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
  Paper,
  useTheme,
  IconButton,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import DeleteIcon from "@mui/icons-material/Delete";
import TablePaginationActions from "../../components/TablePagination";
import "../../components/Table/index.css";

export interface IAITraining {
  id: number;
  training_name: string;
  duration: number;
  provider: string;
  department: string;
  status: 'Planned' | 'In Progress' | 'Completed';
  people: number;
}

interface TrainingTableProps {
  data: IAITraining[];
  isLoading: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  paginated?: boolean;
}

const DEFAULT_ROWS_PER_PAGE = 5;

const StatusBadge: React.FC<{ status: IAITraining['status'] }> = ({ status }) => {
  const theme = useTheme();
  let backgroundColor = '';
  let color = '#FFFFFF';

  switch (status) {
    case 'Planned':
      backgroundColor = '#bbdefb';
      color = '#1976d2';
      break;
    case 'In Progress':
      backgroundColor = '#fff9c4';
      color = '#fbc02d';
      break;
    case 'Completed':
      backgroundColor = '#c8e6c9';
      color = '#388e3c';
      break;
    default:
      backgroundColor = '#e0e0e0';
      color = '#424242';
  }

  return (
    <span
      style={{
        backgroundColor,
        color,
        padding: '4px 8px',
        borderRadius: 8,
        fontWeight: 600,
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        display: 'inline-block',
      }}
      className="label"
    >
      {status}
    </span>
  );
};

const TrainingTable: React.FC<TrainingTableProps> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  paginated = true,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedData = paginated
    ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : data;

  return (
    <>
      <TableContainer component={Paper}>
        <Table className="training-table" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 500 }}>TRAINING NAME</TableCell>
              <TableCell sx={{ fontWeight: 500 }}>DURATION</TableCell>
              <TableCell sx={{ fontWeight: 500 }}>PROVIDER</TableCell>
              <TableCell sx={{ fontWeight: 500 }}>DEPARTMENT</TableCell>
              <TableCell sx={{ fontWeight: 500 }}>STATUS</TableCell>
              <TableCell sx={{ fontWeight: 500 }}>PEOPLE</TableCell>
              <TableCell sx={{ fontWeight: 500 }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((training) => (
              <TableRow
                key={training.id}
                sx={{
                  height: "50px",
                  "&:hover": { backgroundColor: "#FBFBFB", cursor: "pointer" },
                }}
              >
                <TableCell className="host">{training.training_name}</TableCell>
                <TableCell>{training.duration}</TableCell>
                <TableCell>{training.provider}</TableCell>
                <TableCell>{training.department}</TableCell>
                <TableCell>
                  <StatusBadge status={training.status} />
                </TableCell>
                <TableCell>{training.people}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton aria-label="edit" onClick={() => onEdit && onEdit(training.id.toString())}>
                      <SettingsIcon sx={{ color: theme.palette.grey[600] }} />
                    </IconButton>
                    <IconButton aria-label="delete" onClick={() => onDelete && onDelete(training.id.toString())}>
                      <DeleteIcon sx={{ color: theme.palette.error.main }} />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  No training data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {paginated && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          px={theme.spacing(4)}
          sx={{ width: "100%", display: "flex" }}
        >
          <Typography px={theme.spacing(2)} fontSize={12} sx={{ opacity: 0.7 }}>
            Showing {page * rowsPerPage + 1} -{" "}
            {Math.min(page * rowsPerPage + rowsPerPage, data.length)} of {data.length} items
          </Typography>
          <TablePagination
            component="div"
            count={data.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 15, 25]}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Rows per page"
            sx={{ mt: theme.spacing(6) }}
            ActionsComponent={TablePaginationActions}
          />
        </Stack>
      )}
    </>
  );
};

export default TrainingTable;