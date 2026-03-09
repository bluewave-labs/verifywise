import { FC, useState, useCallback } from "react";
import {
  Stack,
  Typography,
  useTheme,
  Autocomplete,
  TextField,
  Box,
  Chip,
} from "@mui/material";
import { ChevronDown as GreyDownArrowIcon } from "lucide-react";
import {
  useBenchmarks,
  useBenchmarkFilters,
} from "../../../application/hooks/useQuantitativeRisk";
import { IRiskBenchmark } from "../../../domain/interfaces/i.quantitativeRisk";
import { getAutocompleteStyles } from "../../utils/inputStyles";

interface BenchmarkSelectorProps {
  onApply: (benchmark: IRiskBenchmark) => void;
  disabled?: boolean;
}

/**
 * Dropdown to select and apply an industry benchmark as a starting point
 * for FAIR quantitative fields.
 */
const BenchmarkSelector: FC<BenchmarkSelectorProps> = ({
  onApply,
  disabled = false,
}) => {
  const theme = useTheme();
  const [selectedIndustry, setSelectedIndustry] = useState<string | undefined>();
  const [selectedAiRiskType, setSelectedAiRiskType] = useState<string | undefined>();

  const { filters } = useBenchmarkFilters();
  const { benchmarks, isLoading } = useBenchmarks(
    selectedIndustry,
    selectedAiRiskType
  );

  const handleBenchmarkSelect = useCallback(
    (_: React.SyntheticEvent, value: IRiskBenchmark | null) => {
      if (value) {
        onApply(value);
      }
    },
    [onApply]
  );

  return (
    <Stack sx={{ gap: 2 }}>
      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 600,
          color: theme.palette.text.primary,
        }}
      >
        Start from industry benchmark
      </Typography>
      <Typography
        sx={{
          fontSize: theme.typography.fontSize,
          color: theme.palette.text.tertiary,
          lineHeight: 1.5,
        }}
      >
        Optionally select an industry benchmark to pre-fill frequency and loss
        values. You can adjust them after applying.
      </Typography>

      {/* Filter chips */}
      <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
        {filters.industries.map((industry) => (
          <Chip
            key={industry}
            label={industry}
            size="small"
            variant={selectedIndustry === industry ? "filled" : "outlined"}
            color={selectedIndustry === industry ? "primary" : "default"}
            onClick={() =>
              setSelectedIndustry(
                selectedIndustry === industry ? undefined : industry
              )
            }
            sx={{ fontSize: 12 }}
          />
        ))}
      </Stack>
      <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
        {filters.aiRiskTypes.map((type) => (
          <Chip
            key={type}
            label={type}
            size="small"
            variant={selectedAiRiskType === type ? "filled" : "outlined"}
            color={selectedAiRiskType === type ? "primary" : "default"}
            onClick={() =>
              setSelectedAiRiskType(
                selectedAiRiskType === type ? undefined : type
              )
            }
            sx={{ fontSize: 12 }}
          />
        ))}
      </Stack>

      {/* Benchmark selector */}
      <Autocomplete
        id="benchmark-selector"
        size="small"
        options={benchmarks}
        loading={isLoading}
        disabled={disabled}
        getOptionLabel={(option) =>
          `${option.category} (${option.industry} - ${option.ai_risk_type})`
        }
        renderOption={(props, option) => {
          const { key, ...optionProps } = props;
          return (
            <Box key={key} component="li" {...optionProps}>
              <Stack>
                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                  {option.category}
                </Typography>
                <Typography
                  sx={{ fontSize: 11, color: theme.palette.text.tertiary }}
                >
                  {option.industry} &middot; {option.ai_risk_type}
                  {option.regulation ? ` &middot; ${option.regulation}` : ""}
                </Typography>
              </Stack>
            </Box>
          );
        }}
        popupIcon={<GreyDownArrowIcon size={20} />}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={
              isLoading ? "Loading benchmarks..." : "Search benchmarks..."
            }
            sx={{
              "& ::placeholder": { fontSize: 13 },
            }}
          />
        )}
        onChange={handleBenchmarkSelect}
        sx={{
          ...getAutocompleteStyles(theme, { hasError: false }),
          width: "100%",
          maxWidth: 654,
          backgroundColor: theme.palette.background.main,
        }}
        slotProps={{
          paper: {
            sx: {
              "& .MuiAutocomplete-listbox": {
                "& .MuiAutocomplete-option": {
                  fontSize: 13,
                  padding: "8px 12px",
                },
              },
            },
          },
        }}
      />
    </Stack>
  );
};

export default BenchmarkSelector;
