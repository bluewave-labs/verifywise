import { TableBody, TableCell, TableRow, Chip, Dialog, useTheme } from "@mui/material";
import { VWLink } from "../../Link";
import singleTheme from "../../../themes/v1SingleTheme";
import { Suspense, useContext, useEffect, useState } from "react";
import { ProjectRisk } from "../../../../domain/types/ProjectRisk";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import { getMitigationStatusColor } from "../../../constants/statusColors";
import RiskChip from "../../RiskLevel/RiskChip";
import IconButton from "../../IconButton";
import { displayFormattedDate } from "../../../tools/isoDateToString";
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
  sortConfig,
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
                  sx={{
                    ...getCellStyle(row),
                    backgroundColor: flashRow === row.id
                      ? "#e3f5e6"
                      : sortConfig.key === "risk_name"
                      ? "#e8e8e8"
                      : "#fafafa",
                  }}
                >
                  {row.risk_name
                    ? row.risk_name?.length > 30
                      ? `${row.risk_name.slice(0, 30)}...`
                      : row.risk_name
                    : "-"}
                </TableCell>
                <TableCell
                  sx={{
                    ...getCellStyle(row),
                    backgroundColor: flashRow === row.id
                      ? "#e3f5e6"
                      : sortConfig.key === "risk_owner"
                      ? "#f5f5f5"
                      : "",
                  }}
                >
                  {row.risk_owner
                    ? displayUserFullName(Number(row.risk_owner))
                    : "-"}
                </TableCell>
                <TableCell
                  sx={{
                    ...getCellStyle(row),
                    backgroundColor: flashRow === row.id
                      ? "#e3f5e6"
                      : sortConfig.key === "severity"
                      ? "#f5f5f5"
                      : "",
                  }}
                >
                  {row.severity ? (
                    <Chip
                      label={row.severity}
                      size="small"
                      sx={{
                        backgroundColor: (() => {
                          const severity = row.severity.toLowerCase();
                          if (severity.includes('catastrophic')) return '#ffcdd2';
                          if (severity.includes('major')) return '#ffe0b2';
                          if (severity.includes('moderate')) return '#fff9c4';
                          if (severity.includes('minor')) return '#c8e6c9';
                          if (severity.includes('negligible')) return '#b2dfdb';
                          return '#e0e0e0';
                        })(),
                        color: (() => {
                          const severity = row.severity.toLowerCase();
                          if (severity.includes('catastrophic')) return '#c62828';
                          if (severity.includes('major')) return '#e65100';
                          if (severity.includes('moderate')) return '#f57f17';
                          if (severity.includes('minor')) return '#2e7d32';
                          if (severity.includes('negligible')) return '#00695c';
                          return '#424242';
                        })(),
                        borderRadius: "4px !important",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        height: 24,
                      }}
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell
                  sx={{
                    ...getCellStyle(row),
                    backgroundColor: flashRow === row.id
                      ? "#e3f5e6"
                      : sortConfig.key === "likelihood"
                      ? "#f5f5f5"
                      : "",
                  }}
                >
                  {row.likelihood ? (
                    <Chip
                      label={row.likelihood}
                      size="small"
                      sx={{
                        backgroundColor: (() => {
                          const likelihood = row.likelihood.toLowerCase();
                          if (likelihood.includes('almost certain')) return '#ffcdd2';
                          if (likelihood.includes('likely')) return '#ffe0b2';
                          if (likelihood.includes('possible')) return '#fff9c4';
                          if (likelihood.includes('unlikely')) return '#c8e6c9';
                          if (likelihood.includes('rare')) return '#b2dfdb';
                          return '#e0e0e0';
                        })(),
                        color: (() => {
                          const likelihood = row.likelihood.toLowerCase();
                          if (likelihood.includes('almost certain')) return '#c62828';
                          if (likelihood.includes('likely')) return '#e65100';
                          if (likelihood.includes('possible')) return '#f57f17';
                          if (likelihood.includes('unlikely')) return '#2e7d32';
                          if (likelihood.includes('rare')) return '#00695c';
                          return '#424242';
                        })(),
                        borderRadius: "4px !important",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        height: 24,
                      }}
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell
                  sx={{
                    ...getCellStyle(row),
                    backgroundColor: flashRow === row.id
                      ? "#e3f5e6"
                      : sortConfig.key === "mitigation_status"
                      ? "#f5f5f5"
                      : "",
                  }}
                >
                  {row.mitigation_status ? (
                    <Chip
                      label={row.mitigation_status}
                      size="small"
                      sx={{
                        backgroundColor: (() => {
                          const status = row.mitigation_status.toLowerCase();
                          if (status.includes('completed')) return '#c8e6c9';
                          if (status.includes('in progress')) return '#fff9c4';
                          if (status.includes('not started')) return '#e0e0e0';
                          if (status.includes('on hold')) return '#ffe0b2';
                          if (status.includes('deferred')) return '#ffecb3';
                          if (status.includes('canceled')) return '#ffcdd2';
                          if (status.includes('requires review')) return '#e1bee7';
                          return '#e0e0e0';
                        })(),
                        color: (() => {
                          const status = row.mitigation_status.toLowerCase();
                          if (status.includes('completed')) return '#2e7d32';
                          if (status.includes('in progress')) return '#f57f17';
                          if (status.includes('not started')) return '#616161';
                          if (status.includes('on hold')) return '#e65100';
                          if (status.includes('deferred')) return '#f57f17';
                          if (status.includes('canceled')) return '#c62828';
                          if (status.includes('requires review')) return '#6a1b9a';
                          return '#424242';
                        })(),
                        borderRadius: "4px !important",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        height: 24,
                      }}
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell
                  sx={{
                    ...getCellStyle(row),
                    backgroundColor: flashRow === row.id
                      ? "#e3f5e6"
                      : sortConfig.key === "risk_level_autocalculated"
                      ? "#f5f5f5"
                      : "",
                  }}
                >
                  {row.risk_level_autocalculated ? (
                    <Chip
                      label={row.risk_level_autocalculated}
                      size="small"
                      sx={{
                        backgroundColor: (() => {
                          const level = row.risk_level_autocalculated.toLowerCase();
                          if (level.includes('very high') || level.includes('critical')) return '#ffcdd2';
                          if (level.includes('high')) return '#ffe0b2';
                          if (level.includes('medium') || level.includes('moderate')) return '#fff9c4';
                          if (level.includes('low')) return '#c8e6c9';
                          if (level.includes('very low') || level.includes('no risk')) return '#b2dfdb';
                          return '#e0e0e0';
                        })(),
                        color: (() => {
                          const level = row.risk_level_autocalculated.toLowerCase();
                          if (level.includes('very high') || level.includes('critical')) return '#c62828';
                          if (level.includes('high')) return '#e65100';
                          if (level.includes('medium') || level.includes('moderate')) return '#f57f17';
                          if (level.includes('low')) return '#2e7d32';
                          if (level.includes('very low') || level.includes('no risk')) return '#00695c';
                          return '#424242';
                        })(),
                        borderRadius: "4px !important",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        height: 24,
                      }}
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell
                  sx={{
                    ...getCellStyle(row),
                    backgroundColor: flashRow === row.id
                      ? "#e3f5e6"
                      : sortConfig.key === "deadline"
                      ? "#f5f5f5"
                      : "",
                  }}
                >
                  {row.deadline ? displayFormattedDate(row.deadline.toString()) : "NA"}
                </TableCell>
                <TableCell
                  sx={{
                    ...getCellStyle(row),
                    backgroundColor: flashRow === row.id
                      ? "#e3f5e6"
                      : sortConfig.key === "controls_mapping"
                      ? "#f5f5f5"
                      : "",
                  }}
                >
                  <VWLink
                    onClick={(e: React.MouseEvent<HTMLElement>) =>
                      toggleMitigations(row, e)
                    }
                  >
                    View controls
                  </VWLink>
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    position: "sticky",
                    right: 0,
                    minWidth: "50px",
                    backgroundColor: flashRow === row.id
                      ? "#e3f5e6"
                      : sortConfig.key === "actions"
                      ? "#f5f5f5"
                      : "",
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
