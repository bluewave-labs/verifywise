import { Chip } from "@mui/material";
import { useStatusTranslation } from "../../../i18n/utils/statusTranslations";

interface StatusBadgeProps {
  status: string;
  variant?: "filled" | "outlined";
}

const StatusBadge = ({ status, variant = "filled" }: StatusBadgeProps) => {
  const { translateStatus } = useStatusTranslation();

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('completed') || lowerStatus.includes('approved')) return 'success';
    if (lowerStatus.includes('progress') || lowerStatus.includes('pending')) return 'warning';
    if (lowerStatus.includes('failed') || lowerStatus.includes('rejected')) return 'error';
    return 'default';
  };

  return (
    <Chip
      label={translateStatus(status)}
      color={getStatusColor(status)}
      variant={variant}
      size="small"
    />
  );
};

export default StatusBadge;