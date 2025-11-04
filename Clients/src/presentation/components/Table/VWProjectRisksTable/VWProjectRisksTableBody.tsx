import { TableBody, TableCell, TableRow, Chip, Dialog, useTheme, Link } from "@mui/material";
import singleTheme from "../../../themes/v1SingleTheme";
import { Suspense, useContext, useEffect, useState } from "react";
import { ProjectRisk } from "../../../../domain/types/ProjectRisk";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import { getMitigationStatusColor } from "../../../constants/statusColors";
import RiskChip from "../../RiskLevel/RiskChip";
import IconButton from "../../IconButton";
import { formatDate } from "../../../tools/isoDateToString";
import allowedRoles from "../../../../application/constants/permissions";
import { useSearchParams } from "react-router-dom";
import { ProjectRiskMitigation } from "../../ProjectRiskMitigation/ProjectRiskMitigation";
import useUsers from "../../../../application/hooks/useUsers";
import { useAuth } from "../../../../application/hooks/useAuth";
import { IVWProjectRisksTableRow } from "../../../../domain/interfaces/i.risk";
import { RiskModel } from "../../../../domain/models/Common/risks/risk.model";
import { User } from "../../../../domain/types/User";

function getDummyEvent() {
  const realEvent = new Event("click", { bubbles: true, cancelable: true });

  let defaultPrevented = false;
  let propagationStopped = false;

  const syntheticEvent = {
    ...realEvent,
    nativeEvent: realEvent,
    persist: () => {},
    preventDefault: () => {
      defaultPrevented = true;
      realEvent.preventDefault();
    },
    stopPropagation: () => {
      propagationStopped = true;
      realEvent.stopPropagation();
    },
    isDefaultPrevented: () => defaultPrevented,
    isPropagationStopped: () => propagationStopped,
    target: document.createElement("div"),
    currentTarget: document.createElement("div"),
    type: "click",
    timeStamp: Date.now(),
  } as unknown as React.SyntheticEvent;

  return syntheticEvent;
}

