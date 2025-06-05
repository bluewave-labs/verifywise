import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  useTheme,
  Stack, // Import Stack for button grouping
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings"; // Using SettingsIcon for the gear icon
import DeleteIcon from "@mui/icons-material/Delete"; // Import DeleteIcon
import VWSkeleton from "../../vw-v2-components/Skeletons"; // Assuming this path is correct
//import "./TrainingTable.css"; // For custom styles

// Define the interface for a single training item
export interface IAITraining {
  id: number; // Unique ID for each training
  training_name: string;
  duration: number;
  provider: string;
  department: string;
  status: 'Planned' | 'In Progress' | 'Completed';
  people: number;
}

// --- StatusBadge Component ---
// This component will render the colored status tags
const StatusBadge: React.FC<{ status: IAITraining['status'] }> = ({ status }) => {
  const theme = useTheme();
  let backgroundColor = '';
  let color = '#FFFFFF'; // Default text color for badges

  switch (status) {
    case 'Planned':
      backgroundColor = '#bbdefb'; // Light blue
      color = '#1976d2'; // Darker blue text
      break;
    case 'In Progress':
      backgroundColor = '#fff9c4'; // Light yellow
      color = '#fbc02d'; // Darker yellow text
      break;
    case 'Completed':
      backgroundColor = '#c8e6c9'; // Light green
      color = '#388e3c'; // Darker green text
      break;
    default:
      backgroundColor = '#e0e0e0'; // Grey for unknown status
      color = '#424242';
  }

  return (
    <Box
      component="span"
      sx={{
        backgroundColor: backgroundColor,
        color: color,
        padding: '4px 8px',
        borderRadius: theme.shape.borderRadius,
        fontWeight: 600,
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        display: 'inline-block', // Ensure padding applies correctly
      }}
    >
      {status}
    </Box>
  );
};

// --- TrainingTable Component ---
// This component encapsulates the table rendering
interface TrainingTableProps {
  data: IAITraining[];
  isLoading: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void; 
}

const TrainingTable: React.FC<TrainingTableProps> = ({ data, isLoading, onEdit, onDelete }) => {
  const theme = useTheme();
  console.log("Inside the training table=> data: ",data);
  if (isLoading) {
    return (
      <VWSkeleton
        height={"20vh"}
        minHeight={"20vh"}
        minWidth={260}
        width={"100%"}
        maxWidth={"100%"}
        variant="rectangular"
      />
    );
  }

  return (
    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: theme.shape.borderRadius }}>
      <Table sx={{ minWidth: 650 }} aria-label="AI Training Registry table">
        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #e0e0e0' }}>TRAINING NAME</TableCell>
            <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #e0e0e0' }}>DURATION</TableCell>
            <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #e0e0e0' }}>PROVIDER</TableCell>
            <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #e0e0e0' }}>DEPARTMENT</TableCell>
            <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #e0e0e0' }}>STATUS</TableCell>
            <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #e0e0e0' }}>PEOPLE</TableCell>
            <TableCell sx={{ fontWeight: 'bold', borderBottom: '1px solid #e0e0e0' }}>ACTIONS</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((training) => (
            <TableRow
              key={training.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">{training.training_name}</TableCell>
              <TableCell>{training.duration}</TableCell>
              <TableCell>{training.provider}</TableCell>
              <TableCell>{training.department}</TableCell>
              <TableCell>
                <StatusBadge status={training.status} />
              </TableCell>
              <TableCell>{training.people}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5}> {/* Use Stack for horizontal alignment of icons */}
                  <IconButton aria-label="edit" onClick={() => onEdit && onEdit(training.id.toString())}>
                    <SettingsIcon sx={{ color: theme.palette.grey[600] }} />
                  </IconButton>
                  <IconButton aria-label="delete" onClick={() => onDelete && onDelete(training.id.toString())}>
                    <DeleteIcon sx={{ color: theme.palette.error.main }} /> {/* Use error color for delete */}
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
  );
};

export default TrainingTable;
