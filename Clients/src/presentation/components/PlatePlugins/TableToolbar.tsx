import React from "react";
import { Box, IconButton, Tooltip, Divider } from "@mui/material";
import {
  Minus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  insertTableRow,
  insertTableColumn,
  deleteRow,
  deleteColumn,
  deleteTable,
} from "@platejs/table";

interface TableToolbarProps {
  editor: any;
}

const TableToolbar: React.FC<TableToolbarProps> = ({ editor }) => {
  const buttonStyle = {
    padding: "4px",
    borderRadius: "4px",
    color: "#344054",
    "&:hover": {
      backgroundColor: "#f3f4f6",
    },
  };

  const handleInsertRowAbove = () => {
    insertTableRow(editor, { at: "above" });
  };

  const handleInsertRowBelow = () => {
    insertTableRow(editor, { at: "below" });
  };

  const handleInsertColumnLeft = () => {
    insertTableColumn(editor, { at: "left" });
  };

  const handleInsertColumnRight = () => {
    insertTableColumn(editor, { at: "right" });
  };

  const handleDeleteRow = () => {
    deleteRow(editor);
  };

  const handleDeleteColumn = () => {
    deleteColumn(editor);
  };

  const handleDeleteTable = () => {
    deleteTable(editor);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        padding: "4px 8px",
        backgroundColor: "#fff",
        border: "1px solid #d0d5dd",
        borderRadius: "6px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <Tooltip title="Insert row above">
        <IconButton size="small" sx={buttonStyle} onClick={handleInsertRowAbove}>
          <ArrowUp size={14} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Insert row below">
        <IconButton size="small" sx={buttonStyle} onClick={handleInsertRowBelow}>
          <ArrowDown size={14} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete row">
        <IconButton size="small" sx={buttonStyle} onClick={handleDeleteRow}>
          <Minus size={14} />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Insert column left">
        <IconButton size="small" sx={buttonStyle} onClick={handleInsertColumnLeft}>
          <ArrowLeft size={14} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Insert column right">
        <IconButton size="small" sx={buttonStyle} onClick={handleInsertColumnRight}>
          <ArrowRight size={14} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete column">
        <IconButton size="small" sx={buttonStyle} onClick={handleDeleteColumn}>
          <Minus size={14} />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Delete table">
        <IconButton
          size="small"
          sx={{ ...buttonStyle, color: "#dc2626", "&:hover": { backgroundColor: "#fef2f2" } }}
          onClick={handleDeleteTable}
        >
          <Trash2 size={14} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default TableToolbar;
