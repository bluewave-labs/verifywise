/**
 * This file is currently in use
 */

import {
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import singleTheme from "../../../themes/v1SingleTheme";
import { getEntityById } from "../../../../application/repository/entity.repository";
import { Control } from "../../../../domain/Control";
import VWSkeleton from "../../../vw-v2-components/Skeletons";
import NewControlPane from "../../../components/Modals/Controlpane/NewControlPane";

const cellStyle = {
  ...singleTheme.tableStyles.primary.body.row,
  height: "36px",
  "&:hover": {
    backgroundColor: "#FBFBFB",
    cursor: "pointer",
  },
};

interface Column {
  name: string;
}

interface ControlsTableProps {
  controlCategoryId: number;
  controlCategoryIndex: number;
  columns: Column[];
}

const ControlsTable: React.FC<ControlsTableProps> = ({
  controlCategoryId,
  controlCategoryIndex,
  columns,
}) => {
  const theme = useTheme();
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRowClick = (id: number) => {
    setSelectedRow(id);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRow(null);
  };

  useEffect(() => {
    const fetchControls = async () => {
      try {
        const response = await getEntityById({
          routeUrl: `/controls/all/bycategory/${controlCategoryId}`,
        });
        setControls(response.data);
        console.log("first control: ", controls);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchControls();
  }, [controlCategoryId]);

  const getProgressColor = useCallback((value: number) => {
    if (value <= 10) return "#FF4500"; // 0-10%
    if (value <= 20) return "#FF4500"; // 11-20%
    if (value <= 30) return "#FFA500"; // 21-30%
    if (value <= 40) return "#FFD700"; // 31-40%
    if (value <= 50) return "#E9F14F"; // 41-50%
    if (value <= 60) return "#CDDD24"; // 51-60%
    if (value <= 70) return "#64E730"; // 61-70%
    if (value <= 80) return "#32CD32"; // 71-80%
    if (value <= 90) return "#228B22"; // 81-90%
    return "#008000"; // 91-100%
  }, []);

  if (loading) {
    return (
      <Stack spacing={2}>
        <VWSkeleton variant="rectangular" width="100%" height={36} />
        <VWSkeleton variant="rectangular" width="100%" height={36} />
        <VWSkeleton variant="rectangular" width="100%" height={36} />
      </Stack>
    );
  }

  if (error) {
    return <div>Error loading controls</div>;
  }

  return (
    <TableContainer className="controls-table-container">
      <Table className="controls-table">
        <TableHead
          sx={{
            backgroundColors:
              singleTheme.tableStyles.primary.header.backgroundColors,
          }}
        >
          <TableRow>
            {columns.map((col: Column, index: number) => (
              <TableCell
                key={index}
                sx={singleTheme.tableStyles.primary.header.cell}
              >
                {col.name}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {controls
            .sort((a, b) => (a.order_no ?? 0) - (b.order_no ?? 0))
            .map((control: Control) => (
              <TableRow
                key={control.id}
                sx={cellStyle}
                onClick={() =>
                  control.id !== undefined && handleRowClick(control.id)
                }
              >
                {modalOpen && selectedRow === control.id && (
                  <NewControlPane
                    data={control}
                    isOpen={modalOpen}
                    handleClose={handleCloseModal} // Ensure handleCloseModal is passed correctly
                    OnSave={() => {
                      console.log("Save clicked");
                    }}
                    controlCategoryId={control.order_no?.toString()}
                  />
                )}
                <TableCell
                  sx={cellStyle}
                  key={`${controlCategoryId}-${control.id}`}
                >
                  {controlCategoryIndex}.{`${control.order_no}`} {control.title}{" "}
                  {`(${control.description}`.substring(0, 20) + `...)`}
                </TableCell>
                <TableCell sx={cellStyle} key={`owner-${control.id}`}>
                  {control.owner ? control.owner : "Not set"}
                </TableCell>
                <TableCell sx={cellStyle} key={`noOfSubControls-${control.id}`}>
                  {`${control.numberOfSubcontrols} Subcontrols`}
                </TableCell>
                <TableCell sx={cellStyle} key={`completion-${control.id}`}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2">
                      {`${
                        control.numberOfSubcontrols
                          ? (
                              control.numberOfDoneSubcontrols! /
                              control.numberOfSubcontrols
                            ).toFixed(2)
                          : "0"
                      }%`}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={
                        control.numberOfSubcontrols
                          ? ((control.numberOfDoneSubcontrols ?? 0) /
                              control.numberOfSubcontrols) *
                            100
                          : 0
                      }
                      sx={{
                        width: "100px",
                        height: "5px",
                        borderRadius: "4px",
                        backgroundColor: theme.palette.grey[200],
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: getProgressColor(
                            control.numberOfSubcontrols
                              ? ((control.numberOfDoneSubcontrols ?? 0) /
                                  control.numberOfSubcontrols) *
                                  100
                              : 0
                          ),
                        },
                      }}
                    />
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ControlsTable;
