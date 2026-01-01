import React from "react";
import { TableBody, TableCell, TableRow } from "@mui/material";
import IconButton from "../../../IconButton";
import { displayFormattedDate } from "../../../../tools/isoDateToString";
import singleTheme from "../../../../themes/v1SingleTheme";
import { styles } from "./styles";
import { handleDownload } from "../../../../../application/tools/fileDownload";
import { IReportTableProps } from "../../../../types/interfaces/i.table";

const ReportTableBody: React.FC<IReportTableProps> = ({
  rows,
  onRemoveReport,
  page,
  rowsPerPage,
  sortConfig,
}) => {
  const cellStyle = singleTheme.tableStyles.primary.body.cell;

  const handleRemoveReport = async (reportId: number) => {
    onRemoveReport(reportId);
  };

  // row onclick function
  const handleEditRisk = () => {};

  const formatSource = (source: string) => {
    if (!source) return "-";
    if (source.trim().toLowerCase() === "all reports") return "All Reports";
    const cleaned = source
      .replace(/\breport\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    return cleaned.length ? cleaned : source;
  };

  return (
    <TableBody>
      {rows &&
        rows
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((row, index: number) => (
            <TableRow
              key={index}
              sx={{
                ...singleTheme.tableStyles.primary.body.row,
                "&:hover": {
                  backgroundColor: "#fafafa",
                  cursor: "default",
                },
              }}
            >
              <TableCell
                sx={{
                  ...cellStyle,
                  backgroundColor: sortConfig?.key && (sortConfig.key.toLowerCase().includes("file") || sortConfig.key.toLowerCase().includes("name")) ? "#e8e8e8" : "#fafafa",
                }}
              >
                {row.filename ? row.filename : "-"}
              </TableCell>
              <TableCell
                sx={{
                  ...cellStyle,
                  backgroundColor: sortConfig?.key && sortConfig.key.toLowerCase().includes("source") ? "#f5f5f5" : "inherit",
                }}
              >
                {row.source ? formatSource(row.source) : "-"}
              </TableCell>
              <TableCell
                sx={{
                  ...cellStyle,
                  backgroundColor: sortConfig?.key && sortConfig.key.toLowerCase().includes("project") ? "#f5f5f5" : "inherit",
                }}
              >
                {row.project_title ? row.project_title : "-"}
              </TableCell>
              <TableCell
                sx={{
                  ...cellStyle,
                  backgroundColor: sortConfig?.key && (sortConfig.key.toLowerCase().includes("date") || sortConfig.key.toLowerCase().includes("upload") || sortConfig.key.toLowerCase().includes("time")) ? "#f5f5f5" : "inherit",
                }}
              >
                {row.uploaded_time
                  ? displayFormattedDate(row.uploaded_time.toString())
                  : "NA"}
              </TableCell>
              <TableCell
                sx={{
                  ...cellStyle,
                  backgroundColor: sortConfig?.key && sortConfig.key.toLowerCase().includes("uploader") ? "#f5f5f5" : "inherit",
                }}
              >
                {row.uploader_name ? row.uploader_name : "-"}{" "}
                {row.uploader_surname ? row.uploader_surname : "-"}
              </TableCell>
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  ...styles.setting,
                  backgroundColor: sortConfig?.key && (sortConfig.key.toLowerCase().includes("action") || sortConfig.key.toLowerCase().includes("setting")) ? "#f5f5f5" : "inherit",
                }}
              >
                <IconButton
                  id={row.id}
                  type="report"
                  onMouseEvent={() => handleEditRisk()}
                  onDelete={() => handleRemoveReport(row.id)}
                  onEdit={() => {}}
                  onDownload={() => handleDownload(row.id, row.filename)}
                  warningTitle="Remove this report?"
                  warningMessage={`Are you sure you want to remove this report? This action is non-recoverable.`}
                ></IconButton>
              </TableCell>
            </TableRow>
          ))}
    </TableBody>
  );
};

export default ReportTableBody;
