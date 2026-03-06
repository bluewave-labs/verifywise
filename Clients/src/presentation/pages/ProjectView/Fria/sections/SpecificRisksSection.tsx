import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { SelectChangeEvent } from "@mui/material/Select";
import { Plus, Trash2, Download } from "lucide-react";
import Field from "../../../../components/Inputs/Field";
import Select from "../../../../components/Inputs/Select";
import { CustomizableButton } from "../../../../components/button/customizable-button";
import {
  FriaAssessment,
  FriaRiskItem,
} from "../../../../../application/hooks/useFria";
import FriaEvidenceButton from "../FriaEvidenceButton";
import FriaRiskImportModal from "../FriaRiskImportModal";

interface SpecificRisksSectionProps {
  assessment: FriaAssessment;
  riskItems: FriaRiskItem[];
  projectId: string;
  onUpdate: (data: Partial<FriaAssessment>) => void;
  onAddRiskItem: (data: Partial<FriaRiskItem>) => void;
  onUpdateRiskItem: (itemId: number, data: Partial<FriaRiskItem>) => void;
  onDeleteRiskItem: (itemId: number) => void;
  isSaving: boolean;
}

const LIKELIHOOD_OPTIONS = [
  { _id: "Low", name: "Low" },
  { _id: "Medium", name: "Medium" },
  { _id: "High", name: "High" },
];

const SEVERITY_OPTIONS = [
  { _id: "Low", name: "Low" },
  { _id: "Medium", name: "Medium" },
  { _id: "High", name: "High" },
];

const TABLE_CELL_SX = {
  fontSize: 13,
  py: 1,
  px: 1.5,
  verticalAlign: "top",
  borderBottom: "1px solid #d0d5dd",
};

const TABLE_HEAD_CELL_SX = {
  fontSize: 12,
  fontWeight: 600,
  py: 1,
  px: 1.5,
  borderBottom: "1px solid #d0d5dd",
  whiteSpace: "nowrap" as const,
};

