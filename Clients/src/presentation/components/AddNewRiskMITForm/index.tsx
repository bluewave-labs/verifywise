import { useState, useMemo, useCallback } from "react";
import {
  Modal,
  Stack,
  Typography,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  TextField,
} from "@mui/material";
import { ReactComponent as GreyCloseIconSVG } from "../../assets/icons/close-grey.svg";
import placeholderImage from "../../assets/imgs/empty-state.svg";
import riskData from "../../assets/MITAIRISKDB.json";
import CustomizableButton from "../Button/CustomizableButton";
import { Likelihood, Severity } from "../RiskLevel/constants";
import { riskCategoryItems } from "../AddNewRiskForm/projectRiskValue";

// Types
interface RiskData {
  Id: number;
  Summary: string;
  Description: string;
  "Risk Severity": string;
  Likelihood: string;
  "Risk Category": string;
}

interface SelectedRiskData {
  riskName: string;
  actionOwner: number;
  aiLifecyclePhase: number;
  riskDescription: string;
  riskCategory: number[];
  potentialImpact: string;
  assessmentMapping: number;
  controlsMapping: number;
  likelihood: number;
  riskSeverity: number;
  riskLevel: number;
  reviewNotes: string;
  applicableProjects: number[];
  applicableFrameworks: number[];
}

// Constants
const DEFAULT_VALUES = {
  ACTION_OWNER: 0,
  AI_LIFECYCLE_PHASE: 0,
  POTENTIAL_IMPACT: "",
  ASSESSMENT_MAPPING: 0,
  CONTROLS_MAPPING: 0,
  RISK_LEVEL: 0,
  DEFAULT_CATEGORY_ID: 1,
} as const;

const MODAL_CONFIG = {
  MAX_WIDTH: 1000,
  MAX_HEIGHT: "50vh",
  SEARCH_FIELD_WIDTH: 350,
} as const;

const TITLE_OF_COLUMNS = [
  "",
  "ID",
  "RISK NAME",
  "DESCRIPTION",
  "SEVERITY",
  "LIKELIHOOD",
  "CATEGORY",
] as const;

interface AddNewRiskMITModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onRiskSelected?: (riskData: SelectedRiskData) => void;
}

// Utility functions
const mapSeverity = (severity: string): Severity => {
  switch (severity.toLowerCase()) {
    case "negligible":
      return Severity.Negligible;
    case "minor":
      return Severity.Minor;
    case "moderate":
      return Severity.Moderate;
    case "major":
      return Severity.Major;
    case "catastrophic":
      return Severity.Catastrophic;
    default:
      return Severity.Moderate;
  }
};

const mapLikelihood = (likelihood: string): Likelihood => {
  switch (likelihood.toLowerCase()) {
    case "rare":
      return Likelihood.Rare;
    case "unlikely":
      return Likelihood.Unlikely;
    case "possible":
      return Likelihood.Possible;
    case "likely":
      return Likelihood.Likely;
    case "almost certain":
      return Likelihood.AlmostCertain;
    default:
      return Likelihood.Possible;
  }
};

const mapRiskCategories = (riskCategories: string): number[] => {
  const categories = riskCategories.split(";").map((cat) => cat.trim());
  const mappedCategories: number[] = [];

  categories.forEach((category) => {
    const matchedCategory = riskCategoryItems.find(
      (item) => item.name.toLowerCase() === category.toLowerCase()
    );
    if (matchedCategory) {
      mappedCategories.push(matchedCategory._id);
    }
  });

  return mappedCategories.length > 0
    ? mappedCategories
    : [DEFAULT_VALUES.DEFAULT_CATEGORY_ID];
};

