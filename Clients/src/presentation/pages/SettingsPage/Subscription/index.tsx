import React, { useEffect, useState } from "react";
import { Grid, Card, CardContent, CardActions, Button, Typography, Stack, CircularProgress, Box, SvgIcon, Alert } from "@mui/material";
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

const pricingUrlMap = {
  // Team: 'https://buy.stripe.com/6oU7sK74p75f6kyfB5a7C09',
  Team: 'https://buy.stripe.com/test_aFaeVe2Nl3Hp8EH4Hg7EQ00', // Testing
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
  const [searchParams] = useSearchParams();
  const [showPaymentSuccess, setShowPaymentSuccess] = useState<boolean>(false);

  const userToken = extractUserToken(getAuthToken());
  const organizationId = userToken?.organizationId;

  const [allTiers, setAllTiers] = useState<Tier[]>([]);

  useEffect(() => {
    const fetchAllTiers = async () => {
      const allTiers = await getAllTiers({});
      setAllTiers(allTiers);
    };
    fetchAllTiers();
  }, []);

  console.log(allTiers);
  
  const { tierFeatures, organizationTierId, loading, error: dataError } = useSubscriptionData();

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
          }
        });

      const timer = setTimeout(() => {
        setShowPaymentSuccess(false);
        clearSuccess();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, organizationId, processSubscription, clearSuccess]);


  const handleSubscribe = (tierId: number) => {
    const url = `${pricingUrlMap[allTiers.find((tier: Tier) => tier.id === tierId)?.name as keyof typeof pricingUrlMap]}`;
    window.location.href = url;
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
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => handleSubscribe(tier.id)}
                disabled={organizationTierId === tier.id}
                sx={{
                  transition: 'transform 0.15s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
              >
                {organizationTierId === tier.id ? 'Current Plan' : 'Subscribe'}
              </Button>
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
