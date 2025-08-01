import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import RiskCard from './RiskCard';
import { VendorRisksCardProps, RiskChartData } from './types';
import { getRiskLevelColor } from '../../../application/utils/riskFormatters';
import useVendorRisks from '../../../application/hooks/useVendorRisks';

const VendorRisksCard: React.FC<VendorRisksCardProps> = ({
  projectId,
  onViewDetails,
}) => {
  const navigate = useNavigate();
  
  const {
    vendorRisksSummary,
    loadingVendorRisks,
    error,
  } = useVendorRisks({ 
    projectId: projectId || null,
    vendorId: null 
  });

  const totalRisks = useMemo(() => {
    return (
      vendorRisksSummary.veryHighRisks +
      vendorRisksSummary.highRisks +
      vendorRisksSummary.mediumRisks +
      vendorRisksSummary.lowRisks +
      vendorRisksSummary.veryLowRisks
    );
  }, [vendorRisksSummary]);

  const chartData: RiskChartData[] = useMemo(() => {
    const data = [
      {
        id: 'very high risk',
        label: 'Very High',
        value: vendorRisksSummary.veryHighRisks,
        color: getRiskLevelColor('very high risk'),
      },
      {
        id: 'high risk',
        label: 'High',
        value: vendorRisksSummary.highRisks,
        color: getRiskLevelColor('high risk'),
      },
      {
        id: 'medium risk',
        label: 'Medium',
        value: vendorRisksSummary.mediumRisks,
        color: getRiskLevelColor('medium risk'),
      },
      {
        id: 'low risk',
        label: 'Low',
        value: vendorRisksSummary.lowRisks,
        color: getRiskLevelColor('low risk'),
      },
      {
        id: 'very low risk',
        label: 'Very Low',
        value: vendorRisksSummary.veryLowRisks,
        color: getRiskLevelColor('very low risk'),
      },
    ];

    // Filter out items with zero values for cleaner chart
    return data.filter(item => item.value > 0);
  }, [vendorRisksSummary]);

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      navigate('/vendors');
    }
  };

  if (error) {
    return (
      <RiskCard
        title="Vendor Risks Overview"
        totalRisks={0}
        chartData={[]}
        onViewDetails={handleViewDetails}
        loading={false}
      />
    );
  }

  return (
    <RiskCard
      title="Vendor Risks Overview"
      totalRisks={totalRisks}
      chartData={chartData}
      onViewDetails={handleViewDetails}
      loading={loadingVendorRisks}
    />
  );
};

export default VendorRisksCard;