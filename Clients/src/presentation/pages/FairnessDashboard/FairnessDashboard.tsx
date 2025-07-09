import { useState, useRef, useCallback, useMemo, useEffect, Suspense } from "react";
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
import { tabPanelStyle } from "../Vendors/style";
import Alert from "../../components/Alert";
import CustomizableToast from "../../vw-v2-components/Toast";

export type FairnessModel = {
  id: number | string; // Use number or string based on your backend response
  model: string;
  dataset: string;
  status: string;
  report?: string;
  action?: string; // Optional if you're not storing a real value
};

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
  const [showToastNotification, setShowToastNotification] = useState(false);

  const targetColumnItems = useMemo(() => {
    return columnOptions.map((col) => ({ _id: col, name: col }));
  }, [columnOptions]);
  
  const [page, setPage] = useState(0);
  
  
  const [uploadedModels, setUploadedModels] = useState<FairnessModel[]>([]);

  const fetchMetrics = async () => {
    try {
      const metrics = await fairnessService.getAllFairnessMetrics();

      if (!metrics || metrics.length === 0) {
        setUploadedModels([]);  // Show empty table
        return; // Don't raise error
      }
      
      const formatted = metrics.map((item: any) => ({
        id: item.metrics_id, // use this for "ID" column
        model: item.model_filename,
        dataset: item.data_filename,
        status: 'Completed', // Assuming all fetched metrics are completed
      }));
      setUploadedModels(formatted);
    } catch {
      setAlert({
        variant: "error",
        body: "Failed to fetch metrics. Please try again.",
      });
      setTimeout(() => setAlert(null), 8000);
    }
  };
  
  useEffect(() => {
    fetchMetrics();
  }, []);
  
  const buttonRef = useRef(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const datasetInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();


  const uploadFields: {
    label: string;
    accept: string;
    file: File | null;
    setFile: (file: File | null) => void;
    ref: React.RefObject<HTMLInputElement>;
    errorKey: 'modelFile' | 'datasetFile';
    }[] = [
        {
        label: 'model',
        accept: '.pkl',
        file: modelFile,
        setFile: setModelFile,
        ref: modelInputRef,
        errorKey: 'modelFile',
        },
        {
        label: 'dataset',
        accept: '.csv',
        file: datasetFile,
        setFile: setDatasetFile,
        ref: datasetInputRef,
        errorKey: 'datasetFile',
        },
    ];
  
  const FAIRNESS_COLUMNS = [
    { id: 'id', label: 'Check ID' },
    { id: 'model', label: 'Model' },
    { id: 'dataset', label: 'Dataset' },
    { id: 'status', label: 'Status' },
    { id: 'report', label: 'Report' },
    { id : 'action', label: 'Action'}
  ];
  
  const [errors, setErrors] = useState({
    modelFile: false,
    datasetFile: false,
    targetColumn: false,
    sensitiveColumn: false
  });
  

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
        setAlert({
            variant: "error",
            body: "Invalid model:" + model.id + "Please try again.",
          });
          setTimeout(() => setAlert(null), 8000);
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
    setErrors({
        modelFile: false,
        datasetFile: false,
        targetColumn: false,
        sensitiveColumn: false
    });
      
  };
  
  const confirmDelete = async (id: number) => {
    if (id === null) return;
    try {
      await fairnessService.deleteFairnessCheck(id);
      const filtered = uploadedModels.filter(model => model.id !== id);
      setUploadedModels(filtered);
    } catch {
        setAlert({
            variant: "error",
            body: "Failed to delete model. Please try again.",
          });
          setTimeout(() => setAlert(null), 8000);
    }
  };
  

  const handleSaveModel = async () => {
    const newErrors = {
        modelFile: !modelFile,
        datasetFile: !datasetFile,
        targetColumn: !targetColumn,
        sensitiveColumn: !sensitiveColumn
    };
    setErrors(newErrors);
    
    const hasError = Object.values(newErrors).some(Boolean);
    if (hasError) return;
    if (!modelFile || !datasetFile || !targetColumn || !sensitiveColumn) return;
  
    setShowToastNotification(true);
    try {
      await fairnessService.uploadFairnessFiles({
        model: modelFile,
        data: datasetFile,
        target_column: targetColumn,
        sensitive_column: sensitiveColumn,
      }, setUploadedModels);

      // await fetchMetrics(); // Refresh entire fairness model list with IDs
      resetForm();
    } catch {
        setAlert({
            variant: "error",
            body: "Failed to upload model. Please try again.",
          });
          setTimeout(() => setAlert(null), 8000);
    } finally{
        setShowToastNotification(false);
    }
  };

  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  

  return (
    <Stack className="vwhome" gap="20px">
      <Box>
        <Typography sx={styles.vwHeadingTitle}>Bias & fairness dashboard</Typography>
        <Typography sx={styles.vwSubHeadingTitle}>
        This table displays fairness evaluation results for your uploaded models. To evaluate a new model, upload the model along with its dataset, target column, and at least one sensitive feature. Only classification models are supported at the moment. Make sure your model includes preprocessing steps, such as an sklearn.Pipeline, and that the dataset is already formatted to match the model’s input requirements.
        </Typography>
      </Box>
      {alert && (
        <Suspense fallback={<div>Loading...</div>}>
            <Alert
            variant={alert.variant}
            title={alert.title}
            body={alert.body}
            isToast={true}
            onClick={() => setAlert(null)}
            />
        </Suspense>
        )}

      <TabContext value={tab}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            onChange={(_, newVal) => setTab(newVal)}
            TabIndicatorProps={{ style: { backgroundColor: "#13715B", height: "2px" } }}
            sx={styles.tabList}
          >
            <Tab label="Fairness checks" value="uploads" disableRipple sx={{textTransform: 'none !important'}}/>
          </TabList>
        </Box>

        <TabPanel value="uploads" sx={tabPanelStyle}>
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
                <Typography variant="body2">Click "Validate fairness" to start a new fairness validation.</Typography>
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
            onShowDetails={handleShowDetails}
            removeModel={{
                onConfirm: confirmDelete
              }}
            
          />
          

          <Dialog open={dialogOpen} onClose={resetForm} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                <Typography sx={{ fontWeight: 600 }}>Validate fairness</Typography>
                <Typography variant="body2" sx={{ fontSize: "13px", color: "#667085", mt: 0.5 }}>
                Ensure your model includes preprocessing steps, and your dataset is preprocessed in the same way before upload.
                </Typography>
                </Box>
                <IconButton onClick={resetForm}><CloseIcon /></IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                {uploadFields.map(({ label, accept, file, setFile, ref, errorKey }) => (
                  <Box key={label}>
                    <Typography sx={{ fontWeight: 500, mb: 0.5 , mt: 3}}>{`Upload ${label} (${accept})`}</Typography>
                    <Button
                      variant="outlined"
                      component="label"
                      sx={{ borderColor:  errors[errorKey] ? "#F04438" : "#13715B", 
                        color: "#13715B", 
                        textTransform: "none", 
                        fontWeight: 500, 
                        mb:5, 
                        borderOpacity: errors[errorKey] ? 0.8 : 1
                        }}
                    >
                      {`Choose ${label} file`}
                      <input
                        type="file"
                        hidden
                        accept={accept}
                        ref={ref}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setFile(file || null);
                          setErrors((prev) => ({ ...prev, [errorKey]: false }));
                            if (file && label === 'dataset') {
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
                        }
                      />
                    </Button>
                    <Typography
                      sx={{ 
                          fontWeight: 200, 
                          fontSize: "12px", 
                          color: "#667085",
                        }}
                      >
                      {`Max file size: 200MB`}</Typography>
                    {errors[errorKey] && (
                        <Typography fontSize={11} color="#F04438" sx={{ mt: 0.5, ml: 0, lineHeight: 1.5, opacity:0.8}}>
                        {`${label.charAt(0).toUpperCase() + label.slice(1)} file is required`}
                        </Typography>
                    )}
                    {file && (
                      <Box display="flex" alignItems="center" mt={1} px={1} py={0.5} border="1px solid #E5E7EB" borderRadius={1} justifyContent="space-between">
                        <Typography fontSize="14px">{file.name}</Typography>
                        <IconButton size="small" onClick={() => { setFile(null); if (ref.current) ref.current.value = ""; }}>{<CloseIcon fontSize="small" />}</IconButton>
                      </Box>
                    )}
                  </Box>
                ))}
                <Box sx={{mb: 5}}>
                    <Select 
                        id="target-column"
                        label="Target column"
                        placeholder="Select target"
                        value={targetColumn}
                        items={targetColumnItems}
                        onChange={(e) => {
                            setTargetColumn(e.target.value as string);
                            setErrors((prev) => ({ ...prev, targetColumn: false }));
                        }}
                        error={errors.targetColumn ? "Target column is required" : ""}
                        sx={{ mb: 1 }}
                    />
                </Box>
                
                <Box sx={{mb: 5}}>
                <Select
                    id="sensitive-column"
                    label="Sensitive column"
                    placeholder="Select sensitive feature"
                    value={sensitiveColumn}
                    items={targetColumnItems}
                    onChange={(e) => {
                        setSensitiveColumn(e.target.value as string);
                        setErrors((prev) => ({ ...prev, sensitiveColumn: false }));
                      }}
                    error={errors.sensitiveColumn ? "Sensitive column is required" : ""}
                    sx={{ mb: 1 }}
                />
                </Box>


                <Box display="flex" justifyContent="flex-end">
                  <Button variant="contained" sx={{ backgroundColor: "#13715B", color: "white", textTransform: "none", mt: 8 }} onClick={handleSaveModel}>Upload</Button>
                </Box>
              </Stack>
            </DialogContent>
          </Dialog>
        </TabPanel>
      </TabContext>
      {showToastNotification && (
        <CustomizableToast title="Uploading the model. Please wait, this process may take some time..." />
      )}
    </Stack>
  );
}
