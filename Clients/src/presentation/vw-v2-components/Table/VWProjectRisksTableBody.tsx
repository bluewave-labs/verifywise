import {
  TableBody,
  TableCell,
  TableRow,
  useTheme,
  Chip,
} from "@mui/material";
import singleTheme from "../../themes/v1SingleTheme";
import { useContext } from "react";
import { ProjectRisk } from "../../../domain/types/ProjectRisk";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import { getMitigationStatusColor } from "../../constants/statusColors";
import RiskChip from "../../components/RiskLevel/RiskChip";
import IconButton from "../../components/IconButton";
import { formatDate } from "../../tools/isoDateToString";
import allowedRoles from "../../../application/constants/permissions";


const VWProjectRisksTableBody = ({
  rows,
  page,
  rowsPerPage,
  setSelectedRow,
  setAnchor,
  onDeleteRisk,
  flashRow,
}: {
  rows: any[];
  page: number;
  rowsPerPage: number;
  setSelectedRow: any;
  setAnchor: any;
  onDeleteRisk: (id: number) => void;
  flashRow: number | null;
}) => {
  const { setInputValues, users, userRoleName } = useContext(VerifyWiseContext);
  const isDeletingAllowed = allowedRoles.projectRisks.delete.includes(userRoleName);
  const cellStyle = singleTheme.tableStyles.primary.body.cell;
  const theme = useTheme();
  const handleEditRisk = (row: any, event?: React.SyntheticEvent) => {
    setSelectedRow(row);
    setInputValues(row);
    setAnchor(event?.currentTarget);
  };

  const handleDeleteRisk = async (riskId: number) => {
    onDeleteRisk(riskId);
  };

  const displayUserFullName = (userId: number) => {
    const currentUser = users.find(
      (user: any) => user.id === userId
    );
    const fullName = currentUser
      ? `${currentUser.name} ${currentUser.surname}`
      : "";
    return fullName.length > 30 ? `${fullName.slice(0, 30)}...` : fullName;
  };

  return (
    <TableBody>
      {rows &&
        rows
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((row: ProjectRisk, index: number) => (
            <TableRow
              key={index}
              sx={singleTheme.tableStyles.primary.body.row}
              onClick={(e) => handleEditRisk(row, e)}
            >
              <TableCell
                sx={cellStyle}
                style={{
                  backgroundColor: flashRow === row.id ? "#e3f5e6" : "",
                }}
              >
                {row.risk_name
                  ? row.risk_name?.length > 30
                    ? `${row.risk_name.slice(0, 30)}...`
                    : row.risk_name
                  : "-"}
              </TableCell>
              <TableCell
                sx={cellStyle}
                style={{
                  backgroundColor: flashRow === row.id ? "#e3f5e6" : "",
                }}
              >
                {row.risk_owner ? displayUserFullName(Number(row.risk_owner)) : "-"}
              </TableCell>
              <TableCell
                sx={cellStyle}
                style={{
                  backgroundColor: flashRow === row.id ? "#e3f5e6" : "",
                }}
              >
                <RiskChip label={row.severity} />
              </TableCell>
              <TableCell
                sx={cellStyle}
                style={{
                  backgroundColor: flashRow === row.id ? "#e3f5e6" : "",
                }}
              >
                {row.likelihood ? row.likelihood : "-"}
              </TableCell>
              <TableCell
                sx={cellStyle}
                style={{
                  backgroundColor: flashRow === row.id ? "#e3f5e6" : "",
                }}
              >
                {row.mitigation_status ? (
                  <Chip
                    label={row.mitigation_status}
                    size="small"
                    sx={{
                      backgroundColor: getMitigationStatusColor(row.mitigation_status),
                      color: 'white',
                      fontWeight: 500,
                      borderRadius: theme.shape.borderRadius,
                      height: 24,
                    }}
                  />
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell
                sx={cellStyle}
                style={{
                  backgroundColor: flashRow === row.id ? "#e3f5e6" : "",
                }}
              >
                <RiskChip label={row.risk_level_autocalculated} />
              </TableCell>
              <TableCell
                sx={cellStyle}
                style={{
                  backgroundColor: flashRow === row.id ? "#e3f5e6" : "",
                }}
              >
                {row.deadline ? formatDate(row.deadline.toString()) : "NA"}
              </TableCell>
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  position: "sticky",
                  right: 0,
                  minWidth: "50px",
                }}
                style={{
                  backgroundColor: flashRow === row.id ? "#e3f5e6" : "",
                }}
              >
                {isDeletingAllowed &&
                  <IconButton
                    id={row.id}
                    type="risk"
                    onMouseEvent={(e) => handleEditRisk(row, e)}
                    onDelete={() => handleDeleteRisk(row.id)}
                    onEdit={() => handleEditRisk(row)}
                    warningTitle="Delete this project risk?"
                    warningMessage="Are you sure you want to delete this project risk. This action is non-recoverable."
                  />
                }
              </TableCell>
            </TableRow>
          ))}
    </TableBody>
  );
};

export default VWProjectRisksTableBody;