import React, {
  useState,
} from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  TableFooter,
} from "@mui/material";
import TablePaginationActions from "../../components/TablePagination";
import "../../components/Table/index.css";
import singleTheme from "../../themes/v1SingleTheme";
import CustomIconButton from "../../components/IconButton";
import allowedRoles from "../../../application/constants/permissions";

//const Alert = lazy(() => import("../../../components/Alert"));

//Constant for table
const TABLE_COLUMNS = [
  {id:"training_name", label:"TRAINING NAME"},
  {id:"duration", label:"DURATION"},
  {id:"provider", label:"PROVIDER"},
  {id:"department", label:"DEPARTMENT"},
  {id:"status", label:"STATUS"},
  {id:"people", label:"PEOPLE"},
]

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
 // const theme = useTheme();
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
  
  const userRoleName = "Admin";

  // Function to check if the current user can delete trainings
  const isDeletingAllowed = allowedRoles.training?.delete?.includes(userRoleName)
  const [page, setPage] = useState(DEFAULT_ROWS_PER_PAGE);
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
    <TableContainer  sx={{ overflowX: "auto" }}>
      <Table sx={{ ...singleTheme.tableStyles.primary.frame }}>
        <TableHead
        sx={{
          backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors,
        }}>
          <TableRow>
                      {TABLE_COLUMNS.map((column) => (
                        <TableCell
                          key={column.id}
                          sx={{
                            ...singleTheme.tableStyles.primary.header.cell,
                            ...(column.id === "action" && {
                              position: "sticky",
                              right: 0,
                              backgroundColor:
                                singleTheme.tableStyles.primary.header
                                  .backgroundColors,
                            }),
                          }}
                        >
                          {column.label}
                        </TableCell>
                      ))}
                    </TableRow>
        </TableHead>
        <TableBody>
          {paginatedData.length > 0 ? (
            paginatedData.map((training) => (
              <TableRow key={training.id}>
                <TableCell>{training.training_name}</TableCell>
                <TableCell>{training.duration}</TableCell>
                <TableCell>{training.provider}</TableCell>
                <TableCell>{training.department}</TableCell>
                <TableCell>
                  <StatusBadge status={training.status} />
                </TableCell>
                <TableCell>{training.people}</TableCell>
                <TableCell>
                 {isDeletingAllowed && (
                    <CustomIconButton
                      id={training.id}
                      onDelete={() => onDelete && onDelete(training.id.toString())}
                      onEdit={() => onEdit && onEdit(training.id.toString())}
                      onMouseEvent={() => {}}
                      warningTitle="Delete this training?"
                      warningMessage="When you delete this training, all data related to this training will be removed. This action is non-recoverable."
                      type="Training"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                No training data available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {paginated && (
          <TableFooter>
            <TableRow>
              <TablePaginationActions
                count={data.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
              />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  );
};

export default TrainingTable;