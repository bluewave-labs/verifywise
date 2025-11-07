import {
  Table,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  Stack,
  Box,
  TableBody,
} from "@mui/material";
import singleTheme from "../../../themes/v1SingleTheme";
import { tableWrapper } from "../styles";
import TableHeader from "../TableHead";
import { useState } from "react";
import { ProjectRiskMitigation } from "../../../../domain/types/ProjectRisk";
import { ProjectRiskMitigationTableBody } from "./ProjectRiskMitigationTableBody";
import SkeletonCard from "../../SkeletonCard";

const TITLE_OF_COLUMNS = ["Component", "Type", ""];

interface ProjectRiskMitigationTableProps {
  rows: ProjectRiskMitigation[];
}

export const ProjectRiskMitigationTable: React.FC<
  ProjectRiskMitigationTableProps
> = ({ rows }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const setCurrentPagingation = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <TableContainer>
      <Table
        sx={{
          ...singleTheme.tableStyles.primary.frame,
          ...tableWrapper,
        }}
      >
        <TableHeader columns={TITLE_OF_COLUMNS} />
        {rows.length > 0 ? (
          <ProjectRiskMitigationTableBody
            rows={rows}
            page={currentPage}
            setCurrentPagingation={setCurrentPagingation}
          />
        ) : (
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={TITLE_OF_COLUMNS.length}
                align="center"
                sx={{ border: "none", p: 0 }}
              >
                <Stack alignItems="center" sx={{ pt: '75px', pb: 16 }}>
                  <Box sx={{ mb: '20px' }}>
                    <SkeletonCard showHalo={false} />
                  </Box>
                  <Typography sx={{ fontSize: 13, color: "#9CA3AF", fontWeight: 400 }}>
                    There is currently no data in this table.
                  </Typography>
                </Stack>
              </TableCell>
            </TableRow>
          </TableBody>
        )}
      </Table>
    </TableContainer>
  );
};
