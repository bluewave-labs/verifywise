import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Popover,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  InputLabel,
  MenuItem,
  Select,
  IconButton
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import Tab from "@mui/material/Tab";
import { styles } from "./styles";
import { useNavigate } from "react-router-dom";

export default function FairnessDashboard() {
  const [tab, setTab] = useState("uploads");
  const [anchorEl, setAnchorEl] = useState(null);
  const [showBackdrop, setShowBackdrop] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modelFile, setModelFile] = useState(null);
  const [datasetFile, setDatasetFile] = useState(null);
  const [targetColumn, setTargetColumn] = useState("");
  const [sensitiveColumn, setSensitiveColumn] = useState("");
  const [columnOptions, setColumnOptions] = useState([]);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  const handleDotClick = () => {
    if (hasInteracted) return;
    setAnchorEl(buttonRef.current);
    setShowBackdrop(true);
    setHasInteracted(true);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setShowBackdrop(false);
  };

  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  const handleModelUpload = (e) => {
    setModelFile(e.target.files[0]);
  };

  const handleDatasetUpload = (e) => {
    const file = e.target.files[0];
    setDatasetFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const firstLine = text.split("\n")[0];
      const columns = firstLine.split(",").map((col) => col.trim());
      setColumnOptions(columns);
    };
    reader.readAsText(file);
  };

  const handleSaveModel = () => {
    if (!modelFile || !datasetFile || !targetColumn || !sensitiveColumn) return;
    console.log("Model saved:", {
      modelFile,
      datasetFile,
      targetColumn,
      sensitiveColumn,
    });
    setDialogOpen(false);
  };

  const modelEntries = [
    { name: "InsuranceTracker", date: "5 May 2025", status: "Pending" },
    { name: "StockPickerBot", date: "19 April 2025", status: "Completed" },
  ];

  return (
    <Stack className="vwhome" gap="20px">
      <Box>
        <Typography sx={styles.vwHeadingTitle}>Bias and Fairness Dashboard</Typography>
        <Typography sx={styles.vwSubHeadingTitle}>
          View previously validated fairness checks or create a new one.
        </Typography>
      </Box>

      <TabContext value={tab}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            onChange={(e, newVal) => setTab(newVal)}
            aria-label="Fairness Tabs"
            TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
          >
            <Tab
              label={
                <Typography
                  sx={{
                    textTransform: "none",
                    color: tab === "uploads" ? "#13715B" : "#000",
                    fontWeight: tab === "uploads" ? 600 : 500,
                  }}
                >
                  Uploads
                </Typography>
              }
              value="uploads"
            />
          </TabList>
        </Box>

        <TabPanel value="uploads" sx={{ px: 0 }}>
          <Box display="flex" justifyContent="flex-end" mb={3} position="relative">
            <Button
              ref={buttonRef}
              variant="contained"
              size="medium"
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleOpenDialog}
              sx={{
                backgroundColor: "#13715B",
                color: "white",
                textTransform: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
                padding: "6px 16px",
                borderRadius: 2,
                fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
                lineHeight: 1.75,
                minWidth: "64px",
                position: "relative",
                zIndex: 2,
                "&:hover": {
                  backgroundColor: "#0f604d",
                },
              }}
            >
              Add Model
            </Button>
            {!hasInteracted && (
              <Box
                onClick={handleDotClick}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "#1976d2",
                  position: "absolute",
                  top: -8,
                  right: -8,
                  cursor: "pointer",
                  zIndex: 3,
                  animation: "pulse 1.5s infinite",
                  "@keyframes pulse": {
                    "0%": { transform: "scale(0.8)", opacity: 1 },
                    "100%": { transform: "scale(2.4)", opacity: 0 },
                  },
                }}
              />
            )}
            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={handlePopoverClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              disableRestoreFocus
            >
              <Box sx={{ p: 2, maxWidth: 300 }}>
                <Typography variant="body2">
                  Click " Model" to start a new fairness validation.
                </Typography>
              </Box>
            </Popover>
            <Backdrop
              open={showBackdrop}
              sx={{ zIndex: 1, backgroundColor: "rgba(0, 0, 0, 0.3)" }}
              onClick={handlePopoverClose}
            />
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Last Updated</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modelEntries.map((entry, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.status}</TableCell>
                    <TableCell align="right">
                        <Button
                        variant="outlined"
                        onClick={() => navigate(`/fairness-dashboard/${entry.name}`)}
                        sx={{
                            textTransform: "none",
                            fontWeight: 500,
                            fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
                        }}
                        >
                        Show Details
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontWeight: 600 }}>Validate Fairness</Typography>
                <IconButton onClick={handleCloseDialog}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Box>
                  <InputLabel sx={{ color: "black" }}>Upload Model (.pkl)</InputLabel>
                  <TextField
                    type="file"
                    fullWidth
                    variant="outlined"
                    slotProps={{
                      htmlInput: {
                        accept: ".pkl",
                        onChange: handleModelUpload,
                      },
                    }}
                  />
                </Box>

                <Box>
                  <InputLabel sx={{ color: "black" }}>Upload Dataset (.csv)</InputLabel>
                  <TextField
                    type="file"
                    fullWidth
                    variant="outlined"
                    slotProps={{
                      htmlInput: {
                        accept: ".csv",
                        onChange: handleDatasetUpload,
                      },
                    }}
                  />
                </Box>

                <Box>
                  <InputLabel sx={{ color: "black" }}>Target Column</InputLabel>
                  <Select
                    fullWidth
                    value={targetColumn}
                    onChange={(e) => setTargetColumn(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">-- Select --</MenuItem>
                    {columnOptions.map((col, idx) => (
                      <MenuItem key={idx} value={col}>{col}</MenuItem>
                    ))}
                  </Select>
                </Box>

                <Box>
                  <InputLabel sx={{ color: "black" }}>Sensitive Column</InputLabel>
                  <Select
                    fullWidth
                    value={sensitiveColumn}
                    onChange={(e) => setSensitiveColumn(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">-- Select --</MenuItem>
                    {columnOptions.map((col, idx) => (
                      <MenuItem key={idx} value={col}>{col}</MenuItem>
                    ))}
                  </Select>
                </Box>

                <Box display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: "#13715B", color: "white", textTransform: "none" }}
                    onClick={handleSaveModel}
                  >
                    Upload
                  </Button>
                </Box>
              </Stack>
            </DialogContent>
          </Dialog>
        </TabPanel>
      </TabContext>
    </Stack>
  );
}
