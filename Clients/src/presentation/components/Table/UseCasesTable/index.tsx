import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Typography,
  LinearProgress,
  useTheme,
} from "@mui/material";
import Chip from "../../Chip";

export interface UseCaseRow {
  id: number;
  name: string;
  framework: string;
  progress: number;
  status: string;
  updated: string;
}

interface UseCasesTableProps {
  data: UseCaseRow[];
  onRowClick?: (id: number) => void;
  formatDate?: (date: string) => string;
}

const defaultFormatDate = (dateString: string): string => {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Unknown";

  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

const UseCasesTable: React.FC<UseCasesTableProps> = ({
  data,
  onRowClick,
  formatDate = defaultFormatDate,
}) => {
  const theme = useTheme();

  const headerCellStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: theme.palette.other.icon,
    borderBottom: `1px solid ${theme.palette.border.input}`,
  };

  const bodyCellStyle = {
    borderBottom: `1px solid ${theme.palette.background.subtle}`,
  };

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headerCellStyle}>Name</TableCell>
            <TableCell sx={headerCellStyle}>Progress</TableCell>
            <TableCell sx={headerCellStyle}>Status</TableCell>
            <TableCell sx={headerCellStyle}>Updated</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((useCase) => (
            <TableRow
              key={useCase.id}
              sx={{
                "&:hover": { backgroundColor: theme.palette.background.accent },
                cursor: onRowClick ? "pointer" : "default",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onRowClick?.(useCase.id);
              }}
            >
              <TableCell sx={{ fontSize: 13, color: theme.palette.text.primary, ...bodyCellStyle }}>
                {useCase.name}
              </TableCell>
              <TableCell sx={bodyCellStyle}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <LinearProgress
                    variant="determinate"
                    value={useCase.progress}
                    sx={{
                      width: 60,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: theme.palette.border.input,
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: 2,
                      },
                    }}
                  />
                  <Typography sx={{ fontSize: 12, color: theme.palette.other.icon }}>
                    {useCase.progress}%
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell sx={bodyCellStyle}>
                <Chip label={useCase.status} uppercase={false} />
              </TableCell>
              <TableCell sx={{ fontSize: 12, color: theme.palette.text.muted, ...bodyCellStyle }}>
                {formatDate(useCase.updated)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UseCasesTable;
