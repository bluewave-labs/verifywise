import { TableBody, TableCell, TableRow, Chip, Dialog } from "@mui/material";
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
import CustomizableButton from "../../Button/CustomizableButton";
import { ProjectRiskMitigation } from "../../ProjectRiskMitigation/ProjectRiskMitigation";
import useUsers from "../../../../application/hooks/useUsers";
import { useAuth } from "../../../../application/hooks/useAuth";

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
}: {
  rows: any[];
  page: number;
  rowsPerPage: number;
  setSelectedRow: any;
  setAnchor: any;
  onDeleteRisk: (id: number) => void;
  flashRow: number | null;
}) => {
  const { setInputValues } = useContext(VerifyWiseContext);
  const { userRoleName } = useAuth();
  const { users } = useUsers();
  const isDeletingAllowed =
    allowedRoles.projectRisks.delete.includes(userRoleName);
  const cellStyle = singleTheme.tableStyles.primary.body.cell;
  const handleEditRisk = (row: any, event?: React.SyntheticEvent) => {
    setSelectedRow(row);
    setInputValues(row);
    setAnchor(event?.currentTarget);
  };
  const [showMitigations, setShowMitigations] = useState(false);
  const [showMitigationProjectRisk, setShowMitigationProjectRisk] =
    useState<ProjectRisk | null>(null);

  const [searchParams] = useSearchParams();
  const riskId = searchParams.get("riskId");

  useEffect(() => {
    if (riskId) {
      const risk = rows.find((r: ProjectRisk) => r.id === parseInt(riskId));
      if (risk) {
        handleEditRisk(risk, getDummyEvent());
      }
    }
  }, []);

  const toggleMitigations = (
    risk: ProjectRisk,
    e: React.MouseEvent<HTMLElement>
  ) => {
    e.stopPropagation();
    setShowMitigations((prev) => !prev);
    setShowMitigationProjectRisk(risk);
  };

  const handleDeleteRisk = async (riskId: number) => {
    onDeleteRisk(riskId);
  };

  const displayUserFullName = (userId: number) => {
    const currentUser = users.find((user: any) => user.id === userId);
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
                  {row.risk_owner
                    ? displayUserFullName(Number(row.risk_owner))
                    : "-"}
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
                        backgroundColor: getMitigationStatusColor(
                          row.mitigation_status
                        ),
                        color: "white",
                        fontWeight: 500,
                        borderRadius: 12,
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
                  sx={cellStyle}
                  style={{
                    backgroundColor: flashRow === row.id ? "#e3f5e6" : "",
                  }}
                >
                  <CustomizableButton
                    sx={{
                      backgroundColor: "#13715B",
                      color: "#fff",
                      border: "1px solid #13715B",
                    }}
                    variant="contained"
                    text="View controls"
                    onClick={(e: React.MouseEvent<HTMLElement>) =>
                      toggleMitigations(row, e)
                    }
                  />
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
                      id={row.id}
                      type="risk"
                      onMouseEvent={(e) => handleEditRisk(row, e)}
                      onDelete={() => handleDeleteRisk(row.id)}
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
