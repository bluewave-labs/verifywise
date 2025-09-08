import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  useTheme,
  Stack,
  Typography,
  TableFooter,
  Chip,
  Box,
  IconButton,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import Placeholder from "../../../assets/imgs/empty-state.svg";
import singleTheme from "../../../themes/v1SingleTheme";
import TablePaginationActions from "../../TablePagination";
import TableHeader from "../TableHead";
import { ReactComponent as SelectorVertical } from "../../../assets/icons/selector-vertical.svg";
import { ITask } from "../../../../domain/interfaces/i.task";
import { User } from "../../../../domain/types/User";
import CustomSelect from "../../CustomSelect";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const titleOfTableColumns = [
  "task",
  "priority",
  "status", 
  "due date",
  "assignees",
  "actions",
];

// Task priority colors - same pattern as assessment priorities
const taskPriorities = {
  "High": { color: "#FD7E14" },     // Orange
  "Medium": { color: "#EFB70E" },   // Yellow
  "Low": { color: "#ABBDA1" },      // Green/gray
};

interface TasksTableProps {
  tasks: ITask[];
  users: User[];
  onDelete: (taskId: number) => void;
  onEdit: (task: ITask) => void;
  onStatusChange: (taskId: number) => (newStatus: string) => Promise<boolean>;
  statusOptions: string[];
  isUpdateDisabled?: boolean;
}

