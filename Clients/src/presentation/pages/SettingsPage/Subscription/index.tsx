import React, { useEffect, useState, useCallback } from "react";
import { Grid, Card, CardContent, CardActions, Button, Typography, Stack, CircularProgress, Box, SvgIcon, Alert, Tooltip } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useSubscriptionManagement } from "../../../../application/hooks/useSubscriptionManagement";
import { useSubscriptionData } from "../../../../application/hooks/useSubscriptionData";
import { extractUserToken } from "../../../../application/tools/extractToken";
import { getAuthToken } from "../../../../application/redux/auth/getAuthToken";
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined'; 
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';               
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined'; 
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';          
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';  
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getAllTiers } from "../../../../application/repository/tiers.repository";
import { useDashboard } from "../../../../application/hooks/useDashboard";

const pricingUrlMap = {
  Team: 'https://buy.stripe.com/6oU7sK74p75f6kyfB5a7C09',
  Business: 'https://buy.stripe.com/eVq00i4Wh61b6kybkPa7C0a',
  Enterprise: 'https://buy.stripe.com/cNidR8fAVfBL10e9cHa7C0b',
};

const iconMap = {
  Free: MonetizationOnOutlinedIcon,
  Team: PeopleOutlineIcon,
  Business: BusinessCenterOutlinedIcon,
  Enterprise: ApartmentOutlinedIcon,
};

type Tier = { id: number; name: string; price: number | null; features?: Record<string, string | number> };

const Subscription: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState<boolean>(false);

  const userToken = extractUserToken(getAuthToken());
  const organizationId = userToken?.organizationId;

  const [allTiers, setAllTiers] = useState<Tier[]>([]);

  const clearSearchParams = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  useEffect(() => {
    const fetchAllTiers = async () => {
      const allTiers = await getAllTiers({});
      setAllTiers(allTiers);
    };
    fetchAllTiers();
  }, []);
  
  const { organizationTierId, loading, error: dataError, refetch: refetchSubscriptionData } = useSubscriptionData();
  const { dashboard, fetchDashboard } = useDashboard();

  useEffect(() => {
    const fetchProjects = async () => {
      await fetchDashboard();
    };
    fetchProjects();
  }, [fetchDashboard]);

  const {
    isProcessing,
    error: subscriptionError,
    success: subscriptionSuccess,
    processSubscription,
    clearError,
    clearSuccess,
  } = useSubscriptionManagement();


  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const tierId = searchParams.get("tierId");

    if (sessionId && tierId && organizationId) {
      setShowPaymentSuccess(true);

      processSubscription(Number(organizationId), Number(tierId), sessionId)
        .then((success) => {
          if (success) {
            console.log("Subscription processed successfully");
            // Refetch subscription data to get updated orgTierId
            refetchSubscriptionData();
          }
        });

      const timer = setTimeout(() => {
        setShowPaymentSuccess(false);
        clearSuccess();
        clearSearchParams();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, organizationId, processSubscription, clearSuccess, clearSearchParams, refetchSubscriptionData]);


  const handleSubscribe = (tierId: number) => {
    if (dashboard?.projects >= Number(allTiers?.find((tier: Tier) => tier.id === tierId)?.features?.projects)) {
      setAlertMessage("You can't subscribe to this tier since the project exceeds the limit. Doing so will make you unable to use VerifyWise.");
      return;
    } else {
      const url = `${pricingUrlMap[allTiers.find((tier: Tier) => tier.id === tierId)?.name as keyof typeof pricingUrlMap]}`;
      window.location.href = url;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={4} sx={{ mt: 3 }}>
    {alertMessage && (
      <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setAlertMessage('')}>
        {alertMessage}
      </Alert>
    )}
    
    {showPaymentSuccess && subscriptionSuccess && (
      <Alert severity="success" sx={{ mb: 2 }}>
        Payment successful! Your subscription has been updated. Thank you for your purchase.
      </Alert>
    )}
    
    {subscriptionError && (
      <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
        Failed to process subscription: {subscriptionError}
      </Alert>
    )}
    
    {dataError && (
      <Alert severity="error" sx={{ mb: 2 }}>
        {dataError}
      </Alert>
    )}
    
    {isProcessing && (
      <Alert severity="info" sx={{ mb: 2 }}>
        Processing your subscription...
      </Alert>
    )}
    
    <Typography variant="h4" component="h1" align="center" fontWeight="bold">
      Choose Your Plan
    </Typography>
 
    <Grid container spacing={3} alignItems="stretch" justifyContent="center">
      {allTiers?.map((tier: Tier) => {

        const PlanIcon = iconMap[tier?.name?.split(' ')[0] as keyof typeof iconMap] || HelpOutlineIcon;

        return (
          <Grid item xs={12} sm={6} md={3} key={tier.id}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                borderColor: 'grey.300',
                p: 2, 
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack direction="row" alignItems="center" mb={10}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SvgIcon component={PlanIcon}/>
                  </Box>
                  <Typography variant="h6" fontWeight="bold">
                    {tier.name}
                  </Typography>
                </Stack>

                <Typography variant="h4" fontWeight="bold" component="div" sx={{ mb: 10 }}>
                  {tier.price === null ? 'Contact Us' : `$${tier.price}`}
                  {tier.price !== null && <Typography component="span" variant="subtitle1" color="text.secondary">/mo</Typography>}
                </Typography>

                <Stack spacing={5}>
                  {tier.features && Object.entries(tier.features).map(([key, value]) => (
                    <Stack direction="row" spacing={1.5} alignItems="center" key={key}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                      <Typography variant="body2">
                        <strong>{String(value) === '0' ? 'Unlimited' : String(value)}</strong> {key}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 1 }}>
              <Tooltip 
                title={
                  organizationTierId === tier.id || (tier.id === 1 && organizationTierId !== 1)
                    ? 'To cancel your subscription head over to stripe' 
                    : ''
                }
                arrow
                placement="bottom"
              >
                <span style={{ width: '100%', display: 'block' }}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={organizationTierId === tier.id || (tier.id === 1 && organizationTierId !== 1)}
                    sx={{
                      transition: 'transform 0.15s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.02)',
                      },
                    }}
                  >
                    {organizationTierId === tier.id ? 'Current Plan' : (tier.id === 1 && organizationTierId !== 1) ? 'Not Available' : 'Subscribe'}
                  </Button>
                </span>
              </Tooltip>
            </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  </Stack>
  );
};

export default Subscription;
