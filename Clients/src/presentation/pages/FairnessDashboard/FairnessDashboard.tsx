import {
  useState,
  Suspense,
} from "react";
import {
  Box,
  Stack,
} from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import Tab from "@mui/material/Tab";
import { styles } from "./styles";
import { tabPanelStyle } from "../Vendors/style";
import Alert from "../../components/Alert";
import HelperDrawer from "../../components/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import BiasAndFairnessModule from "./BiasAndFairnessModule";
import PageHeader from "../../components/Layout/PageHeader";
import PageTour from "../../components/PageTour";
import BiasAndFairnessSteps from "./BiasAndFairnessSteps";
//import { FairnessModel } from "../../../domain/models/Common/biasFramework/biasFramework.model";

export default function FairnessDashboard() {
  const [tab, setTab] = useState(() => {
    // Check URL hash to determine initial tab
    const hash = window.location.hash;
    if (hash === "#biasModule") {
      return "biasModule";
    }
    if (hash === "#deepeval") {
      return "deepeval";
    }
    // Default to biasModule since ML evaluator (uploads) is commented out
    return "biasModule";
  });
  // Commented out - related to ML evaluator tab
  // const [dialogOpen, setDialogOpen] = useState(false);
  // const [modelFile, setModelFile] = useState<File | null>(null);
  // const [datasetFile, setDatasetFile] = useState<File | null>(null);
  // const [targetColumn, setTargetColumn] = useState("");
  // const [sensitiveColumn, setSensitiveColumn] = useState("");
  // const [showToastNotification, setShowToastNotification] = useState(false);

  // Commented out - related to ML evaluator tab
  // const [uploadedModels, setUploadedModels] = useState<FairnessModel[]>([]);

  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  // Commented out - related to ML evaluator tab
  // const fetchMetrics = async () => {
  //   try {
  //     const metrics = await fairnessService.getAllFairnessMetrics();

  //     if (!metrics || metrics.length === 0) {
  //       setUploadedModels([]); // Show empty table
  //       return; // Don't raise error
  //     }

  //     const formatted = metrics.map(
  //       (item: {
  //         metrics_id: number | string;
  //         model_filename: string;
  //         data_filename: string;
  //       }) => ({
  //         id: item.metrics_id, // use this for "ID" column
  //         model: item.model_filename,
  //         dataset: item.data_filename,
  //         status: "Completed", // Assuming all fetched metrics are completed
  //       })
  //     );
  //     setUploadedModels(formatted);
  //   } catch {
  //     setAlert({
  //       variant: "error",
  //       body: "Failed to fetch metrics. Please try again.",
  //     });
  //     setTimeout(() => setAlert(null), 8000);
  //   }
  // };

  // useEffect(() => {
  //   fetchMetrics();
  // }, []);

  // Commented out - related to ML evaluator tab
  // const modelInputRef = useRef<HTMLInputElement>(null);
  // const datasetInputRef = useRef<HTMLInputElement>(null);
  // const navigate = useNavigate();

  // Commented out - related to ML evaluator tab
  // const uploadFields: {
  //   label: string;
  //   accept: string;
  //   file: File | null;
  //   setFile: (file: File | null) => void;
  //   ref: React.RefObject<HTMLInputElement>;
  //   errorKey: "modelFile" | "datasetFile";
  // }[] = [
  //   {
  //     label: "model",
  //     accept: ".pkl",
  //     file: modelFile,
  //     setFile: setModelFile,
  //     ref: modelInputRef,
  //     errorKey: "modelFile",
  //   },
  //   {
  //     label: "dataset",
  //     accept: ".csv",
  //     file: datasetFile,
  //     setFile: setDatasetFile,
  //     ref: datasetInputRef,
  //     errorKey: "datasetFile",
  //   },
  // ];

  // const FAIRNESS_COLUMNS = [
  //   { id: "id", label: "Check ID" },
  //   { id: "model", label: "Model" },
  //   { id: "dataset", label: "Dataset" },
  //   { id: "status", label: "Status" },
  //   { id: "report", label: "Report" },
  //   { id: "action", label: "Action" },
  // ];

  // const [errors, setErrors] = useState({
  //   modelFile: false,
  //   datasetFile: false,
  //   targetColumn: false,
  //   sensitiveColumn: false,
  // });

  // Commented out - related to ML evaluator tab
  // const handleShowDetails = useCallback(
  //   (model: FairnessModel) => {
  //     if (model?.id) {
  //       navigate(`/fairness-results/${model.id}`);
  //     } else {
  //       setAlert({
  //         variant: "error",
  //         body: "Invalid model:" + model.id + "Please try again.",
  //       });
  //       setTimeout(() => setAlert(null), 8000);
  //     }
  //   },
  //   [navigate]
  // );

  // Commented out - related to ML evaluator tab
  // const resetForm = () => {
  //   setDialogOpen(false);
  //   setModelFile(null);
  //   setDatasetFile(null);
  //   setColumnOptions([]);
  //   setTargetColumn("");
  //   setSensitiveColumn("");
  //   if (modelInputRef.current) modelInputRef.current.value = "";
  //   if (datasetInputRef.current) datasetInputRef.current.value = "";
  //   setErrors({
  //     modelFile: false,
  //     datasetFile: false,
  //     targetColumn: false,
  //     sensitiveColumn: false,
  //   });
  // };

  // const confirmDelete = async (id: number) => {
  //   if (id === null) return;
  //   try {
  //     await fairnessService.deleteFairnessCheck(id);
  //     const filtered = uploadedModels.filter((model) => model.id !== id);
  //     setUploadedModels(filtered);
  //   } catch {
  //     setAlert({
  //       variant: "error",
  //       body: "Failed to delete model. Please try again.",
  //     });
  //     setTimeout(() => setAlert(null), 8000);
  //   }
  // };

  // const handleSaveModel = async () => {
  //   const newErrors = {
  //     modelFile: !modelFile,
  //     datasetFile: !datasetFile,
  //     targetColumn: !targetColumn,
  //     sensitiveColumn: !sensitiveColumn,
  //   };
  //   setErrors(newErrors);

  //   const hasError = Object.values(newErrors).some(Boolean);
  //   if (hasError) return;
  //   if (!modelFile || !datasetFile || !targetColumn || !sensitiveColumn) return;

  //   setShowToastNotification(true);
  //   try {
  //     await fairnessService.uploadFairnessFiles(
  //       {
  //         model: modelFile,
  //         data: datasetFile,
  //         target_column: targetColumn,
  //         sensitive_column: sensitiveColumn,
  //       },
  //       setUploadedModels
  //     );

  //     // await fetchMetrics(); // Refresh entire fairness model list with IDs
  //     resetForm();
  //   } catch {
  //     setAlert({
  //       variant: "error",
  //       body: "Failed to upload model. Please try again.",
  //     });
  //     setTimeout(() => setAlert(null), 8000);
  //   } finally {
  //     setShowToastNotification(false);
  //   }
  // };

  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  // Commented out - related to ML evaluator tab
  // useModalKeyHandling({
  //   isOpen: dialogOpen,
  //   onClose: () => resetForm(),
  // });

  return (
    <Stack className="vwhome" gap="20px">
      <PageBreadcrumbs />
      <HelperDrawer
        open={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(false)}
        title="Bias & fairness assessment"
        description="Evaluate AI models for bias and ensure fairness across different demographic groups"
        whatItDoes="Analyze your *AI models* for potential bias using *comprehensive fairness metrics* and *bias detection algorithms*. Upload models and datasets to perform *automated fairness evaluations* across *sensitive attributes*."
        whyItMatters="*Biased AI systems* can perpetuate *discrimination* and cause harm to individuals and communities. Fairness assessment helps ensure *equitable outcomes* and maintains trust in AI systems while meeting *regulatory compliance* requirements."
        quickActions={[
          {
            label: "Upload Model for Assessment",
            description:
              "Submit a classification model with dataset for comprehensive bias evaluation",
            primary: true,
          },
          {
            label: "Run Fairness Analysis",
            description:
              "Execute advanced bias detection using the BiasAndFairnessModule",
          },
        ]}
        useCases={[
          "*Hiring and recruitment models* requiring *equal opportunity compliance*",
          "*Credit scoring* and financial services models subject to *fair lending regulations*",
        ]}
        keyFeatures={[
          "**Multiple fairness metrics** including *demographic parity* and *equalized odds*",
          "*Support for classification models* with *sklearn Pipeline* compatibility",
          "*Comprehensive bias reporting* with *actionable recommendations* for model improvement",
        ]}
        tips={[
          "Test models with *diverse datasets* representing your *target population*",
          "Focus on *sensitive attributes* relevant to your specific use case and *regulatory requirements*",
          "*Regular fairness audits* should be part of your *model maintenance lifecycle*",
        ]}
      />
      <Box>
        <PageHeader
          title="Bias & fairness dashboard"
          description="Comprehensive AI model evaluation platform for bias detection, fairness assessment, and performance analysis. Configure evaluation parameters to analyze model behavior across protected attributes with multiple fairness metrics and bias detection methods."
          rightContent={
            <HelperIcon
              onClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
              size="small"
            />
          }
        />
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
        <Box
          sx={{ borderBottom: 1, borderColor: "divider" }}
          data-joyride-id="fairness-tabs"
        >
          <TabList
            onChange={(_, newVal) => setTab(newVal)}
            TabIndicatorProps={{
              style: { backgroundColor: "#13715B", height: "2px" },
            }}
            sx={styles.tabList}
          >
            {/* <Tab
              label="ML evaluator"
              value="uploads"
              disableRipple
              sx={{ textTransform: "none !important" }}
            /> */}
            <Tab
              label="LLM evaluator"
              value="biasModule"
              disableRipple
              sx={{ textTransform: "none !important" }}
            />
          </TabList>
        </Box>

        {/* <TabPanel value="uploads" sx={tabPanelStyle}>
          <Box display="flex" justifyContent="flex-end" mb={3}>
            <CustomizableButton
              variant="contained"
              icon={<AddCircleOutlineIcon size={16} />}
              onClick={() => setDialogOpen(true)}
              text="Validate fairness"
              testId="validate-fairness-button"
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 3,
              }}
            />
          </Box>

          <FairnessTable
            columns={FAIRNESS_COLUMNS.map((col) => col.label)}
            rows={uploadedModels}
            page={page}
            setCurrentPagingation={setPage}
            onShowDetails={handleShowDetails}
            removeModel={{
              onConfirm: confirmDelete,
            }}
          />

          <Dialog
            open={dialogOpen}
            onClose={(_event, reason) => {
              if (reason !== "backdropClick") {
                resetForm();
              }
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>
                    Validate fairness
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: "13px", color: "#667085", mt: 0.5 }}
                  >
                    Ensure your model includes preprocessing steps, and your
                    dataset is preprocessed in the same way before upload.
                  </Typography>
                </Box>
                <IconButton onClick={resetForm}>
                  <CloseGreyIcon size={16} />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                {uploadFields.map(
                  ({ label, accept, file, setFile, ref, errorKey }) => (
                    <Box key={label}>
                      <Typography
                        sx={{ fontWeight: 500, mb: 0.5, mt: 3 }}
                      >{`Upload ${label} (${accept})`}</Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        sx={{
                          borderColor: errors[errorKey] ? "#F04438" : "#13715B",
                          color: "#13715B",
                          textTransform: "none",
                          fontWeight: 500,
                          mb: 5,
                          borderOpacity: errors[errorKey] ? 0.8 : 1,
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
                            setErrors((prev) => ({
                              ...prev,
                              [errorKey]: false,
                            }));
                            if (file && label === "dataset") {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const text = event.target?.result as string;
                                const firstLine = text.split("\n")[0];
                                const columns = firstLine
                                  .split(",")
                                  .map((col) => col.trim());
                                setColumnOptions(columns);
                              };
                              reader.readAsText(file);
                            }
                          }}
                        />
                      </Button>
                      <Typography
                        sx={{
                          fontWeight: 200,
                          fontSize: "12px",
                          color: "#667085",
                        }}
                      >
                        {`Max file size: 200MB`}
                      </Typography>
                      {errors[errorKey] && (
                        <Typography
                          fontSize={11}
                          color="#F04438"
                          sx={{ mt: 0.5, ml: 0, lineHeight: 1.5, opacity: 0.8 }}
                        >
                          {`${
                            label.charAt(0).toUpperCase() + label.slice(1)
                          } file is required`}
                        </Typography>
                      )}
                      {file && (
                        <Box
                          display="flex"
                          alignItems="center"
                          mt={1}
                          px={1}
                          py={0.5}
                          border="1px solid #E5E7EB"
                          borderRadius={1}
                          justifyContent="space-between"
                        >
                          <Typography fontSize="14px">{file.name}</Typography>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setFile(null);
                              if (ref.current) ref.current.value = "";
                            }}
                          >
                            <CloseGreyIcon size={14} />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  )
                )}
                <Box sx={{ mb: 5 }}>
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
                    error={
                      errors.targetColumn ? "Target column is required" : ""
                    }
                    sx={{ mb: 1 }}
                  />
                </Box>

                <Box sx={{ mb: 5 }}>
                  <Select
                    id="sensitive-column"
                    label="Sensitive column"
                    placeholder="Select sensitive feature"
                    value={sensitiveColumn}
                    items={targetColumnItems}
                    onChange={(e) => {
                      setSensitiveColumn(e.target.value as string);
                      setErrors((prev) => ({
                        ...prev,
                        sensitiveColumn: false,
                      }));
                    }}
                    error={
                      errors.sensitiveColumn
                        ? "Sensitive column is required"
                        : ""
                    }
                    sx={{ mb: 1 }}
                  />
                </Box>

                <Box display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "#13715B",
                      color: "white",
                      textTransform: "none",
                      mt: 8,
                    }}
                    onClick={handleSaveModel}
                  >
                    Upload
                  </Button>
                </Box>
              </Stack>
            </DialogContent>
          </Dialog>
        </TabPanel> */}

        <TabPanel value="biasModule" sx={tabPanelStyle}>
          <BiasAndFairnessModule />
        </TabPanel>
      </TabContext>
      {/* Commented out - related to ML evaluator tab */}
      {/* {showToastNotification && (
        <CustomizableToast title="Uploading the model. Please wait, this process may take some time..." />
      )} */}

      <PageTour
        steps={BiasAndFairnessSteps}
        run={true}
        tourKey="bias-fairness-tour"
      />
    </Stack>
  );
}
