import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  TablePagination,
  Stack,
  useTheme,
} from '@mui/material';
import { ChevronDown, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle, Timer, ArrowRight } from 'lucide-react';
import CustomAxios from '../../../../../infrastructure/api/customAxios';
import { AutomationExecutionLog } from '../../../../../domain/types/Automation';
import SmallStatsCard from '../../../../components/Cards/SmallStatsCard';
import TablePaginationActions from '../../../../components/TablePagination';
import EmptyState from '../../../../components/EmptyState';
import singleTheme from '../../../../themes/v1SingleTheme';
import { ChevronsUpDown } from 'lucide-react';

interface AutomationHistoryProps {
  automationId: string;
}

const AutomationHistory: React.FC<AutomationHistoryProps> = ({ automationId }) => {
  const theme = useTheme();
  const [logs, setLogs] = useState<AutomationExecutionLog[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    last_execution_at?: Date;
  } | null>(null);

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [automationId, page, rowsPerPage]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await CustomAxios.get(
        `/automations/${automationId}/history`,
        {
          params: {
            limit: rowsPerPage,
            offset: page * rowsPerPage,
          },
        }
      );

      if (response.data?.data) {
        setLogs(response.data.data.logs || []);
        setTotal(response.data.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching automation history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await CustomAxios.get(`/automations/${automationId}/stats`);
      if (response.data?.data) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching automation stats:', error);
    }
  };

  const toggleRow = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: 'success' | 'partial_success' | 'failure') => {
    const styles = {
      success: { bg: '#E6F4EA', color: '#138A5E', icon: <CheckCircle size={14} /> },
      partial_success: { bg: '#FFF8E1', color: '#795000', icon: <AlertCircle size={14} /> },
      failure: { bg: '#FFD6D6', color: '#D32F2F', icon: <XCircle size={14} /> },
    };

    const style = styles[status];
    const label = status === 'partial_success' ? 'Partial Success' : status.charAt(0).toUpperCase() + status.slice(1);

    return (
      <span
        style={{
          backgroundColor: style.bg,
          color: style.color,
          padding: '4px 8px',
          borderRadius: '4px',
          fontWeight: 500,
          fontSize: '11px',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {style.icon}
        {label}
      </span>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatExecutionTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const getTriggerType = (triggerData: Record<string, any>) => {
    // Extract trigger type from trigger data if available
    if (triggerData?.trigger_type) {
      return formatActionType(triggerData.trigger_type);
    }
    return 'Manual';
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading && logs.length === 0) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          border: '1px solid #EEEEEE',
          borderRadius: '4px',
          padding: theme.spacing(15, 5),
          minHeight: 200,
        }}
      >
        <Typography>Loading execution history...</Typography>
      </Stack>
    );
  }

  return (
    <Box>
      {/* Stats Summary */}
      {stats && (
        <Stack direction="row" spacing={3} mb={3} flexWrap="wrap">
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <SmallStatsCard
              attributeTitle="Total Runs"
              rate={stats.total_executions > 0 ? stats.successful_executions / stats.total_executions : 0}
              progress={`${stats.successful_executions}/${stats.total_executions}`}
            />
          </Box>
          <Box
            sx={{
              flex: 1,
              minWidth: 150,
              border: '1px solid #EEEEEE',
              borderRadius: '4px',
              padding: 2,
              backgroundColor: '#FAFAFA',
            }}
          >
            <Typography sx={{ fontSize: 13, color: '#8594AC', mb: 1 }}>
              Successful
            </Typography>
            <Typography sx={{ fontSize: 24, color: '#138A5E', fontWeight: 700 }}>
              {stats.successful_executions}
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              minWidth: 150,
              border: '1px solid #EEEEEE',
              borderRadius: '4px',
              padding: 2,
              backgroundColor: '#FAFAFA',
            }}
          >
            <Typography sx={{ fontSize: 13, color: '#8594AC', mb: 1 }}>
              Failed
            </Typography>
            <Typography sx={{ fontSize: 24, color: '#DB504A', fontWeight: 700 }}>
              {stats.failed_executions}
            </Typography>
          </Box>
        </Stack>
      )}

      {/* Execution History Table */}
      {logs.length === 0 ? (
        <EmptyState message="No execution history yet" />
      ) : (
        <Stack spacing={0}>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={singleTheme.tableStyles.primary.frame}>
              <TableHead sx={{ backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors }}>
                <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: '50px' }} />
                  <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Triggered At</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Trigger Type</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Status</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Actions</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Execution Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <TableRow
                      sx={{
                        ...singleTheme.tableStyles.primary.body.row,
                        '&:hover': { backgroundColor: '#FBFBFB', cursor: 'pointer' },
                        '& td': {
                          borderBottom: '4px solid #FAFAFA',
                        },
                      }}
                    >
                      <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, width: '50px' }}>
                        <IconButton size="small" onClick={() => toggleRow(log.id)}>
                          {expandedRows.has(log.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </IconButton>
                      </TableCell>
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Clock size={14} color="#8594AC" />
                          <Typography sx={{ fontSize: 13 }}>
                            {formatDate(log.triggered_at)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        <Typography sx={{ fontSize: 13 }}>
                          {getTriggerType(log.trigger_data || {})}
                        </Typography>
                      </TableCell>
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        {getStatusBadge(log.status)}
                      </TableCell>
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        <Typography sx={{ fontSize: 13 }}>
                          {log.actions?.length || 0} action{log.actions?.length !== 1 ? 's' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Timer size={14} color="#8594AC" />
                          <Typography sx={{ fontSize: 13 }}>
                            {formatExecutionTime(log.execution_time_ms)}
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(log.id) && (
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                          <Collapse in={true} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Execution Details
                          </Typography>

                          {/* Trigger Data */}
                          {log.trigger_data && Object.keys(log.trigger_data).length > 0 && (
                            <Box mb={2}>
                              <Typography variant="subtitle2" gutterBottom>
                                Trigger Parameters
                              </Typography>
                              <Table size="small">
                                <TableBody>
                                  {Object.entries(log.trigger_data)
                                    .filter(([key]) => !['tenant', 'automation_id'].includes(key))
                                    .map(([key, value]) => {
                                      let displayValue: React.ReactNode;

                                      // Format arrays (like email recipients)
                                      if (Array.isArray(value)) {
                                        displayValue = value.join(', ');
                                      }
                                      // Format objects
                                      else if (typeof value === 'object' && value !== null) {
                                        displayValue = (
                                          <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                                            {JSON.stringify(value, null, 2)}
                                          </pre>
                                        );
                                      }
                                      // Format dates
                                      else if (key.includes('date') || key.includes('time')) {
                                        try {
                                          const date = new Date(value as string);
                                          if (!isNaN(date.getTime())) {
                                            displayValue = formatDate(date);
                                          } else {
                                            displayValue = String(value);
                                          }
                                        } catch {
                                          displayValue = String(value);
                                        }
                                      }
                                      // Format booleans
                                      else if (typeof value === 'boolean') {
                                        displayValue = value ? 'Yes' : 'No';
                                      }
                                      // Format primitives
                                      else {
                                        displayValue = String(value || '-');
                                      }

                                      // Format key for display (convert snake_case to Title Case)
                                      const displayKey = key
                                        .split('_')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ');

                                      return (
                                        <TableRow key={key}>
                                          <TableCell
                                            sx={{
                                              fontWeight: 600,
                                              verticalAlign: 'top',
                                              width: '200px',
                                              color: 'text.secondary'
                                            }}
                                          >
                                            {displayKey}
                                          </TableCell>
                                          <TableCell sx={{ verticalAlign: 'top' }}>
                                            <Typography variant="body2" component="div">
                                              {displayValue}
                                            </Typography>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                </TableBody>
                              </Table>
                            </Box>
                          )}

                          {/* Actions Results - Step-by-Step Timeline */}
                          {log.actions && log.actions.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                                Execution Flow ({log.actions.length} {log.actions.length === 1 ? 'step' : 'steps'})
                              </Typography>

                              {/* Timeline */}
                              <Box sx={{ position: 'relative', pl: 2 }}>
                                {log.actions.map((action, idx) => {
                                  const isSuccess = action.status === 'success';
                                  const isLastStep = idx === log.actions.length - 1;

                                  return (
                                    <Box key={idx} sx={{ position: 'relative', pb: isLastStep ? 0 : 3 }}>
                                      {/* Vertical Line */}
                                      {!isLastStep && (
                                        <Box
                                          sx={{
                                            position: 'absolute',
                                            left: '15px',
                                            top: '32px',
                                            bottom: '-8px',
                                            width: '2px',
                                            backgroundColor: '#E0E0E0',
                                          }}
                                        />
                                      )}

                                      {/* Step Container */}
                                      <Stack direction="row" spacing={2} alignItems="flex-start">
                                        {/* Step Number with Icon */}
                                        <Box
                                          sx={{
                                            minWidth: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: isSuccess ? '#E6F4EA' : '#FFD6D6',
                                            border: `2px solid ${isSuccess ? '#138A5E' : '#D32F2F'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative',
                                            zIndex: 1,
                                          }}
                                        >
                                          {isSuccess ? (
                                            <CheckCircle size={16} color="#138A5E" />
                                          ) : (
                                            <XCircle size={16} color="#D32F2F" />
                                          )}
                                        </Box>

                                        {/* Step Content */}
                                        <Box
                                          sx={{
                                            flex: 1,
                                            border: '1px solid #EEEEEE',
                                            borderRadius: '8px',
                                            padding: '12px 16px',
                                            backgroundColor: '#FAFAFA',
                                          }}
                                        >
                                          {/* Step Header */}
                                          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                              <Typography sx={{ fontSize: 11, color: '#8594AC', fontWeight: 600 }}>
                                                STEP {idx + 1}
                                              </Typography>
                                              <ArrowRight size={12} color="#8594AC" />
                                              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#2D3748' }}>
                                                {formatActionType(action.action_type)}
                                              </Typography>
                                            </Stack>

                                            <span
                                              style={{
                                                backgroundColor: isSuccess ? '#E6F4EA' : '#FFD6D6',
                                                color: isSuccess ? '#138A5E' : '#D32F2F',
                                                padding: '3px 8px',
                                                borderRadius: '4px',
                                                fontWeight: 600,
                                                fontSize: '10px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                              }}
                                            >
                                              {action.status}
                                            </span>
                                          </Stack>

                                          {/* Step Details */}
                                          <Stack spacing={1}>
                                            {action.executed_at && (
                                              <Stack direction="row" alignItems="center" spacing={1}>
                                                <Clock size={12} color="#8594AC" />
                                                <Typography sx={{ fontSize: 12, color: '#8594AC' }}>
                                                  {formatDate(action.executed_at)}
                                                </Typography>
                                              </Stack>
                                            )}

                                            {action.error_message && (
                                              <Box
                                                sx={{
                                                  backgroundColor: '#FFF5F5',
                                                  border: '1px solid #FED7D7',
                                                  borderRadius: '4px',
                                                  padding: '8px 12px',
                                                  mt: 1,
                                                }}
                                              >
                                                <Typography sx={{ fontSize: 12, color: '#D32F2F', fontWeight: 500 }}>
                                                  Error: {action.error_message}
                                                </Typography>
                                              </Box>
                                            )}

                                            {!action.error_message && action.result_data && (
                                              <Box
                                                sx={{
                                                  backgroundColor: '#F7FAFC',
                                                  border: '1px solid #E2E8F0',
                                                  borderRadius: '4px',
                                                  padding: '8px 12px',
                                                  mt: 1,
                                                }}
                                              >
                                                <Typography sx={{ fontSize: 11, color: '#4A5568', fontFamily: 'monospace' }}>
                                                  {JSON.stringify(action.result_data, null, 2)}
                                                </Typography>
                                              </Box>
                                            )}
                                          </Stack>
                                        </Box>
                                      </Stack>
                                    </Box>
                                  );
                                })}

                                {/* Final Result Summary */}
                                <Box
                                  sx={{
                                    mt: 3,
                                    p: 2,
                                    borderRadius: '8px',
                                    backgroundColor: log.status === 'success' ? '#E6F4EA' : log.status === 'failure' ? '#FFD6D6' : '#FFF8E1',
                                    border: `2px solid ${log.status === 'success' ? '#138A5E' : log.status === 'failure' ? '#D32F2F' : '#795000'}`,
                                  }}
                                >
                                  <Stack direction="row" alignItems="center" spacing={2}>
                                    {log.status === 'success' ? (
                                      <CheckCircle size={20} color="#138A5E" />
                                    ) : log.status === 'failure' ? (
                                      <XCircle size={20} color="#D32F2F" />
                                    ) : (
                                      <AlertCircle size={20} color="#795000" />
                                    )}
                                    <Box>
                                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: log.status === 'success' ? '#138A5E' : log.status === 'failure' ? '#D32F2F' : '#795000' }}>
                                        Overall Result: {log.status === 'partial_success' ? 'Partial Success' : log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                      </Typography>
                                      {log.status === 'partial_success' && (
                                        <Typography sx={{ fontSize: 12, color: '#795000', mt: 0.5 }}>
                                          Some actions completed successfully, but others failed
                                        </Typography>
                                      )}
                                      {log.execution_time_ms && (
                                        <Typography sx={{ fontSize: 11, color: '#8594AC', mt: 0.5 }}>
                                          Total execution time: {formatExecutionTime(log.execution_time_ms)}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Stack>
                                </Box>
                              </Box>
                            </Box>
                          )}

                          {/* Error Message */}
                          {log.error_message && (
                            <Box mt={2}>
                              <Typography variant="caption" color="error">
                                Error: {log.error_message}
                              </Typography>
                            </Box>
                          )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Table>
            <TableBody>
              <TableRow>
                <TablePagination
                  count={total}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={(props) => <TablePaginationActions {...props} />}
                  labelRowsPerPage="Rows per page"
                  labelDisplayedRows={({ page, count }) =>
                    `Page ${page + 1} of ${Math.max(0, Math.ceil(count / rowsPerPage))}`
                  }
                  slotProps={{
                    select: {
                      MenuProps: {
                        keepMounted: true,
                        PaperProps: {
                          className: 'pagination-dropdown',
                          sx: {
                            mt: 0,
                            mb: theme.spacing(2),
                          },
                        },
                        transformOrigin: {
                          vertical: 'bottom',
                          horizontal: 'left',
                        },
                        anchorOrigin: {
                          vertical: 'top',
                          horizontal: 'left',
                        },
                        sx: { mt: theme.spacing(-2) },
                      },
                      inputProps: { id: 'pagination-dropdown' },
                      IconComponent: ChevronsUpDown,
                      sx: {
                        ml: theme.spacing(4),
                        mr: theme.spacing(12),
                        minWidth: theme.spacing(20),
                        textAlign: 'left',
                        '&.Mui-focused > div': {
                          backgroundColor: theme.palette.background.main,
                        },
                      },
                    },
                  }}
                  sx={{
                    backgroundColor: theme.palette.grey[50],
                    border: `1px solid ${theme.palette.border?.light || '#EEEEEE'}`,
                    borderTop: 'none',
                    borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`,
                    color: theme.palette.text.secondary,
                    height: '50px',
                    minHeight: '50px',
                    '& .MuiTablePagination-toolbar': {
                      minHeight: '50px',
                      paddingTop: '4px',
                      paddingBottom: '4px',
                    },
                    '& .MuiSelect-icon': {
                      width: '24px',
                      height: 'fit-content',
                    },
                    '& .MuiSelect-select': {
                      width: theme.spacing(10),
                      borderRadius: theme.shape.borderRadius,
                      border: `1px solid ${theme.palette.border?.light || '#EEEEEE'}`,
                      padding: theme.spacing(4),
                    },
                  }}
                />
              </TableRow>
            </TableBody>
          </Table>
        </Stack>
      )}
    </Box>
  );
};

export default AutomationHistory;
