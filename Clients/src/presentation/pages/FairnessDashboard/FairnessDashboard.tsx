import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  Popover,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  InputLabel,
  MenuItem,
  SelectChangeEvent,
  IconButton
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import Tab from "@mui/material/Tab";
import { styles } from "./styles";
import { useNavigate } from "react-router-dom";
import FairnessTable from "../../components/Table/FairnessTable";
import Select from "../../components/Inputs/Select";
import { fairnessService } from "../../../infrastructure/api/fairnessService";


export default function FairnessDashboard() {
  const [tab, setTab] = useState("uploads");
  const [anchorEl, setAnchorEl] = useState(null);
  const [showBackdrop, setShowBackdrop] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [targetColumn, setTargetColumn] = useState("");
  const [sensitiveColumn, setSensitiveColumn] = useState("");
  const [columnOptions, setColumnOptions] = useState<string[]>([]);
  const targetColumnItems = useMemo(() => {
    return columnOptions.map((col) => ({ _id: col, name: col }));
  }, [columnOptions]);
  
  const [page, setPage] = useState(0);

  type FairnessModel = {
    id: number;
    model: string;
    dataset: string;
    status: string;
    action?: string; // Optional if you're not storing a real value
  };
  
  
  const [uploadedModels, setUploadedModels] = useState<FairnessModel[]>([]);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const metrics = await fairnessService.getAllFairnessMetrics();
        const formatted = metrics.map((item: any) => ({
          id: item.metrics_id, // use this for "ID" column
          model: item.model_filename,
          dataset: item._data_filename,
          status: "Pending" 
        }));
        setUploadedModels(formatted);
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
      }
    };
  
    fetchMetrics();
  }, []);
  
  

  const buttonRef = useRef(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const datasetInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();


  const FAIRNESS_COLUMNS = [
    { id: 'id', label: 'Check ID' },
    { id: 'model', label: 'Model' },
    { id: 'dataset', label: 'Dataset' },
    { id: 'status', label: 'Status' },
    { id : 'action', label: 'Action'}
  ];
  


  const handleDotClick = () => {
    if (hasInteracted) return;
    setAnchorEl(buttonRef.current);
    setShowBackdrop(true);
    setHasInteracted(true);
  };


  const handleShowDetails = useCallback((model: FairnessModel) => {
    if (model?.id) {
      navigate(`/fairness-results/${model.id}`);
    } else {
      console.error("Invalid model:", model);
    }
  }, [navigate]);
    

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setShowBackdrop(false);
  };

  const resetForm = () => {
    setDialogOpen(false);
    setModelFile(null);
    setDatasetFile(null);
    setColumnOptions([]);
    setTargetColumn("");
    setSensitiveColumn("");
    if (modelInputRef.current) modelInputRef.current.value = "";
    if (datasetInputRef.current) datasetInputRef.current.value = "";
  };

  const handleRemoveModel = (idToRemove: number) => {
    const filtered = uploadedModels.filter(model => model.id !== idToRemove);
    setUploadedModels(filtered);
  };

  const handleSaveModel = async () => {
    if (!modelFile || !datasetFile || !targetColumn || !sensitiveColumn) return;
  
    try {
      const result = await fairnessService.uploadFairnessFiles({
        model: modelFile,
        data: datasetFile,
        target_column: targetColumn,
        sensitive_column: sensitiveColumn,
      });
  
      
  
      const newEntry: FairnessModel = {
        id: result.id,
        model: result.name || modelFile.name,
        dataset: datasetFile.name,
        status: result.status || "Pending",
      };
  
      setUploadedModels(prev => [...prev, newEntry]);
      resetForm();
    } catch (err) {
      console.error("Failed to upload model:", err);
    }
  };
  

  return (
    <Stack className="vwhome" gap="20px">
      <Box>
        <Typography sx={styles.vwHeadingTitle}>Bias & fairness dashboard</Typography>
        <Typography sx={styles.vwSubHeadingTitle}>
        This table provides your uploaded models with access to fairness evaluations for each. You can also validate a new model by uploading the model along with its dataset, target column, and sensitive feature.
        </Typography>
      </Box>

      <TabContext value={tab}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            onChange={(e, newVal) => setTab(newVal)}
            TabIndicatorProps={{ style: { backgroundColor: "#13715B", height: "2px" } }}
            sx={{
              minHeight: "24px",
              "& .MuiTabs-flexContainer": { gap: "24px" },
              "& .MuiTab-root": {
                minHeight: "32px",
                padding: 0,
                fontSize: "13px",
                fontWeight: 500,
                textTransform: "capitalize",
                color: "#4B5563",
                fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
                width: "fit-content",
                minWidth: "unset",
              },
              "& .MuiTab-root.Mui-selected": {
                color: "#13715B !important",
                display: "table",
                minWidth: "unset",
                width: "fit-content",
                paddingLeft: 0,
                paddingRight: 0,
              },
            }}
          >
            <Tab label="Fairness checks" value="uploads" disableRipple />
          </TabList>
        </Box>

        <TabPanel value="uploads" sx={{ px: 0 }}>
          <Box display="flex" justifyContent="flex-end" mb={3} position="relative">
            <Button
              ref={buttonRef}
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => setDialogOpen(true)}
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
                "&:hover": { backgroundColor: "#0f604d" },
              }}
            >
              Validate fairness
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
                <Typography variant="body2">Click "Model" to start a new fairness validation.</Typography>
              </Box>
            </Popover>
            <Backdrop
              open={showBackdrop}
              sx={{ zIndex: 1, backgroundColor: "rgba(0, 0, 0, 0.3)" }}
              onClick={handlePopoverClose}
            />
          </Box>

          <FairnessTable
            columns={FAIRNESS_COLUMNS.map(col => col.label)}
            rows={uploadedModels}
            page={page}
            setCurrentPagingation={setPage}
            removeModel={handleRemoveModel}
            onShowDetails={handleShowDetails}
          />
          

          <Dialog open={dialogOpen} onClose={resetForm} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontWeight: 600 }}>Validate Fairness</Typography>
                <IconButton onClick={resetForm}><CloseIcon /></IconButton>
              </Box>
            </DialogTitle>

            <DialogContent>
              <Stack spacing={2}>
                {[{ label: 'model', accept: '.pkl', file: modelFile, setFile: setModelFile, ref: modelInputRef }, { label: 'dataset', accept: '.csv', file: datasetFile, setFile: setDatasetFile, ref: datasetInputRef }].map(({ label, accept, file, setFile, ref }) => (
                  <Box key={label}>
                    <Typography sx={{ fontWeight: 500, mb: 0.5 , mt: 3}}>{`Upload ${label} (${accept})`}</Typography>
                    <Button
                      variant="outlined"
                      component="label"
                      sx={{ borderColor: "#13715B", color: "#13715B", textTransform: "none", fontWeight: 500, mb:5, '&:hover': { borderColor: "#0f5f4b", backgroundColor: "#F3F9F8" } }}
                    >
                      {`Choose ${label} file`}
                      <input
                        type="file"
                        hidden
                        accept={accept}
                        ref={ref}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFile(file);
                            if (label === 'dataset') {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const text = event.target?.result as string;
                                const firstLine = text.split("\n")[0];
                                const columns = firstLine.split(",").map((col) => col.trim());
                                setColumnOptions(columns);
                              };
                              reader.readAsText(file);
                            }
                          }
                        }}
                      />
                    </Button>
                    {file && (
                      <Box display="flex" alignItems="center" mt={1} px={1} py={0.5} border="1px solid #E5E7EB" borderRadius={1} justifyContent="space-between">
                        <Typography fontSize="14px">{file.name}</Typography>
                        <IconButton size="small" onClick={() => { setFile(null); if (ref.current) ref.current.value = ""; }}>{<CloseIcon fontSize="small" />}</IconButton>
                      </Box>
                    )}
                  </Box>
                ))}
                
                
                <Select 
                    id="target-column"
                    label="Target column"
                    placeholder="Select target"
                    value={targetColumn}
                    items={targetColumnItems}
                    onChange={(e) => setTargetColumn(e.target.value)}
                />

                <Select
                    id="sensitive-column"
                    label="Sensitive column"
                    placeholder="Select senstive feature"
                    value={sensitiveColumn}
                    items={targetColumnItems}
                    onChange={(e) => setSensitiveColumn(e.target.value)}
                />

                <Box display="flex" justifyContent="flex-end">
                  <Button variant="contained" sx={{ backgroundColor: "#13715B", color: "white", textTransform: "none", mt: 8 }} onClick={handleSaveModel}>Upload</Button>
                </Box>
              </Stack>
            </DialogContent>
          </Dialog>
        </TabPanel>
      </TabContext>
    </Stack>
  );
}
