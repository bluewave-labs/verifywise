import { useState, useMemo, useCallback } from "react";
import {
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
  Tooltip,
} from "@mui/material";
import EmptyState from "../EmptyState";
import riskData from "../../assets/IBMAIRISKDB.json";
import StandardModal from "../Modals/StandardModal";
import { Likelihood, Severity } from "../RiskLevel/constants";
import { riskCategoryItems } from "../AddNewRiskForm/projectRiskValue";
import { SearchBox } from "../Search";

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
  "SELECT",
  "ID",
  "RISK NAME",
  "DESCRIPTION",
  "SEVERITY",
  "LIKELIHOOD",
  "CATEGORY",
] as const;

interface AddNewRiskIBMModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onRiskSelected?: (riskData: SelectedRiskData) => void;
}

// Utility functions - IBM uses Minor/Moderate/Major severity scale
const mapSeverity = (severity: string): Severity => {
  switch (severity.toLowerCase()) {
    case "minor":
      return Severity.Minor;
    case "moderate":
      return Severity.Moderate;
    case "major":
      return Severity.Major;
    default:
      return Severity.Moderate;
  }
};

// IBM uses Unlikely/Possible/Likely likelihood scale
const mapLikelihood = (likelihood: string): Likelihood => {
  switch (likelihood.toLowerCase()) {
    case "unlikely":
      return Likelihood.Unlikely;
    case "possible":
      return Likelihood.Possible;
    case "likely":
      return Likelihood.Likely;
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

const AddNewRiskIBMModal = ({
  isOpen,
  setIsOpen,
  onRiskSelected,
}: AddNewRiskIBMModalProps) => {
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
    (value: string) => {
      setSearch(value);
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
      console.error(`Risk with ID ${selectedId} not found in IBM database`);
      alert("Selected risk not found. Please try again.");
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
        reviewNotes: `Imported from IBM AI Risk Database - Category: ${selectedRisk["Risk Category"]}`,
        applicableProjects: [],
        applicableFrameworks: [],
      };

      onRiskSelected?.(mappedRiskData);
      handleClose();
    } catch (error) {
      console.error("Error mapping risk data:", error);
      alert("Failed to process risk data. Please try again.");
    }
  }, [selectedId, onRiskSelected, handleClose]);

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add a new risk from IBM risk database"
      description="Search and select a risk from the IBM AI Risk Database"
      onSubmit={handleUseSelectedRisk}
      submitButtonText="Use selected risk and edit"
      isSubmitting={selectedId === null}
      maxWidth={`${MODAL_CONFIG.MAX_WIDTH}px`}
    >
      <Stack spacing={6}>
        <Stack
          direction="row"
          alignItems="center"
          gap={2}
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
          <SearchBox
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, category, or description..."
            inputProps={{ "aria-label": "Search risks" }}
            sx={{
              width: { xs: "100%", sm: MODAL_CONFIG.SEARCH_FIELD_WIDTH },
              maxWidth: MODAL_CONFIG.SEARCH_FIELD_WIDTH,
            }}
          />
        </Stack>
        <Stack
          sx={{
            height: MODAL_CONFIG.MAX_HEIGHT,
            minHeight: MODAL_CONFIG.MAX_HEIGHT,
            overflow: "auto",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.spacing(1),
          }}
        >
          <TableContainer>
            <Table sx={{ minWidth: 900 }}>
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
              <TableBody>
                {filteredRisks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={TITLE_OF_COLUMNS.length}
                      align="center"
                      sx={{ border: "none", p: 0 }}
                    >
                      <EmptyState message="No risks found in database" />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRisks.map((risk) => (
                    <TableRow
                      key={risk.Id}
                      onClick={() => handleRowClick(risk.Id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleRowClick(risk.Id);
                        }
                      }}
                      sx={{
                        cursor: "pointer",
                        backgroundColor:
                          selectedId === risk.Id
                            ? "rgba(19, 113, 91, 0.04)"
                            : "inherit",
                        "&:hover": {
                          backgroundColor: theme.palette.action.hover,
                        },
                        "&:focus": {
                          backgroundColor: theme.palette.action.focus,
                          outline: `1px solid ${theme.palette.primary.main}`,
                          outlineOffset: -1,
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
                        }}
                      >
                        <span style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {risk.Summary}
                        </span>
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 250,
                        }}
                      >
                        <Tooltip title={risk.Description} arrow placement="top-start">
                          <span style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>{risk.Description}</span>
                        </Tooltip>
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
                            whiteSpace: "nowrap",
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
                            whiteSpace: "nowrap",
                          }}
                        >
                          {risk.Likelihood}
                        </Typography>
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 150,
                        }}
                      >
                        <span style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {risk["Risk Category"]}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Stack>
    </StandardModal>
  );
};

export default AddNewRiskIBMModal;