function RiskRow({
  item,
  onUpdateRiskItem,
  onDeleteRiskItem,
  isSaving,
}: {
  item: FriaRiskItem;
  onUpdateRiskItem: (itemId: number, data: Partial<FriaRiskItem>) => void;
  onDeleteRiskItem: (itemId: number) => void;
  isSaving: boolean;
}) {
  const [riskDescription, setRiskDescription] = useState(
    item.risk_description ?? ""
  );
  const [existingControls, setExistingControls] = useState(
    item.existing_controls ?? ""
  );
  const [furtherAction, setFurtherAction] = useState(
    item.further_action ?? ""
  );
  const [linkedRiskName, setLinkedRiskName] = useState(
    item.linked_risk_name ?? ""
  );

  const handleTextBlur =
    (field: keyof FriaRiskItem, currentVal: string, originalVal: string | null) => () => {
      if (currentVal !== (originalVal ?? "")) {
        onUpdateRiskItem(item.id, { [field]: currentVal });
      }
    };

  const handleSelectChange =
    (field: keyof FriaRiskItem) => (e: SelectChangeEvent<unknown>) => {
      onUpdateRiskItem(item.id, { [field]: e.target.value as string });
    };

  return (
    <TableRow>
      <TableCell sx={TABLE_CELL_SX} style={{ minWidth: 160 }}>
        <Field
          id={`risk-desc-${item.id}`}
          value={riskDescription}
          type="description"
          rows={2}
          placeholder="Describe risk…"
          onChange={(e) => setRiskDescription(e.target.value)}
          onBlur={handleTextBlur("risk_description", riskDescription, item.risk_description)}
          disabled={isSaving}
        />
      </TableCell>
      <TableCell sx={TABLE_CELL_SX} style={{ minWidth: 110 }}>
        <Select
          id={`likelihood-${item.id}`}
          placeholder="Select…"
          value={item.likelihood ?? ""}
          items={LIKELIHOOD_OPTIONS}
          onChange={handleSelectChange("likelihood")}
          disabled={isSaving}
        />
      </TableCell>
      <TableCell sx={TABLE_CELL_SX} style={{ minWidth: 110 }}>
        <Select
          id={`severity-${item.id}`}
          placeholder="Select…"
          value={item.severity ?? ""}
          items={SEVERITY_OPTIONS}
          onChange={handleSelectChange("severity")}
          disabled={isSaving}
        />
      </TableCell>
      <TableCell sx={TABLE_CELL_SX} style={{ minWidth: 160 }}>
        <Field
          id={`existing-controls-${item.id}`}
          value={existingControls}
          type="description"
          rows={2}
          placeholder="Existing controls…"
          onChange={(e) => setExistingControls(e.target.value)}
          onBlur={handleTextBlur("existing_controls", existingControls, item.existing_controls)}
          disabled={isSaving}
        />
      </TableCell>
      <TableCell sx={TABLE_CELL_SX} style={{ minWidth: 160 }}>
        <Field
          id={`further-action-${item.id}`}
          value={furtherAction}
          type="description"
          rows={2}
          placeholder="Further action…"
          onChange={(e) => setFurtherAction(e.target.value)}
          onBlur={handleTextBlur("further_action", furtherAction, item.further_action)}
          disabled={isSaving}
        />
      </TableCell>
      <TableCell sx={TABLE_CELL_SX} style={{ minWidth: 140 }}>
        <Field
          id={`linked-risk-${item.id}`}
          value={linkedRiskName}
          placeholder="Linked risk…"
          onChange={(e) => setLinkedRiskName(e.target.value)}
          onBlur={handleTextBlur("linked_risk_name", linkedRiskName, item.linked_risk_name)}
          disabled={isSaving}
        />
      </TableCell>
      <TableCell sx={{ ...TABLE_CELL_SX, width: 48 }} align="center">
        <IconButton
          size="small"
          onClick={() => onDeleteRiskItem(item.id)}
          disabled={isSaving}
          aria-label="Delete risk item"
          sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
        >
          <Trash2 size={14} strokeWidth={1.5} />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

function SpecificRisksSection({
  assessment,
  riskItems,
  projectId,
  onUpdate,
  onAddRiskItem,
  onUpdateRiskItem,
  onDeleteRiskItem,
  isSaving,
}: SpecificRisksSectionProps) {
  const theme = useTheme();
  const [importModalOpen, setImportModalOpen] = useState(false);

  const [riskScenarios, setRiskScenarios] = useState(
    assessment.risk_scenarios ?? ""
  );
  const [providerInfoUsed, setProviderInfoUsed] = useState(
    assessment.provider_info_used ?? ""
  );

  const handleRiskScenariosBlur = () => {
    if (riskScenarios !== (assessment.risk_scenarios ?? "")) {
      onUpdate({ risk_scenarios: riskScenarios });
    }
  };

  const handleProviderInfoBlur = () => {
    if (providerInfoUsed !== (assessment.provider_info_used ?? "")) {
      onUpdate({ provider_info_used: providerInfoUsed });
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: "#d0d5dd",
        borderRadius: "4px",
        boxShadow: "none",
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Stack spacing={2.5}>
          {/* Section header */}
          <Box>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              5. Specific risks of harm
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: theme.palette.text.secondary,
              }}
            >
              Identify specific risks of harm that the AI system may pose to fundamental rights.
            </Typography>
          </Box>

          {/* Textarea fields */}
          <Field
            id="risk-scenarios"
            label="Risk scenarios"
            placeholder="Describe the specific risk scenarios and how fundamental rights may be affected…"
            type="description"
            rows={4}
            value={riskScenarios}
            onChange={(e) => setRiskScenarios(e.target.value)}
            onBlur={handleRiskScenariosBlur}
            disabled={isSaving}
          />

          <Field
            id="provider-info-used"
            label="Provider information used"
            placeholder="Describe what technical documentation, conformity assessments or other provider information was used in this analysis…"
            type="description"
            rows={3}
            value={providerInfoUsed}
            onChange={(e) => setProviderInfoUsed(e.target.value)}
            onBlur={handleProviderInfoBlur}
            disabled={isSaving}
          />

          {/* Risk register table */}
          <Box>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 1.5,
              }}
            >
              Risk register
            </Typography>

            <TableContainer
              sx={{
                border: "1px solid #d0d5dd",
                borderRadius: "4px",
                overflowX: "auto",
              }}
            >
              <Table size="small" aria-label="Risk register table">
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: theme.palette.background.default,
                    }}
                  >
                    <TableCell sx={TABLE_HEAD_CELL_SX}>Risk description</TableCell>
                    <TableCell sx={TABLE_HEAD_CELL_SX}>Likelihood</TableCell>
                    <TableCell sx={TABLE_HEAD_CELL_SX}>Severity</TableCell>
                    <TableCell sx={TABLE_HEAD_CELL_SX}>Existing controls</TableCell>
                    <TableCell sx={TABLE_HEAD_CELL_SX}>Further action</TableCell>
                    <TableCell sx={TABLE_HEAD_CELL_SX}>Linked risk</TableCell>
                    <TableCell sx={{ ...TABLE_HEAD_CELL_SX, width: 48 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {riskItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        align="center"
                        sx={{
                          py: 3,
                          fontSize: 13,
                          color: theme.palette.text.secondary,
                          borderBottom: "none",
                        }}
                      >
                        No risk items yet. Add a risk to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    riskItems.map((item) => (
                      <RiskRow
                        key={item.id}
                        item={item}
                        onUpdateRiskItem={onUpdateRiskItem}
                        onDeleteRiskItem={onDeleteRiskItem}
                        isSaving={isSaving}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 1.5, display: "flex", gap: 1 }}>
              <CustomizableButton
                text="Add risk"
                variant="outlined"
                startIcon={<Plus size={14} strokeWidth={1.5} />}
                onClick={() => onAddRiskItem({ risk_description: "" })}
                disabled={isSaving}
                sx={{ height: 34, fontSize: 13 }}
              />
              <CustomizableButton
                text="Import from project risks"
                variant="outlined"
                startIcon={<Download size={14} strokeWidth={1.5} />}
                onClick={() => setImportModalOpen(true)}
                disabled={isSaving}
                sx={{ height: 34, fontSize: 13 }}
              />
            </Box>
          </Box>

          <FriaEvidenceButton friaId={assessment.id} entityType="section_5" />

          <FriaRiskImportModal
            open={importModalOpen}
            onClose={() => setImportModalOpen(false)}
            projectId={projectId}
            existingLinkedRiskIds={riskItems
              .filter((r) => r.linked_project_risk_id)
              .map((r) => r.linked_project_risk_id as number)}
            onImport={(risks) => {
              for (const risk of risks) {
                onAddRiskItem(risk);
              }
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default SpecificRisksSection;
