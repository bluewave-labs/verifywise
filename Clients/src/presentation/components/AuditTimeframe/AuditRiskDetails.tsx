import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Collapse,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { IAuditTimeframe, AuditTimeframeType } from './index';
import { 
  filterRisksByTimeframe, 
  RiskWithDates, 
  getDateFromRisk,
  getRiskId,
  getRiskName,
  getRiskLevel,
  getRiskStatus,
  getVendorName,
  isValidDate
} from './utils';

export interface IAuditRiskDetailsProps {
  risks: RiskWithDates[];
  timeframe: IAuditTimeframe;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  loading?: boolean;
  error?: string | null;
}

const TIMEFRAME_LABELS = {
  [AuditTimeframeType.CREATED]: 'Created',
  [AuditTimeframeType.UPDATED]: 'Updated',
  [AuditTimeframeType.DELETED]: 'Deleted',
};

const AuditRiskDetails: React.FC<IAuditRiskDetailsProps> = ({
  risks,
  timeframe,
  isExpanded,
  onToggleExpanded,
  loading = false,
  error = null,
}) => {
  const theme = useTheme();

  const filteredRisks = useMemo(() => {
    try {
      if (!Array.isArray(risks)) {
        console.error('Invalid risks data provided');
        return [];
      }
      
      if (!timeframe.startDate && !timeframe.endDate) {
        return [];
      }
      
      return filterRisksByTimeframe(risks, timeframe);
    } catch (error) {
      console.error('Error filtering risks:', error);
      return [];
    }
  }, [risks, timeframe]);

  const risksWithTimestamps = useMemo(() => {
    try {
      return filteredRisks.map((risk) => {
        const timestamp = getDateFromRisk(risk, timeframe.type);
        return {
          ...risk,
          auditTimestamp: timestamp,
        };
      })
      .filter(risk => risk.auditTimestamp && isValidDate(risk.auditTimestamp))
      .sort((a, b) => {
        const dateA = a.auditTimestamp!;
        const dateB = b.auditTimestamp!;
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error processing risks with timestamps:', error);
      return [];
    }
  }, [filteredRisks, timeframe.type]);

  // Using the helper functions from utils.ts for consistent property access

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return '#f04438';
      case 'in progress': return '#f79009';
      case 'resolved': case 'completed': return '#12b76a';
      case 'deleted': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': case 'catastrophic': return '#dc2626';
      case 'high': case 'major': return '#ea580c';
      case 'medium': case 'moderate': return '#d97706';
      case 'low': case 'minor': return '#65a30d';
      case 'negligible': return '#16a34a';
      default: return '#6b7280';
    }
  };

  if (!timeframe.startDate && !timeframe.endDate) {
    return null;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading risk details: {error}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: theme.shape.borderRadius,
        backgroundColor: theme.palette.background.paper,
        mt: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing(4),
          borderBottom: isExpanded ? `1px solid ${theme.palette.border.light}` : 'none',
          cursor: 'pointer',
        }}
        onClick={onToggleExpanded}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton size="small" sx={{ padding: 0 }} disabled={loading}>
            {loading ? (
              <CircularProgress size={16} />
            ) : isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            {`${TIMEFRAME_LABELS[timeframe.type]} Risks Details`}
            {loading && ' (Loading...)'}
          </Typography>
          <Chip
            label={`${filteredRisks.length} risk${filteredRisks.length !== 1 ? 's' : ''}`}
            size="small"
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              fontWeight: 500,
              fontSize: 12,
              height: 20,
            }}
          />
        </Stack>
        {timeframe.startDate && timeframe.endDate && (
          <Typography variant="caption" sx={{ fontSize: 11, color: theme.palette.text.disabled }}>
            {`${timeframe.startDate.toLocaleDateString()} - ${timeframe.endDate.toLocaleDateString()}`}
          </Typography>
        )}
      </Box>

      <Collapse in={isExpanded}>
        {loading ? (
          <Box
            sx={{
              padding: theme.spacing(8),
              textAlign: 'center',
            }}
          >
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading risks...
            </Typography>
          </Box>
        ) : risksWithTimestamps.length === 0 ? (
          <Box
            sx={{
              padding: theme.spacing(8),
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No risks found for the selected timeframe
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Risk Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Risk Level</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Vendor</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{TIMEFRAME_LABELS[timeframe.type]} Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {risksWithTimestamps.map((risk, index) => {
                  const riskId = getRiskId(risk);
                  
                  return (
                    <TableRow
                      key={`${riskId}-${index}`}
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                      ...(risk.is_deleted && {
                        opacity: 0.7,
                        backgroundColor: theme.palette.action?.hover || '#fafafa',
                      })
                    }}
                  >
                    <TableCell 
                      sx={{ 
                        fontSize: 12,
                        maxWidth: 200,
                        ...(risk.is_deleted && {
                          textDecoration: 'line-through',
                        })
                      }}
                    >
                      <Typography variant="body2" sx={{ fontSize: 12 }}>
                        {(() => {
                          const name = getRiskName(risk);
                          return name.length > 50 ? `${name.slice(0, 50)}...` : name;
                        })()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      <Chip
                        label={getRiskLevel(risk)}
                        size="small"
                        sx={{
                          backgroundColor: getRiskLevelColor(getRiskLevel(risk)),
                          color: 'white',
                          fontWeight: 500,
                          fontSize: 11,
                          height: 20,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      <Chip
                        label={getRiskStatus(risk)}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(getRiskStatus(risk)),
                          color: 'white',
                          fontWeight: 500,
                          fontSize: 11,
                          height: 20,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      {getVendorName(risk)}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      {(() => {
                        if (!risk.auditTimestamp || !isValidDate(risk.auditTimestamp)) {
                          return 'N/A';
                        }
                        
                        try {
                          return risk.auditTimestamp.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                        } catch (error) {
                          console.error('Error formatting date:', error);
                          return 'Invalid Date';
                        }
                      })()}
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Collapse>
    </Box>
  );
};

export default AuditRiskDetails;