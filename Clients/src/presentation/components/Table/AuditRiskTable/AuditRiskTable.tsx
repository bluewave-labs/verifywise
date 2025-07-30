import { Table, TableContainer } from "@mui/material";
import singleTheme from "../../../themes/v1SingleTheme";
import {
  tableWrapper,
} from "../styles";
import TableHeader from "../TableHead";
import { AuditRiskTableBody } from "./AuditRiskTableBody";
import { useEffect, useState } from "react";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import { ProjectRisk } from "../../../../domain/types/ProjectRisk";

export type Risk = { id: number; title: string; status: string; severity: string }

const TITLE_OF_COLUMNS = ["Unlink", "ID", "Risk Title", "Status", "Severity", ""]

interface AuditRiskTableProps {
  risks: number[];
  deletedRisks: number[];
  checkedRows: number[];
  setCheckedRows: (checkedRows: number[]) => void;
}

export const AuditRiskTable: React.FC<AuditRiskTableProps> = ({
  risks,
  deletedRisks,
  checkedRows,
  setCheckedRows
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const setCurrentPagingation = (page: number) => {
    setCurrentPage(page)
  };
  const [riskDetails, setRiskDetails] = useState<Risk[]>([]);

  useEffect(() => {
    const fetchRiskDetails = async () => {
      await Promise.all(risks.map(async (riskId) => {
        const response = await apiServices.get(`/projectRisks/${riskId}`)
        if (response.status === 200) {
          const responseData = (response.data as {data: ProjectRisk, message: string, status: number}).data;
          setRiskDetails(prev => [
            ...prev,
            {
              id: responseData.id,
              title: responseData.risk_name,
              status: responseData.approval_status,
              severity: responseData.severity
            }
          ]);
        }
      }))
    }
    fetchRiskDetails();
  }, []);

  return (
    <TableContainer>
      <Table sx={{
        ...singleTheme.tableStyles.primary.frame,
        ...tableWrapper
      }}>
        <TableHeader columns={TITLE_OF_COLUMNS} />
        <AuditRiskTableBody
          rows={riskDetails}
          page={currentPage}
          setCurrentPagingation={setCurrentPagingation}
          deletedRisks={deletedRisks}
          checkedRows={checkedRows}
          setCheckedRows={setCheckedRows}
        />
      </Table>
    </TableContainer>
  )
} 