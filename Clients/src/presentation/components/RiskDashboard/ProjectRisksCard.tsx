import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import RiskCard from './RiskCard';
import { ProjectRisksCardProps, RiskChartData } from './types';
import { getRiskLevelColor } from '../../../application/utils/riskFormatters';
import useProjectRisks from '../../../application/hooks/useProjectRisks';

const ProjectRisksCard: React.FC<ProjectRisksCardProps> = ({
  projectId,
  onViewDetails,
}) => {
  const navigate = useNavigate();
  
  const {
    projectRisksSummary,
    loadingProjectRisks,
    error,
  } = useProjectRisks({ 
    projectId: projectId ? parseInt(projectId) : 1,
    refreshKey: undefined 
  });

  const totalRisks = useMemo(() => {
    return (
      projectRisksSummary.veryHighRisks +
      projectRisksSummary.highRisks +
      projectRisksSummary.mediumRisks +
      projectRisksSummary.lowRisks +
      projectRisksSummary.veryLowRisks
    );
  }, [projectRisksSummary]);

  const chartData: RiskChartData[] = useMemo(() => {
    const data = [
      {
        id: 'very high risk',
        label: 'Very High',
        value: projectRisksSummary.veryHighRisks,
        color: getRiskLevelColor('very high risk'),
      },
      {
        id: 'high risk',
        label: 'High',
        value: projectRisksSummary.highRisks,
        color: getRiskLevelColor('high risk'),
      },
      {
        id: 'medium risk',
        label: 'Medium',
        value: projectRisksSummary.mediumRisks,
        color: getRiskLevelColor('medium risk'),
      },
      {
        id: 'low risk',
        label: 'Low',
        value: projectRisksSummary.lowRisks,
        color: getRiskLevelColor('low risk'),
      },
      {
        id: 'very low risk',
        label: 'Very Low',
        value: projectRisksSummary.veryLowRisks,
        color: getRiskLevelColor('very low risk'),
      },
    ];

    // Filter out items with zero values for cleaner chart
    return data.filter(item => item.value > 0);
  }, [projectRisksSummary]);

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      navigate('/project-view', { 
        state: { 
          projectId: projectId,
          tab: 'risks' 
        } 
      });
    }
  };

  if (error) {
    return (
      <RiskCard
        title="Project Risks Overview"
        totalRisks={0}
        chartData={[]}
        onViewDetails={handleViewDetails}
        loading={false}
      />
    );
  }

  return (
    <RiskCard
      title="Project Risks Overview"
      totalRisks={totalRisks}
      chartData={chartData}
      onViewDetails={handleViewDetails}
      loading={loadingProjectRisks}
    />
  );
};

export default ProjectRisksCard;