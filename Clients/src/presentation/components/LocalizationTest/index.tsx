import { Stack, Typography, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useStatusTranslation } from "../../../i18n/utils/statusTranslations";
import StatusBadge from "../StatusBadge";

const LocalizationTest = () => {
  const { t } = useTranslation();
  const { translateStatus, translateRiskLevel } = useStatusTranslation();

  const testStatuses = ["In Progress", "Completed", "Pending", "Failed"];
  const testRiskLevels = ["Very High Risk", "High Risk", "Medium Risk", "Low Risk"];

  return (
    <Stack gap={3} p={3} sx={{ border: "1px solid #ccc", borderRadius: 2, m: 2 }}>
      <Typography variant="h6">🧪 Localization Test</Typography>

      <Stack gap={1}>
        <Typography variant="subtitle2">Sidebar Translations:</Typography>
        <Typography>Dashboard: {t('sidebar.dashboard')}</Typography>
        <Typography>Risk Management: {t('sidebar.riskManagement')}</Typography>
        <Typography>AI Trust Center: {t('sidebar.aiTrustCenter')}</Typography>
      </Stack>

      <Stack gap={1}>
        <Typography variant="subtitle2">Status Translations:</Typography>
        <Stack direction="row" gap={1} flexWrap="wrap">
          {testStatuses.map(status => (
            <StatusBadge key={status} status={status} />
          ))}
        </Stack>
      </Stack>

      <Stack gap={1}>
        <Typography variant="subtitle2">Risk Level Translations:</Typography>
        <Stack direction="row" gap={1} flexWrap="wrap">
          {testRiskLevels.map(level => (
            <Chip key={level} label={translateRiskLevel(level)} size="small" />
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default LocalizationTest;