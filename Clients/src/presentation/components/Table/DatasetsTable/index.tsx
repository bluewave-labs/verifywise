import { useMemo, useState } from "react";
import { Box, Stack, Table, TableBody, TableCell, TableHead, TableRow, Checkbox, TextField, Button } from "@mui/material";
import { Database, Search, Trash2 } from "lucide-react";

export type DatasetsTableRow = {
  id: string;
  name: string;
  description?: string;
  prompts?: number | string; // number or "—"/"…" placeholder
  updated?: string;
};

type DatasetsTableProps = {
  rows: DatasetsTableRow[];
  filter?: string;
  onFilterChange?: (value: string) => void;
  onOpenRow?: (row: DatasetsTableRow) => void;
  onDelete?: (selectedIds: string[]) => void;
  showFilter?: boolean;
};

export default function DatasetsTable(props: DatasetsTableProps) {
  const { rows, filter = "", onFilterChange, onOpenRow, onDelete, showFilter = true } = props;
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  
  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);

  const allSelected = useMemo(
    () => rows.length > 0 && rows.every((r) => selected[r.id]),
    [rows, selected]
  );
  const someSelected = useMemo(
    () => rows.some((r) => selected[r.id]) && !allSelected,
    [rows, selected, allSelected]
  );

  const filtered = useMemo(() => {
    if (!filter) return rows;
    const q = filter.toLowerCase();
    return rows.filter((r) => `${r.name} ${r.description ?? ""}`.toLowerCase().includes(q));
  }, [rows, filter]);

  const formatRelative = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} — ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  };

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        overflow: "hidden",
      }}
    >
      {showFilter && (
        <Box
          sx={{
            px: 3,
            py: 2,
            backgroundColor: "#FAFAFA",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
              {filtered.length} {filtered.length === 1 ? "dataset" : "datasets"}
            </Box>
            {selectedCount > 0 && onDelete && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<Trash2 size={14} />}
                onClick={() => {
                  const selectedIds = Object.keys(selected).filter(id => selected[id]);
                  onDelete(selectedIds);
                  setSelected({});
                }}
                sx={{ textTransform: "none", height: 28 }}
              >
                Delete {selectedCount}
              </Button>
            )}
          </Stack>
          <Box sx={{ position: "relative", width: 240 }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9CA3AF",
              }}
            />
            <TextField
              placeholder="Search datasets..."
              size="small"
              value={filter}
              onChange={(e) => onFilterChange?.(e.target.value)}
              sx={{
                width: "100%",
                "& .MuiOutlinedInput-root": {
                  height: 36,
                  backgroundColor: "#FFFFFF",
                  borderRadius: "6px",
                  "& fieldset": {
                    borderColor: "#D1D5DB",
                  },
                  "&:hover fieldset": {
                    borderColor: "#9CA3AF",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#13715B",
                    borderWidth: "1px",
                  },
                },
                "& .MuiInputBase-input": {
                  pl: 4.5,
                  fontSize: 13,
                  color: "#111827",
                  "&::placeholder": {
                    color: "#9CA3AF",
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>
        </Box>
      )}
      <Box sx={{ overflowX: "auto" }}>
        <Table
          size="small"
          sx={{
            minWidth: 800,
            "& .MuiTableCell-root": {
              borderBottom: "1px solid #F3F4F6",
              py: 1.5,
              px: 2,
            },
            "& thead": {
              borderBottom: "2px solid #E5E7EB",
            },
            "& thead th": {
              backgroundColor: "#FAFAFA",
              color: "#6B7280",
              fontWeight: 600,
              fontSize: "11px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              py: 1.25,
              px: 2,
              borderBottom: "2px solid #E5E7EB",
            },
            "& tbody tr": {
              transition: "background-color 0.15s ease",
              "&:hover": {
                backgroundColor: "#F9FAFB",
              },
            },
            "& .MuiTableCell-paddingCheckbox": {
              width: 48,
              pl: 2,
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={(e) => {
                    const next: Record<string, boolean> = {};
                    filtered.forEach((r) => (next[r.id] = e.target.checked));
                    setSelected(next);
                  }}
                  sx={{
                    color: "#D1D5DB",
                    "&.Mui-checked": {
                      color: "#13715B",
                    },
                    "&.MuiCheckbox-indeterminate": {
                      color: "#13715B",
                    },
                  }}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Prompts</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((row) => (
              <TableRow
                key={row.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => onOpenRow?.(row)}
              >
                <TableCell
                  padding="checkbox"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={!!selected[row.id]}
                    onChange={(e) => setSelected({ ...selected, [row.id]: e.target.checked })}
                    sx={{
                      color: "#D1D5DB",
                      "&.Mui-checked": {
                        color: "#13715B",
                      },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "6px",
                        backgroundColor: "#F3F4F6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Database size={16} style={{ color: "#6B7280" }} />
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#111827",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 400,
                      }}
                      title={row.name}
                    >
                      {row.name}
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell sx={{ fontSize: "13px", color: "#6B7280", maxWidth: 300 }}>
                  <Box
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={row.description}
                  >
                    {row.description ?? "—"}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: "13px", color: "#6B7280" }}>
                  {formatRelative(row.updated)}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: "13px", color: "#111827", fontWeight: 500 }}>
                  {row.prompts ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}