const VWProjectRisksTableBody = ({
  rows,
  page,
  rowsPerPage,
  setSelectedRow,
  setAnchor,
  onDeleteRisk,
  flashRow,
}: IVWProjectRisksTableRow) => {
  const theme = useTheme();
  const { setInputValues } = useContext(VerifyWiseContext);
  const { userRoleName } = useAuth();
  const { users } = useUsers();
  const isDeletingAllowed =
    allowedRoles.projectRisks.delete.includes(userRoleName);
  const cellStyle = singleTheme.tableStyles.primary.body.cell;
  
  const getCellStyle = (row: RiskModel) => ({
    ...cellStyle,
    ...(row.is_deleted && {
      textDecoration: 'line-through',
    })
  });
  const handleEditRisk = (row: RiskModel, event?: React.SyntheticEvent) => {
    setSelectedRow(row);
    setInputValues({
      ...row,
      assessment_mapping: row.assessment_mapping ? Number(row.assessment_mapping) : 0
    });
    // ensure the anchor is an HTMLElement or null to satisfy the setter type
    const anchorEl = (event?.currentTarget as unknown as HTMLElement) ?? null;
    setAnchor(anchorEl);
  };
  const [showMitigations, setShowMitigations] = useState(false);
  const [showMitigationProjectRisk, setShowMitigationProjectRisk] =
    useState<ProjectRisk | null>(null);

  const [searchParams] = useSearchParams();
  const riskId = searchParams.get("riskId");

  useEffect(() => {
    if (riskId) {
      const risk = rows.find((r: RiskModel) => r.id === parseInt(riskId));
      if (risk) {
        handleEditRisk(risk, getDummyEvent());
      }
    }
  }, []);

  const toggleMitigations = (
    risk: RiskModel,
    e: React.MouseEvent<HTMLElement>
  ) => {
    e.stopPropagation();
    setShowMitigations((prev) => !prev);
    const riskMitigation: ProjectRisk = {
      ...risk,
      risk_owner: risk.risk_owner?.toString(),
      risk_approval: risk.risk_approval !== undefined && risk.risk_approval !== null ? String(risk.risk_approval) : "",
    } as unknown as ProjectRisk;
    setShowMitigationProjectRisk(riskMitigation);
  };

  const handleDeleteRisk = async (riskId: number) => {
    onDeleteRisk(riskId);
  };

  const displayUserFullName = (userId: number) => {
    const currentUser = users.find((user: User) => user.id === userId);
    const fullName = currentUser
      ? `${currentUser.name} ${currentUser.surname}`
      : "";
    return fullName.length > 30 ? `${fullName.slice(0, 30)}...` : fullName;
  };

  return (
    <>
      <TableBody>
        {rows &&
          rows
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row: RiskModel, index: number) => (
              <TableRow
                key={index}
                sx={{
                  ...singleTheme.tableStyles.primary.body.row,
                  ...(row.is_deleted && {
                    opacity: 0.7,
                    backgroundColor: theme.palette.action?.hover || '#fafafa',
                  })
                }}
                onClick={(e) => handleEditRisk(row, e)}
              >
                <TableCell
                  sx={getCellStyle(row)}
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
                  sx={getCellStyle(row)}
                  style={{
                    backgroundColor: flashRow === row.id ? "#e3f5e6" : "",
                  }}
                >
                  {row.risk_owner
                    ? displayUserFullName(Number(row.risk_owner))
                    : "-"}
                </TableCell>
                <TableCell
                  sx={getCellStyle(row)}
                  style={{
                    backgroundColor: flashRow === row.id ? "#e3f5e6" : "",
                  }}
                >
                  <RiskChip label={row.severity} />
                </TableCell>
                <TableCell
                  sx={getCellStyle(row)}
                  style={{
                    backgroundColor: flashRow === row.id ? "#e3f5e6" : "",
                  }}
                >
                  {row.likelihood ? row.likelihood : "-"}
                </TableCell>
                <TableCell
                  sx={getCellStyle(row)}
                  style={{
                    backgroundColor: flashRow === row.id ? "#e3f5e6" : "",
                  }}
                >
                  {row.mitigation_status ? (
                    <Chip
                      label={row.mitigation_status}
                      size="small"
                      sx={{
                        backgroundColor: getMitigationStatusColor(
                          row.mitigation_status
                        ),
                        color: "white",
                        fontWeight: 500,
                        borderRadius: "4px",
                        height: 24,
                      }}
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell
                  sx={getCellStyle(row)}
                  style={{
                    backgroundColor: flashRow === row.id ? "#e3f5e6" : "",
                  }}
                >
                  <RiskChip label={row.risk_level_autocalculated} />
                </TableCell>
                <TableCell
                  sx={getCellStyle(row)}
                  style={{
                    backgroundColor: flashRow === row.id ? "#e3f5e6" : "",
                  }}
                >
                  {row.deadline ? formatDate(row.deadline.toString()) : "NA"}
                </TableCell>
                <TableCell
                  sx={getCellStyle(row)}
                  style={{
                    backgroundColor: flashRow === row.id ? "#e3f5e6" : "",
                  }}
                >
                  <Link
                    component="button"
                    onClick={(e: React.MouseEvent<HTMLElement>) =>
                      toggleMitigations(row, e)
                    }
                    sx={{
                      color: "#13715B",
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                      "&:hover": {
                        color: "#0F5A47",
                      },
                    }}
                  >
                    View controls
                  </Link>
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
                  {isDeletingAllowed && (
                    <IconButton
                      id={row.id!}
                      type="risk"
                      onMouseEvent={(e) => handleEditRisk(row, e)}
                      onDelete={() => handleDeleteRisk(row.id!)}
                      onEdit={() => handleEditRisk(row)}
                      warningTitle="Delete this project risk?"
                      warningMessage="Are you sure you want to delete this project risk. This action is non-recoverable."
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
      {showMitigations && (
        <Dialog
          open={showMitigations}
          onClose={() => {
            setShowMitigations(false);
            setShowMitigationProjectRisk(null);
          }}
          PaperProps={{
            sx: {
              width: "800px",
              maxWidth: "800px",
              minHeight: "300px",
            },
          }}
        >
          <Suspense fallback={"loading..."}>
            <ProjectRiskMitigation
              annexCategories={
                showMitigationProjectRisk?.annexCategories?.map((item) => ({
                  ...item,
                  type: "annexcategory",
                })) || []
              }
              subClauses={
                showMitigationProjectRisk?.subClauses?.map((item) => ({
                  ...item,
                  type: "subclause",
                })) || []
              }
              assessments={
                showMitigationProjectRisk?.assessments?.map((item) => ({
                  ...item,
                  type: "assessment",
                })) || []
              }
              controls={
                showMitigationProjectRisk?.controls?.map((item) => ({
                  ...item,
                  type: "control",
                })) || []
              }
              annexControls_27001={
                showMitigationProjectRisk?.annexControls_27001?.map((item) => ({
                  ...item,
                  type: "annexcontrol_27001",
                })) || []
              }
              subClauses_27001={
                showMitigationProjectRisk?.subClauses_27001?.map((item) => ({
                  ...item,
                  type: "annexsubclause_27001",
                })) || []
              }
              onClose={() => {
                setShowMitigations(false);
                setShowMitigationProjectRisk(null);
              }}
            />
          </Suspense>
        </Dialog>
      )}
    </>
  );
};

export default VWProjectRisksTableBody;
