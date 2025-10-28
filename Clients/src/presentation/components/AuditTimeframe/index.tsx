import React, { useCallback, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Select,
  MenuItem,
  FormControl,
  useTheme,
  SelectChangeEvent,
  Alert,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { isValidDate, parseDate } from './utils';

export enum AuditTimeframeType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
}

export interface IAuditTimeframe {
  type: AuditTimeframeType;
  startDate: Date | null;
  endDate: Date | null;
}

export interface IAuditTimeframeProps {
  value: IAuditTimeframe;
  onChange: (timeframe: IAuditTimeframe) => void;
  availableTypes?: AuditTimeframeType[];
  label?: string;
  disabled?: boolean;
  showValidation?: boolean;
}

const TIMEFRAME_LABELS = {
  [AuditTimeframeType.CREATED]: 'Created Date',
  [AuditTimeframeType.UPDATED]: 'Updated Date',
  [AuditTimeframeType.DELETED]: 'Deleted Date',
};

const AuditTimeframe: React.FC<IAuditTimeframeProps> = ({
  value,
  onChange,
  availableTypes = [AuditTimeframeType.CREATED, AuditTimeframeType.UPDATED, AuditTimeframeType.DELETED],
  label = 'Audit Timeframe',
  disabled = false,
  showValidation = true,
}) => {
  const theme = useTheme();

  // Validation
  const validationError = useMemo(() => {
    if (!showValidation) return null;
    
    if (value.startDate && !isValidDate(value.startDate)) {
      return 'Invalid start date';
    }
    if (value.endDate && !isValidDate(value.endDate)) {
      return 'Invalid end date';
    }
    if (value.startDate && value.endDate && value.startDate > value.endDate) {
      return 'Start date must be before end date';
    }
    return null;
  }, [value.startDate, value.endDate, showValidation]);

  const handleTypeChange = useCallback(
    (event: SelectChangeEvent<AuditTimeframeType>) => {
      onChange({
        ...value,
        type: event.target.value as AuditTimeframeType,
      });
    },
    [value, onChange]
  );

  const handleStartDateChange = useCallback(
    (newValue: Dayjs | null) => {
      try {
        const date = newValue ? newValue.toDate() : null;
        const validatedDate = date && isValidDate(date) ? date : null;
        
        onChange({
          ...value,
          startDate: validatedDate,
        });
      } catch (error) {
        console.error('Error handling start date change:', error);
        onChange({
          ...value,
          startDate: null,
        });
      }
    },
    [value, onChange]
  );

  const handleEndDateChange = useCallback(
    (newValue: Dayjs | null) => {
      try {
        const date = newValue ? newValue.toDate() : null;
        const validatedDate = date && isValidDate(date) ? date : null;
        
        onChange({
          ...value,
          endDate: validatedDate,
        });
      } catch (error) {
        console.error('Error handling end date change:', error);
        onChange({
          ...value,
          endDate: null,
        });
      }
    },
    [value, onChange]
  );

  const startDateValue = useMemo(() => {
    if (!value.startDate) return null;
    try {
      const validDate = parseDate(value.startDate);
      return validDate ? dayjs(validDate) : null;
    } catch (error) {
      console.error('Error parsing start date:', error);
      return null;
    }
  }, [value.startDate]);

  const endDateValue = useMemo(() => {
    if (!value.endDate) return null;
    try {
      const validDate = parseDate(value.endDate);
      return validDate ? dayjs(validDate) : null;
    } catch (error) {
      console.error('Error parsing end date:', error);
      return null;
    }
  }, [value.endDate]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          border: `1px solid ${theme.palette.border.light}`,
          borderRadius: theme.shape.borderRadius,
          padding: theme.spacing(6),
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: theme.spacing(4),
          }}
        >
          {label}
        </Typography>

        {validationError && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: theme.spacing(4),
              fontSize: 12,
            }}
          >
            {validationError}
          </Alert>
        )}

        <Stack spacing={theme.spacing(4)}>
          <FormControl fullWidth size="small" disabled={disabled}>
            <Typography
              variant="body2"
              sx={{
                fontSize: 13,
                fontWeight: 500,
                color: theme.palette.text.secondary,
                mb: theme.spacing(2),
              }}
            >
              Date Type
            </Typography>
            <Select
              value={value.type}
              onChange={handleTypeChange}
              sx={{
                fontSize: 13,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.border.light,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.border.dark,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              {availableTypes.map((type) => (
                <MenuItem key={type} value={type} sx={{ fontSize: 13 }}>
                  {TIMEFRAME_LABELS[type]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={theme.spacing(4)}>
            <Box flex={1}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: theme.palette.text.secondary,
                  mb: theme.spacing(2),
                }}
              >
                Start Date
              </Typography>
              <DatePicker
                value={startDateValue}
                onChange={handleStartDateChange}
                disabled={disabled}
                format="MM/DD/YYYY"
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: {
                      fontSize: 13,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.border.light,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.border.dark,
                      },
                    },
                  },
                }}
              />
            </Box>

            <Box flex={1}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: theme.palette.text.secondary,
                  mb: theme.spacing(2),
                }}
              >
                End Date
              </Typography>
              <DatePicker
                value={endDateValue}
                onChange={handleEndDateChange}
                disabled={disabled}
                format="MM/DD/YYYY"
                minDate={startDateValue || undefined}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: {
                      fontSize: 13,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.border.light,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.border.dark,
                      },
                    },
                  },
                }}
              />
            </Box>
          </Stack>
        </Stack>
      </Box>
    </LocalizationProvider>
  );
};

export default AuditTimeframe;