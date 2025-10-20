import React, { useCallback, useState } from "react";
import { ProjectRisk } from "../../../../../domain/types/ProjectRisk";
import singleTheme from "../../../../themes/v1SingleTheme";
import {
  TableBody,
  TableCell,
  TableRow,
  useTheme,
  Checkbox as MuiCheckbox,
  TableFooter,
  TablePagination,
} from "@mui/material";
import { Square as CheckboxOutline } from "lucide-react";
import { CheckSquare as CheckboxFilled } from "lucide-react";
import { ChevronsUpDown } from "lucide-react";

const SelectorVertical = (props: any) => (
  <ChevronsUpDown size={16} {...props} />
);
import RiskChip from "../../../RiskLevel/RiskChip";

import {
  paginationStyle,
  paginationDropdown,
  paginationSelect,
} from "../../styles";
import TablePaginationActions from "../../../TablePagination";
import { ITableProps } from "../../../../../domain/interfaces/i.table";

const LinkedRisksTableBody: React.FC<ITableProps> = ({
  rows,
  page,
  setCurrentPagingation,
  currentRisks,
  checkedRows,
  setCheckedRows,
  deletedRisks,
  setDeletedRisks,
}) => {
  const cellStyle = singleTheme.tableStyles.primary.body.cell;
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const theme = useTheme();

  const handleChangePage = useCallback(
    (_: unknown, newPage: number) => {
      setCurrentPagingation(newPage);
    },
    [setCurrentPagingation]
  );

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setCurrentPagingation(0);
    },
    [setRowsPerPage, setCurrentPagingation]
  );

  const handleRowClick = (
    riskData: ProjectRisk,
    event: React.ChangeEvent | React.MouseEvent
  ) => {
    event.stopPropagation();
    const riskId = riskData.id;

    if (checkedRows.includes(riskId)) {
      setCheckedRows(checkedRows.filter((id) => id !== riskId));
      if (currentRisks.includes(riskId)) {
        setDeletedRisks([...deletedRisks, riskId]);
      }
    } else {
      setCheckedRows([...checkedRows, riskId]);
      if (deletedRisks.includes(riskId)) {
        setDeletedRisks(deletedRisks.filter((id) => id !== riskId));
      }
    }
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
                onClick={(e) => handleRowClick(row, e)}
              >
                <TableCell sx={cellStyle}>
                  <MuiCheckbox
                    size="small"
                    id="auto-fill"
                    checked={checkedRows.includes(row.id)}
                    onChange={(e) => handleRowClick(row, e)}
                    onClick={(e) => e.stopPropagation()}
                    checkedIcon={<CheckboxFilled size={16} />}
                    icon={<CheckboxOutline size={16} />}
                    sx={{
                      borderRadius: "4px",
                      "&:hover": { backgroundColor: "transparent" },
                      "& svg": { width: "small", height: "small" },
                      "& .MuiTouchRipple-root": {
                        display: "none",
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={cellStyle}>
                  {row.id ? row.id : page * rowsPerPage + index + 1}
                </TableCell>
                <TableCell>{row.risk_name ? row.risk_name : "-"}</TableCell>
                <TableCell sx={{ maxWidth: "300px" }}>
                  {row.risk_description ? row.risk_description : "-"}
                </TableCell>
                <TableCell sx={cellStyle}>
                  {row.risk_severity ? (
                    <RiskChip label={row.risk_severity} />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell sx={cellStyle}>
                  {row.likelihood ? row.likelihood : "-"}
                </TableCell>
                <TableCell sx={cellStyle}>
                  {row.risk_category ? row.risk_category : "-"}
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
      <TableFooter>
        <TableRow
          sx={{
            "& .MuiTableCell-root.MuiTableCell-footer": {
              paddingX: theme.spacing(8),
              paddingY: theme.spacing(4),
            },
          }}
        >
          <TablePagination
            count={rows?.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 15, 20, 25]}
            onRowsPerPageChange={handleChangeRowsPerPage}
            ActionsComponent={(props) => <TablePaginationActions {...props} />}
            labelRowsPerPage="Risks per page"
            labelDisplayedRows={({ page, count }) =>
              `Page ${page + 1} of ${Math.max(
                0,
                Math.ceil(count / rowsPerPage)
              )}`
            }
            sx={paginationStyle}
            slotProps={{
              select: {
                MenuProps: {
                  keepMounted: true,
                  PaperProps: {
                    className: "pagination-dropdown",
                    sx: paginationDropdown,
                  },
                  transformOrigin: { vertical: "bottom", horizontal: "left" },
                  anchorOrigin: { vertical: "top", horizontal: "left" },
                  sx: { mt: theme.spacing(-2) },
                },
                inputProps: { id: "pagination-dropdown" },
                IconComponent: SelectorVertical,
                sx: paginationSelect,
              },
            }}
          />
        </TableRow>
      </TableFooter>
    </>
  );
};

export default LinkedRisksTableBody;