const filterRisks = (risks: RiskData[], searchTerm: string): RiskData[] => {
  if (!searchTerm.trim()) return risks;

  const lowercaseSearch = searchTerm.toLowerCase();
  return risks.filter(
    (risk) =>
      risk.Summary.toLowerCase().includes(lowercaseSearch) ||
      risk["Risk Category"].toLowerCase().includes(lowercaseSearch) ||
      risk.Description.toLowerCase().includes(lowercaseSearch)
  );
};

const AddNewRiskMITModal = ({
  isOpen,
  setIsOpen,
  onRiskSelected,
}: AddNewRiskMITModalProps) => {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Memoized filtered risks for performance
  const filteredRisks = useMemo(
    () => filterRisks(riskData as RiskData[], search),
    [search]
  );

  // Memoized handlers for performance
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearch("");
    setSelectedId(null);
  }, [setIsOpen]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    []
  );

  const handleRowClick = useCallback(
    (riskId: number) => {
      setSelectedId(selectedId === riskId ? null : riskId);
    },
    [selectedId]
  );

  const handleRadioChange = useCallback(
    (riskId: number) => {
      setSelectedId(selectedId === riskId ? null : riskId);
    },
    [selectedId]
  );

  const handleUseSelectedRisk = useCallback(() => {
    if (selectedId === null) return;

    const selectedRisk = (riskData as RiskData[]).find(
      (risk) => risk.Id === selectedId
    );
    if (!selectedRisk) {
      console.error(`Risk with ID ${selectedId} not found`);
      return;
    }

    try {
      const mappedRiskData: SelectedRiskData = {
        riskName: selectedRisk.Summary,
        actionOwner: DEFAULT_VALUES.ACTION_OWNER,
        aiLifecyclePhase: DEFAULT_VALUES.AI_LIFECYCLE_PHASE,
        riskDescription: selectedRisk.Description,
        riskCategory: mapRiskCategories(selectedRisk["Risk Category"]),
        potentialImpact: DEFAULT_VALUES.POTENTIAL_IMPACT,
        assessmentMapping: DEFAULT_VALUES.ASSESSMENT_MAPPING,
        controlsMapping: DEFAULT_VALUES.CONTROLS_MAPPING,
        likelihood: mapLikelihood(selectedRisk.Likelihood),
        riskSeverity: mapSeverity(selectedRisk["Risk Severity"]),
        riskLevel: DEFAULT_VALUES.RISK_LEVEL,
        reviewNotes: `Imported from MIT AI Risk Database - Category: ${selectedRisk["Risk Category"]}`,
        applicableProjects: [],
        applicableFrameworks: [],
      };

      onRiskSelected?.(mappedRiskData);
      handleClose();
    } catch (error) {
      console.error("Error mapping risk data:", error);
    }
  }, [selectedId, onRiskSelected, handleClose]);

  return (
    <Modal 
      open={isOpen} 
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
    >
      <Stack
        gap={theme.spacing(4)}
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90vw", sm: "80vw", md: MODAL_CONFIG.MAX_WIDTH },
          maxWidth: MODAL_CONFIG.MAX_WIDTH,
          bgcolor: theme.palette.background.paper,
          p: { xs: 4, sm: 6, md: 10 },
          borderRadius: theme.spacing(1),
          boxShadow: theme.shadows[24],
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            component="h2"
            sx={{
              fontSize: { xs: 14, md: 15 },
              fontWeight: 700,
              color: theme.palette.text.primary,
            }}
          >
            Add a new risk from risk database
          </Typography>
          <GreyCloseIconSVG onClick={handleClose} cursor={"pointer"} />
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          gap={2}
          sx={{ mb: theme.spacing(4) }}
        >
          <Typography
            component="label"
            htmlFor="risk-search-input"
            sx={{
              fontSize: 13,
              fontWeight: 400,
              color: theme.palette.text.secondary,
              mr: 4,
              minWidth: "fit-content",
            }}
          >
            Search from the risk database:
          </Typography>
          <TextField
            id="risk-search-input"
            size="small"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, category, or description..."
            aria-label="Search risks"
            sx={{
              width: { xs: "100%", sm: MODAL_CONFIG.SEARCH_FIELD_WIDTH },
              maxWidth: MODAL_CONFIG.SEARCH_FIELD_WIDTH,
              "& .MuiOutlinedInput-root": {
                borderRadius: theme.spacing(0.5),
                height: 34,
                fontSize: 13,
                "& input::placeholder": {
                  fontSize: 13,
                },
                "& fieldset": {
                  borderRadius: theme.spacing(0.5),
                },
                "&:hover fieldset": {
                  borderRadius: theme.spacing(0.5),
                },
                "&.Mui-focused fieldset": {
                  borderRadius: theme.spacing(0.5),
                },
              },
            }}
          />
        </Stack>
        <Stack
          sx={{
            maxHeight: MODAL_CONFIG.MAX_HEIGHT,
            overflow: "auto",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.spacing(1),
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {TITLE_OF_COLUMNS.map((column) => (
                    <TableCell
                      key={column}
                      sx={{
                        fontSize: 13,
                        fontWeight: 400,
                        color: theme.palette.text.secondary,
                        bgcolor: theme.palette.grey[50],
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                      }}
                    >
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              {filteredRisks.length === 0 && (
                <TableBody>
                  <TableRow>
                    <TableCell
                      colSpan={TITLE_OF_COLUMNS.length}
                      align="center"
                      sx={{
                        padding: theme.spacing(15, 5),
                        paddingBottom: theme.spacing(20),
                      }}
                    >
                      <img
                        src={placeholderImage}
                        alt="No risks found"
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                          mt: 2,
                        }}
                      >
                        No risks found in database
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              )}
              <TableBody>
                {filteredRisks.map((risk) => (
                  <TableRow
                    key={risk.Id}
                    onClick={() => handleRowClick(risk.Id)}
                    sx={{
                      cursor: "pointer",
                      backgroundColor:
                        selectedId === risk.Id
                          ? theme.palette.action.selected
                          : "inherit",
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                      "&:focus": {
                        backgroundColor: theme.palette.action.focus,
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: -2,
                      },
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select risk: ${risk.Summary}`}
                  >
                    <TableCell>
                      <Radio
                        checked={selectedId === risk.Id}
                        onChange={() => handleRadioChange(risk.Id)}
                        slotProps={{
                          input: {
                            "aria-label": `Select risk ${risk.Id}: ${risk.Summary}`,
                          },
                        }}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{risk.Id}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {risk.Summary}
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 250,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {risk.Description}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: theme.palette.warning.light,
                          color: theme.palette.warning.contrastText,
                          fontSize: 11,
                          fontWeight: 600,
                          textAlign: "center",
                        }}
                      >
                        {risk["Risk Severity"]}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: theme.palette.info.light,
                          color: theme.palette.info.contrastText,
                          fontSize: 11,
                          fontWeight: 600,
                          textAlign: "center",
                        }}
                      >
                        {risk.Likelihood}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 150,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {risk["Risk Category"]}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
        <Stack direction="row" justifyContent="flex-end" gap={2} mt={4}>
          <CustomizableButton
            variant="outlined"
            text="Cancel"
            onClick={handleClose}
            sx={{
              fontWeight: 400,
              fontSize: 13,
              minWidth: 120,
            }}
          />
          <CustomizableButton
            variant="contained"
            text="Use selected risk and edit"
            onClick={handleUseSelectedRisk}
            isDisabled={selectedId === null}
            sx={{
              fontWeight: 400,
              fontSize: 13,
              bgcolor: theme.palette.primary.main,
              minWidth: 200,
              "&:hover": {
                bgcolor: theme.palette.primary.dark,
              },
              "&:disabled": {
                bgcolor: theme.palette.action.disabledBackground,
              },
            }}
          />
        </Stack>
      </Stack>
    </Modal>
  );
};

export default AddNewRiskMITModal;
