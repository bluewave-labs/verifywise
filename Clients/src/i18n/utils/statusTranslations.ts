import { useTranslation } from 'react-i18next';

// Hook for translating status values
export const useStatusTranslation = () => {
  const { t } = useTranslation();

  const translateStatus = (status: string): string => {
    const statusKey = status.toLowerCase().replace(/\s+/g, '');
    return t(`status.${statusKey}`, status); // Falls back to original if translation missing
  };

  const translateRiskLevel = (riskLevel: string): string => {
    const riskKey = riskLevel.toLowerCase().replace(/\s+/g, '').replace(/risk/g, '');
    return t(`riskLevel.${riskKey}`, riskLevel);
  };

  return { translateStatus, translateRiskLevel };
};

// Utility function for components that can't use hooks
export const getStatusTranslation = (status: string, t: any): string => {
  const statusKey = status.toLowerCase().replace(/\s+/g, '');
  return t(`status.${statusKey}`, status);
};

export const getRiskLevelTranslation = (riskLevel: string, t: any): string => {
  const riskKey = riskLevel.toLowerCase().replace(/\s+/g, '').replace(/risk/g, '');
  return t(`riskLevel.${riskKey}`, riskLevel);
};