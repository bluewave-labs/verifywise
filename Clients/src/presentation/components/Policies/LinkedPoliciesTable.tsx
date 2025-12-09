/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import { RiskModel } from "../../../domain/models/Common/risks/risk.model";
import { useUserMap } from "../../../presentation/hooks/userMap";

interface LinkedObjectsTableProps {
  items: any[];
  type: "control" | "risk" | "evidence";
  onRemove: (type: string, id: number) => void;
  projectRisk: RiskModel[];
}

type SortKey = "name" | "created_by" | "due_date" | null;
type SortDirection = "asc" | "desc" | null;

const LinkedObjectsTable: React.FC<LinkedObjectsTableProps> = ({
  items,
  type,
  onRemove,
  projectRisk,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  console.log("items",items)

  const { userMap } = useUserMap();

  const mergedItems = useMemo(() => {
    if (!projectRisk || projectRisk.length === 0) return items;
  
    return items.map((linked) => {
      // find the full risk info from projectRisk
      const fullRisk = projectRisk.find((r) => r.id === linked.object_id);
  
      return {
        id: linked.id, // linked object id for remove
        name: fullRisk?.risk_name || "-", 
        created_by: fullRisk?.risk_owner
        ? userMap.get(String(fullRisk.risk_owner)) || "-"
        : "-",
        due_date: fullRisk?.deadline || "-",
      };
    });
  }, [items, projectRisk, userMap]);

  console.log("mergedItems", mergedItems)
  

  // ---------- HANDLE SORT CLICK ----------
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // Toggle asc -> desc -> none
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // ---------- SORTED DATA ----------
  const sortedItems = useMemo(() => {
    if (!sortKey || !sortDirection) return mergedItems;
  
    return [...mergedItems].sort((a, b) => {
      let aVal = "";
      let bVal = "";
  
      if (sortKey === "name") {
        aVal = a.name || "";
        bVal = b.name || "";
      } else if (sortKey === "created_by") {
        aVal = a.created_by_name || "";
        bVal = b.created_by_name || "";
      } else if (sortKey === "due_date") {
        aVal = a.due_date || "";
        bVal = b.due_date || "";
      }
  
      const compare = aVal.localeCompare(bVal);
      return sortDirection === "asc" ? compare : -compare;
    });
  }, [mergedItems, sortKey, sortDirection]);
  

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ChevronsUpDown size={16} />;

    if (sortDirection === "asc") return <ChevronUp size={16} />;
    if (sortDirection === "desc") return <ChevronDown size={16} />;

    return <ChevronsUpDown size={16} />;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
    // or use "en-US" for MM/DD/YYYY
  };
  

  return (
    <Box>
      <TableContainer sx={{ border: "1px solid #E6E6E6", borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{ cursor: "pointer" }}
                onClick={() => handleSort("name")}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  {type.toUpperCase()} NAME
                  {renderSortIcon("name")}
                </Box>
              </TableCell>

              <TableCell>TYPE</TableCell>

              <TableCell
                sx={{ cursor: "pointer" }}
                onClick={() => handleSort("created_by")}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  CREATED BY
                  {renderSortIcon("created_by")}
                </Box>
              </TableCell>

              <TableCell
                sx={{ cursor: "pointer" }}
                onClick={() => handleSort("due_date")}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  DUE DATE
                  {renderSortIcon("due_date")}
                </Box>
              </TableCell>

              <TableCell></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <EmptyState message={`No ${type} linked.`} />
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{type}</TableCell>
                  <TableCell>{item.created_by.toString() || "-"}</TableCell>
                  <TableCell>{formatDate(item.due_date)}</TableCell>

                  <TableCell>
                    <Tooltip title="Remove link">
                      <IconButton size="small" onClick={() => onRemove(type, item.id)}>
                        <Trash2 size={18} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default LinkedObjectsTable;
