import React from 'react';
import { Card, CardContent, Typography, Stack, Button, Box, Skeleton } from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowOutwardOutlinedIcon from '@mui/icons-material/ArrowOutwardOutlined';
import RiskChart from './RiskChart';
import RiskSummaryItem from './RiskSummaryItem';
import { RiskCardProps } from './types';

const StyledCard = styled(Card)(({ theme }) => ({
  border: `1px solid ${theme.palette.border?.light || '#EAECF0'}`,
  borderRadius: 4,
  backgroundColor: theme.palette.background.main,
  boxShadow: theme.boxShadow || 'none',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(3),
  paddingBottom: `${theme.spacing(3)} !important`,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
}));

const ViewDetailsButton = styled(Button)(({ theme }) => ({
  border: `1px solid ${theme.palette.border?.dark || '#D0D5DD'}`,
  color: theme.palette.text.secondary,
  textTransform: 'none',
  borderRadius: 2,
  fontSize: 13,
  fontWeight: 400,
  height: 34,
  boxShadow: 'none',
  backgroundColor: theme.palette.background.main,
  '&:hover': {
    backgroundColor: theme.palette.background.fill || theme.palette.background.main,
    boxShadow: 'none',
  },
}));

const RiskCard: React.FC<RiskCardProps> = ({
  title,
  totalRisks,
  chartData,
  onViewDetails,
  loading = false,
}) => {
  if (loading) {
    return (
      <StyledCard>
        <StyledCardContent>
          <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
          <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mb: 2 }} />
          <Stack spacing={1}>
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} variant="text" width="80%" height={20} />
            ))}
          </Stack>
          <Skeleton variant="rectangular" width="100%" height={34} sx={{ mt: 'auto' }} />
        </StyledCardContent>
      </StyledCard>
    );
  }

  return (
    <StyledCard>
      <StyledCardContent>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: 'text.primary',
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: 24,
              fontWeight: 700,
              color: 'text.primary',
              lineHeight: 1,
            }}
          >
            {totalRisks}
          </Typography>
        </Stack>

        {/* Chart */}
        {totalRisks > 0 ? (
          <Box sx={{ mb: 2, flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <RiskChart data={chartData} width={280} height={180} />
          </Box>
        ) : (
          <Box 
            sx={{ 
              mb: 2, 
              flexGrow: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: 180,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              No risks found
            </Typography>
          </Box>
        )}

        {/* Risk Summary */}
        {totalRisks > 0 && (
          <Stack spacing={1} sx={{ mb: 2 }}>
            {chartData.map((item) => (
              <RiskSummaryItem
                key={item.id}
                label={item.label}
                count={item.value}
                level={item.id}
              />
            ))}
          </Stack>
        )}

        {/* View Details Button */}
        <ViewDetailsButton
          variant="outlined"
          onClick={onViewDetails}
          endIcon={<ArrowOutwardOutlinedIcon sx={{ fontSize: 16 }} />}
          sx={{ mt: 'auto' }}
        >
          View Details
        </ViewDetailsButton>
      </StyledCardContent>
    </StyledCard>
  );
};

export default RiskCard;