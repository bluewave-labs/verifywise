import { TableBody, TableCell, TableFooter, TablePagination, TableRow, useTheme } from "@mui/material";
import { ProjectRiskMitigation } from "../../../../domain/types/ProjectRisk";
import singleTheme from "../../../themes/v1SingleTheme";
import { useCallback, useState } from "react";
import TablePaginationActions from "../../TablePagination";
import { ReactComponent as SelectorVertical } from '../../../assets/icons/selector-vertical.svg'
import { paginationDropdown, paginationSelect, paginationStyle } from "../styles";
import CustomizableButton from "../../../vw-v2-components/Buttons";
import { useSearchParams } from "react-router-dom";

interface ProjectRiskMitigationTableBodyProps {
  rows: ProjectRiskMitigation[];
  page: number;
  setCurrentPagingation: (pageNo: number) => void;
}

const navigteToNewTab = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export const ProjectRiskMitigationTableBody: React.FC<ProjectRiskMitigationTableBodyProps> = ({
  rows,
  page,
  setCurrentPagingation
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

  const handleRowClick = (riskData: ProjectRiskMitigation, event: React.MouseEvent) => {
    event.stopPropagation();
    const riskId = riskData.id;
    if (riskId) {
      if (riskData.type === "annexcategory") {
        navigteToNewTab(`/project-view?projectId=${searchParams.get("projectId")}&tab=frameworks&framework=iso-42001&annexId=${riskData.parent_id}&annexCategoryId=${riskData.meta_id}`);
      } else if (riskData.type === "subclause") {
        navigteToNewTab(`/project-view?projectId=${searchParams.get("projectId")}&tab=frameworks&framework=iso-42001&clauseId=${riskData.parent_id}&subClauseId=${riskData.meta_id}`);
      }
    }

  }

  return (
    <>
    <TableBody>
      {rows &&
        rows
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((row: ProjectRiskMitigation, index: number) => (
            <TableRow key={index} sx={singleTheme.tableStyles.primary.body.row}>
              <TableCell sx={cellStyle}>
                {
                  (() => {
                    const title = `${row.type === "annexcategory" ? "A.": ""}${row.sup_id}.${row.sub_id} ${row.title}`
                    console.log(title.length);
                    return title.length > 30
                      ? `${title.slice(0, 30)}...`
                      : title
                  })()
                }
              </TableCell>
              <TableCell sx={cellStyle}>
                {row.type === "annexcategory" ? "ISO42001: Annex Category" : row.type === "subclause" ? "ISO42001: Sub-Clause" : "ISO42001: Clause"}
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