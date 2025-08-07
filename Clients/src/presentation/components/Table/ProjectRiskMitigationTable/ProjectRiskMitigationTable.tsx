import { Table, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import singleTheme from "../../../themes/v1SingleTheme";
import {
  emptyData,
  styles,
  tableWrapper,
} from "../styles";
import TableHeader from "../TableHead";
import { useState } from "react";
import { ProjectRiskMitigation } from "../../../../domain/types/ProjectRisk";
import { ProjectRiskMitigationTableBody } from "./ProjectRiskMitigationTableBody";
import placeholderImage from '../../../assets/imgs/empty-state.svg';

export type Risk = { id: number; title: string; status: string; severity: string }

const TITLE_OF_COLUMNS = ["Component", "Type", ""]

interface ProjectRiskMitigationTableProps {
  rows: ProjectRiskMitigation[];
}

export const ProjectRiskMitigationTable: React.FC<ProjectRiskMitigationTableProps> = ({
  rows
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const setCurrentPagingation = (page: number) => {
    setCurrentPage(page)
  };  

  return (
    <TableContainer>
      <Table sx={{
        ...singleTheme.tableStyles.primary.frame,
        ...tableWrapper
      }}>
        <TableHeader columns={TITLE_OF_COLUMNS} />
        {
          rows.length > 0 ?
          <ProjectRiskMitigationTableBody
            rows={rows}
            page={currentPage}
            setCurrentPagingation={setCurrentPagingation}
          />
          :
          <TableRow>
            <TableCell
              colSpan={TITLE_OF_COLUMNS.length}
              align="center"
              sx={emptyData}
            >
              <img src={placeholderImage} alt="Placeholder" />
              <Typography sx={styles.textBase}>
                No mitigation data available
              </Typography>
            </TableCell>
          </TableRow>
        }
      </Table>
    </TableContainer>
  )
} 