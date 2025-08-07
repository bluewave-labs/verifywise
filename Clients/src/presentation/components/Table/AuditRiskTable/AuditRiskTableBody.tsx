import { TableBody, TableCell, TableFooter, TablePagination, TableRow, useTheme, Checkbox as MuiCheckbox } from "@mui/material";
import { useCallback, useState } from "react";
import singleTheme from "../../../themes/v1SingleTheme";
import { ReactComponent as CheckboxOutline } from "../../../assets/icons/checkbox-outline.svg";
import { ReactComponent as CheckboxFilled } from "../../../assets/icons/checkbox-filled.svg";
import { ReactComponent as SelectorVertical } from '../../../assets/icons/selector-vertical.svg'
import {
  paginationStyle, 
  paginationDropdown, 
  paginationSelect
} from "../styles";
import TablePaginationActions from "../../TablePagination";
import RiskChip from "../../RiskLevel/RiskChip";
import { Risk } from "./AuditRiskTable";
import { useSearchParams } from "react-router-dom";
import CustomizableButton from "../../../vw-v2-components/Buttons";

interface AuditRiskTableBodyProps {
  rows: Risk[];
  page: number;
  setCurrentPagingation: (pageNo: number) => void;
  deletedRisks: number[];
  checkedRows: number[];
  setCheckedRows: (checkedRows: number[]) => void;
}

const navigteToNewTab = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export const AuditRiskTableBody: React.FC<AuditRiskTableBodyProps> = ({
  rows,
  page,
  setCurrentPagingation,
  deletedRisks,
  checkedRows,
  setCheckedRows
}) => {
  const cellStyle = singleTheme.tableStyles.primary.body.cell;
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const theme = useTheme();
  const [searchParams] = useSearchParams();

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setCurrentPagingation(newPage);
  }, [setCurrentPagingation]);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setCurrentPagingation(0);
    },
    [setRowsPerPage, setCurrentPagingation]
  );

  const handleChange = (riskData: Risk, event: React.ChangeEvent | React.MouseEvent) => {
    event.stopPropagation()
    const riskId = riskData.id;
    if (deletedRisks.includes(riskId)) {}
    else if (checkedRows.includes(riskId)) {
      setCheckedRows(checkedRows.filter(id => id !== riskId));
    } else {
      setCheckedRows([...checkedRows, riskId]);
    }
  };

  const handleRowClick = (riskData: Risk, event: React.MouseEvent) => {
    event.stopPropagation();
    const riskId = riskData.id;
    if (riskId) {
      navigteToNewTab(`/project-view?projectId=${searchParams.get("projectId")}&tab=project-risks&riskId=${riskId}`);
    }
  }

  return (
    <>
    <TableBody>
      {rows &&
        rows
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((row: Risk, index: number) => (
            <TableRow key={index} sx={singleTheme.tableStyles.primary.body.row}>
              <TableCell sx={cellStyle}>
                <MuiCheckbox
                  size="small"
                  id="auto-fill"
                  checked={deletedRisks.includes(row.id) || checkedRows.includes(row.id)}
                  onChange={(e) => handleChange(row, e)}
                  onClick={(e) => e.stopPropagation()}  
                  checkedIcon={<CheckboxFilled />}
                  icon={<CheckboxOutline />}
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
              <TableCell>
                {row.title ? row.title.length > 30 ? `${row.title.slice(0, 30)}...` : row.title : '-'}
              </TableCell>
              <TableCell sx={{maxWidth: '300px'}}>
                {row.status ? row.status : '-'}
              </TableCell>
              <TableCell sx={cellStyle}>
                {row.severity ? <RiskChip label={row.severity} /> : '-'}
              </TableCell>
              <TableCell>
                <CustomizableButton
                  sx={{
                    backgroundColor: "#13715B",
                    color: "#fff",
                    border: "1px solid #13715B",
                  }}
                  variant="contained"
                  text="View"
                  onClick={(e: React.MouseEvent<HTMLElement>) => {handleRowClick(row, e)}}
                />
              </TableCell>
            </TableRow>
          ))}
    </TableBody>
    <TableFooter>
      <TableRow sx={{
        '& .MuiTableCell-root.MuiTableCell-footer': {
          paddingX: theme.spacing(8),
          paddingY: theme.spacing(4),
        }}}>
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
            `Page ${page + 1} of ${Math.max(0, Math.ceil(count / rowsPerPage))}`
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
  )
}