const TasksTable: React.FC<TasksTableProps> = ({
  tasks,
  users,
  onDelete,
  onEdit,
  onStatusChange,
  statusOptions,
  isUpdateDisabled = false,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const cellStyle = singleTheme.tableStyles.primary.body.cell;

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

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(
      page * rowsPerPage + rowsPerPage,
      tasks?.length ?? 0
    );
    return `${start} - ${end}`;
  }, [page, rowsPerPage, tasks?.length ?? 0]);


  const tableBody = useMemo(
    () => (
      <TableBody>
        {tasks &&
          tasks
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((task: ITask) => (
              <TableRow
                key={task.id}
                sx={singleTheme.tableStyles.primary.body.row}
                onClick={() => onEdit(task)}
              >
                {/* Task Name */}
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {task.title}
                    </Typography>
                    {task.categories && task.categories.length > 0 && (
                      <Stack direction="row" spacing={0.5} mt={1}>
                        {task.categories.slice(0, 2).map((category) => (
                          <Chip
                            key={category}
                            label={category}
                            size="small"
                            sx={{ 
                              fontSize: 10, 
                              height: 20,
                              backgroundColor: '#f0f9ff',
                              color: '#0369a1'
                            }}
                          />
                        ))}
                        {task.categories.length > 2 && (
                          <Chip
                            label={`+${task.categories.length - 2}`}
                            size="small"
                            sx={{ 
                              fontSize: 10, 
                              height: 20,
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280'
                            }}
                          />
                        )}
                      </Stack>
                    )}
                  </Box>
                </TableCell>

                {/* Priority */}
                <TableCell sx={cellStyle}>
                  <Chip
                    label={task.priority}
                    sx={{
                      backgroundColor: taskPriorities[task.priority as keyof typeof taskPriorities]?.color || "#B0B0B0",
                      color: "#FFFFFF",
                    }}
                    size="small"
                  />
                </TableCell>

                {/* Status */}
                <TableCell sx={cellStyle}>
                  <CustomSelect
                    currentValue={task.status}
                    onValueChange={onStatusChange(task.id!)}
                    options={statusOptions}
                    disabled={isUpdateDisabled}
                    size="small"
                  />
                </TableCell>

                {/* Due Date */}
                <TableCell sx={cellStyle}>
                  {task.due_date ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                      {new Date(task.due_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.disabled" sx={{ fontSize: 12 }}>
                      No due date
                    </Typography>
                  )}
                </TableCell>

                {/* Assignees */}
                <TableCell sx={cellStyle}>
                  {task.assignees && task.assignees.length > 0 ? (
                    <Stack direction="row" spacing={0.5}>
                      {task.assignees.slice(0, 3).map((assigneeId, idx) => {
                        const user = users.find(u => u.id === Number(assigneeId));
                        const initials = user 
                          ? `${user.name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase()
                          : '?';
                        
                        return (
                          <Box
                            key={idx}
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              backgroundColor: '#f3f4f6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 500,
                              color: '#374151',
                              border: '2px solid #fff'
                            }}
                          >
                            {initials}
                          </Box>
                        );
                      })}
                      {task.assignees.length > 3 && (
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            backgroundColor: '#e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 500,
                            color: '#6b7280',
                            border: '2px solid #fff'
                          }}
                        >
                          +{task.assignees.length - 3}
                        </Box>
                      )}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.disabled" sx={{ fontSize: 12 }}>
                      Unassigned
                    </Typography>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    position: "sticky",
                    right: 0,
                    zIndex: 10,
                  }}
                >
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(task);
                      }}
                      sx={{
                        color: '#13715B',
                        backgroundColor: 'transparent',
                        '&:hover': {
                          backgroundColor: '#f0fdf4',
                          color: '#0f5d4f'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task.id!);
                      }}
                      sx={{
                        color: '#dc2626',
                        backgroundColor: 'transparent',
                        '&:hover': {
                          backgroundColor: '#fef2f2',
                          color: '#b91c1c'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    ),
    [
      tasks,
      page,
      rowsPerPage,
      cellStyle,
      users,
      onEdit,
      onDelete,
      onStatusChange,
      statusOptions,
      isUpdateDisabled,
    ]
  );

  return (
    <>
      {!tasks || tasks.length === 0 ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            border: "1px solid #EEEEEE",
            borderRadius: "4px",
            padding: theme.spacing(15, 5),
            paddingBottom: theme.spacing(20),
            gap: theme.spacing(10),
            minHeight: 200,
          }}
        >
          <img src={Placeholder} alt="Placeholder" />
          <Typography sx={{ fontSize: "13px", color: "#475467" }}>
            There is currently no data in this table.
          </Typography>
        </Stack>
      ) : (
        <TableContainer>
          <Table
            sx={
              singleTheme.tableStyles.primary.frame
            }
          >
            <TableHeader columns={titleOfTableColumns} />
            {tableBody}
            <TableFooter>
              <TableRow sx={{
                  '& .MuiTableCell-root.MuiTableCell-footer': {
                    paddingX: theme.spacing(8),
                    paddingY: theme.spacing(4),
                  }}}>
                <TableCell
                  sx={{ 
                    paddingX: theme.spacing(2),
                    fontSize: 12,
                    opacity: 0.7 }}
                  >
                  Showing {getRange} of {tasks?.length} task(s)
                </TableCell>
                <TablePagination
                  count={tasks?.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[5, 10, 15, 25]}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={(props) => (
                    <TablePaginationActions {...props} />
                  )}
                  labelRowsPerPage="Rows per page"
                  labelDisplayedRows={({ page, count }) =>
                    `Page ${page + 1} of ${Math.max(
                      0,
                      Math.ceil(count / rowsPerPage)
                    )}`
                  }
                  slotProps={{
                    select: {
                      MenuProps: {
                        keepMounted: true,
                        PaperProps: {
                          className: "pagination-dropdown",
                          sx: {
                            mt: 0,
                            mb: theme.spacing(2),
                          },
                        },
                        transformOrigin: {
                          vertical: "bottom",
                          horizontal: "left",
                        },
                        anchorOrigin: {
                          vertical: "top",
                          horizontal: "left",
                        },
                        sx: { mt: theme.spacing(-2) },
                      },
                      inputProps: { id: "pagination-dropdown" },
                      IconComponent: SelectorVertical,
                      sx: {
                        ml: theme.spacing(4),
                        mr: theme.spacing(12),
                        minWidth: theme.spacing(20),
                        textAlign: "left",
                        "&.Mui-focused > div": {
                          backgroundColor: theme.palette.background.main,
                        },
                      },
                    },
                  }}
                  sx={{
                    mt: theme.spacing(6),
                    color: theme.palette.text.secondary,
                    "& .MuiSelect-icon": {
                      width: "24px",
                      height: "fit-content",
                    },
                    "& .MuiSelect-select": {
                      width: theme.spacing(10),
                      borderRadius: theme.shape.borderRadius,
                      border: `1px solid ${theme.palette.border.light}`,
                      padding: theme.spacing(4),
                    },
                  }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default TasksTable;