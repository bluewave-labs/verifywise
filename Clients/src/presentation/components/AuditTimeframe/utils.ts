import { AuditTimeframeType, IAuditTimeframe } from './index';
import { ProjectRisk } from '../../../domain/types/ProjectRisk';
import { VendorRisk } from '../../../domain/types/VendorRisk';
import { IModelRisk } from '../../../domain/interfaces/i.modelRisk';

export type RiskWithDates = ProjectRisk | VendorRisk | IModelRisk;

// Type guards
export const isProjectRisk = (risk: RiskWithDates): risk is ProjectRisk => {
  return 'risk_name' in risk && 'severity' in risk && 'id' in risk;
};

export const isVendorRisk = (risk: RiskWithDates): risk is VendorRisk => {
  return 'risk_id' in risk && 'vendor_name' in risk && 'risk_severity' in risk;
};

export const isModelRisk = (risk: RiskWithDates): risk is IModelRisk => {
  return 'risk_level' in risk && !('vendor_name' in risk) && 'id' in risk;
};

// Safe date validation
export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const parseDate = (dateInput: any): Date | null => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  return isValidDate(date) ? date : null;
};

// Helper functions for standardized property access
export const getRiskId = (risk: RiskWithDates): number | string => {
  if (isVendorRisk(risk)) return risk.risk_id || 'vendor-unknown';
  if (isProjectRisk(risk)) return risk.id;
  if (isModelRisk(risk)) return risk.id || 'model-unknown';
  return 'unknown';
};

export const getRiskName = (risk: RiskWithDates): string => {
  if (isProjectRisk(risk)) return risk.risk_name || 'Unnamed Risk';
  if (isVendorRisk(risk)) return risk.risk_description || 'Unnamed Risk';
  if (isModelRisk(risk)) return risk.risk_name || 'Unnamed Risk';
  return 'Unknown Risk';
};

export const getRiskLevel = (risk: RiskWithDates): string => {
  if (isProjectRisk(risk)) return risk.severity || risk.risk_severity || 'Unknown';
  if (isVendorRisk(risk)) return risk.risk_severity || 'Unknown';
  if (isModelRisk(risk)) return risk.risk_level || 'Unknown';
  return 'Unknown';
};

export const getRiskStatus = (risk: RiskWithDates): string => {
  if (risk.is_deleted) return 'Deleted';
  if (isProjectRisk(risk)) return risk.mitigation_status || 'Unknown';
  if (isModelRisk(risk)) return risk.status || 'Unknown';
  return 'Active';
};

export const getVendorName = (risk: RiskWithDates): string => {
  if (isVendorRisk(risk)) return risk.vendor_name || 'N/A';
  return 'N/A';
};

export const getDateFromRisk = (
  risk: RiskWithDates,
  dateType: AuditTimeframeType
): Date | null => {
  try {
    switch (dateType) {
      case AuditTimeframeType.CREATED:
        if ('created_at' in risk && risk.created_at) {
          return parseDate(risk.created_at);
        }
        if ('date_of_assessment' in risk && risk.date_of_assessment) {
          return parseDate(risk.date_of_assessment);
        }
        return null;

      case AuditTimeframeType.UPDATED:
        if ('updated_at' in risk && risk.updated_at) {
          return parseDate(risk.updated_at);
        }
        return null;

      case AuditTimeframeType.DELETED:
        if ('deleted_at' in risk && risk.deleted_at) {
          return parseDate(risk.deleted_at);
        }
        return null;

      default:
        return null;
    }
  } catch (error) {
    console.error('Error parsing date from risk:', error);
    return null;
  }
};

export const filterRisksByTimeframe = <T extends RiskWithDates>(
  risks: T[],
  timeframe: IAuditTimeframe
): T[] => {
  if (!Array.isArray(risks)) {
    console.error('Invalid risks array provided to filterRisksByTimeframe');
    return [];
  }

  if (!timeframe.startDate && !timeframe.endDate) {
    return risks;
  }

  const startDate = timeframe.startDate ? parseDate(timeframe.startDate) : null;
  const endDate = timeframe.endDate ? parseDate(timeframe.endDate) : null;

  return risks.filter((risk) => {
    const riskDate = getDateFromRisk(risk, timeframe.type);
    
    if (!riskDate || !isValidDate(riskDate)) {
      return false;
    }

    if (startDate && isValidDate(startDate) && riskDate < startDate) {
      return false;
    }

    if (endDate && isValidDate(endDate) && riskDate > endDate) {
      return false;
    }

    return true;
  });
};

export const getAvailableTimeframeTypes = (
  riskType: 'project' | 'vendor' | 'model'
): AuditTimeframeType[] => {
  switch (riskType) {
    case 'project':
      return [AuditTimeframeType.CREATED, AuditTimeframeType.DELETED];
    case 'vendor':
      return [AuditTimeframeType.CREATED, AuditTimeframeType.UPDATED, AuditTimeframeType.DELETED];
    case 'model':
      return [AuditTimeframeType.CREATED, AuditTimeframeType.UPDATED, AuditTimeframeType.DELETED];
    default:
      return [AuditTimeframeType.CREATED, AuditTimeframeType.UPDATED, AuditTimeframeType.DELETED];
  }
};

export const getRiskCountsByTimeframe = <T extends RiskWithDates>(
  risks: T[],
  timeframe: IAuditTimeframe,
  groupBy: 'day' | 'week' | 'month' = 'month'
): { date: string; count: number }[] => {
  try {
    const filteredRisks = filterRisksByTimeframe(risks, timeframe);
    const countMap = new Map<string, number>();

    filteredRisks.forEach((risk) => {
      const riskDate = getDateFromRisk(risk, timeframe.type);
      if (!riskDate || !isValidDate(riskDate)) return;

      let dateKey: string;

      try {
        switch (groupBy) {
          case 'day':
            dateKey = riskDate.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(riskDate);
            weekStart.setDate(riskDate.getDate() - riskDate.getDay());
            dateKey = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            dateKey = `${riskDate.getFullYear()}-${String(riskDate.getMonth() + 1).padStart(2, '0')}`;
            break;
          default:
            dateKey = riskDate.toISOString().split('T')[0];
        }

        countMap.set(dateKey, (countMap.get(dateKey) || 0) + 1);
      } catch (dateError) {
        console.error('Error processing date for risk:', dateError);
      }
    });

    return Array.from(countMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error in getRiskCountsByTimeframe:', error);
    return [];
  }
};