import React, { useEffect, useState, useCallback } from "react";
import { 
  Card, Button, Typography, Stack, CircularProgress, 
  Box, Alert, Tooltip, Table, TableBody, TableCell, TableContainer, 
  TableRow
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useSubscriptionManagement } from "../../../../application/hooks/useSubscriptionManagement";
import { useSubscriptionData } from "../../../../application/hooks/useSubscriptionData";
import { extractUserToken } from "../../../../application/tools/extractToken";
import { getAuthToken } from "../../../../application/redux/auth/getAuthToken";
  
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { getAllTiers } from "../../../../application/repository/tiers.repository";
import { useDashboard } from "../../../../application/hooks/useDashboard";

const pricingUrlMap = {
  Team: 'https://buy.stripe.com/6oU7sK74p75f6kyfB5a7C09',
  Business: 'https://buy.stripe.com/eVq00i4Wh61b6kybkPa7C0a',
  Enterprise: 'https://buy.stripe.com/cNidR8fAVfBL10e9cHa7C0b',
};

// Enhanced pricing plans with detailed features for comparison table
const ENHANCED_PLAN_FEATURES = {
  'Free': {
    description: 'Perfect for getting started',
    popular: false,
    features: {
      'Core Features': {
        'Seats': '1 seat',
        'Projects': '1 project',
        'Frameworks': '1 framework'
      },
      'AI Governance Features': {
        'Project risks': true,
        'Reports': true,
        'Evidence center': true,
        'Vendor & risk module': true,
        'Bias & fairness check': true,
        'AI policy manager': true,
        'Model inventory': true,
        'Tasks': true,
        'MIT AI risk inventory': true,
        'AI trust center': true,
        'Audit logs': true,
        'AI training register': true
      },
      'Support & Training': {
        'Support': 'Email support',
        'Private Discord channel': false,
        'Response SLA': '24 hours',
        'Training': false
      }
    }
  },
  'Team': {
    description: 'Ideal for small teams',
    popular: false,
    features: {
      'Core Features': {
        'Seats': 'Unlimited seats',
        'Projects': '10 projects',
        'Frameworks': 'All frameworks'
      },
      'AI Governance Features': {
        'Project risks': true,
        'Reports': true,
        'Evidence center': true,
        'Vendor & risk module': true,
        'Bias & fairness check': true,
        'AI policy manager': true,
        'Model inventory': true,
        'Tasks': true,
        'MIT AI risk inventory': true,
        'AI trust center': true,
        'Audit logs': true,
        'AI training register': true
      },
      'Support & Training': {
        'Support': 'Email support',
        'Private Discord channel': false,
        'Response SLA': '12 hours',
        'Training': false
      }
    }
  },
  'Growth': {
    description: 'Best for growing organizations',
    popular: true,
    features: {
      'Core Features': {
        'Seats': 'Unlimited seats',
        'Projects': '50 projects',
        'Frameworks': 'All frameworks'
      },
      'AI Governance Features': {
        'Project risks': true,
        'Reports': true,
        'Evidence center': true,
        'Vendor & risk module': true,
        'Bias & fairness check': true,
        'AI policy manager': true,
        'Model inventory': true,
        'Tasks': true,
        'MIT AI risk inventory': true,
        'AI trust center': true,
        'Audit logs': true,
        'AI training register': true
      },
      'Support & Training': {
        'Support': 'Priority email support',
        'Private Discord channel': true,
        'Response SLA': '4 hours',
        'Training': false
      }
    }
  },
  'Business': {
    description: 'Best for growing organizations',
    popular: true,
    features: {
      'Core Features': {
        'Seats': 'Unlimited seats',
        'Projects': '50 projects',
        'Frameworks': 'All frameworks'
      },
      'AI Governance Features': {
        'Project risks': true,
        'Reports': true,
        'Evidence center': true,
        'Vendor & risk module': true,
        'Bias & fairness check': true,
        'AI policy manager': true,
        'Model inventory': true,
        'Tasks': true,
        'MIT AI risk inventory': true,
        'AI trust center': true,
        'Audit logs': true,
        'AI training register': true
      },
      'Support & Training': {
        'Support': 'Email support',
        'Private Discord channel': true,
        'Response SLA': '8 hours',
        'Training': 'Two onboarding workshops'
      }
    }
  },
  'Enterprise': {
    description: 'For large enterprises',
    popular: false,
    features: {
      'Core Features': {
        'Seats': 'Unlimited seats',
        'Projects': 'Unlimited projects',
        'Frameworks': 'All frameworks'
      },
      'AI Governance Features': {
        'Project risks': true,
        'Reports': true,
        'Evidence center': true,
        'Vendor & risk module': true,
        'Bias & fairness check': true,
        'AI policy manager': true,
        'Model inventory': true,
        'Tasks': true,
        'MIT AI risk inventory': true,
        'AI trust center': true,
        'Audit logs': true,
        'AI training register': true
      },
      'Support & Training': {
        'Support': 'Phone + email support',
        'Private Discord channel': true,
        'Response SLA': '4 hours',
        'Training': 'Two onboarding workshops'
      }
    }
  }
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
    const selectedTier = allTiers?.find((tier: Tier) => tier.id === tierId);
    const projectLimit = Number(selectedTier?.features?.projects);
    
    // If project limit is 0, it means unlimited projects (Enterprise tier)
    // Only show warning if tier has a project limit > 0 and current projects exceed that limit
    if (projectLimit > 0 && dashboard?.projects >= projectLimit) {
      setAlertMessage("You can't subscribe to this tier since the project exceeds the limit. Doing so will make you unable to use VerifyWise.");
      return;
    } else {
      const url = `${pricingUrlMap[selectedTier?.name as keyof typeof pricingUrlMap]}`;
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


  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
      ) : (
        <CloseIcon sx={{ color: 'action.disabled', fontSize: 20 }} />
      );
    }
    return (
      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
        {value}
      </Typography>
    );
  };

  // Get feature categories for comparison table
  const getFeatureCategories = () => {
    if (!allTiers.length) return [];
    
    const sampleTier = allTiers.find(tier => ENHANCED_PLAN_FEATURES[tier.name]);
    if (!sampleTier) return [];
    
    const enhancedFeatures = ENHANCED_PLAN_FEATURES[sampleTier.name].features;
    return Object.keys(enhancedFeatures);
  };

  const getFeaturesByCategory = (category: string) => {
    if (!allTiers.length) return [];
    
    const sampleTier = allTiers.find(tier => ENHANCED_PLAN_FEATURES[tier.name]);
    if (!sampleTier) return [];
    
    const enhancedFeatures = ENHANCED_PLAN_FEATURES[sampleTier.name].features;
    return Object.keys(enhancedFeatures[category] || {});
  };

  return (
    <Box sx={{ mt: 3, px: 3, maxWidth: '100%' }}>
      <Stack spacing={4}>
        {/* Alert Messages */}
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
        
        <Typography 
          component="h1" 
          align="center" 
          sx={{
            fontSize: 24,
            color: "#2D3748",
            fontWeight: 600,
            mb: 2
          }}
        >
          Choose Your Plan
        </Typography>

        <Typography 
          align="center" 
          variant="body2" 
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          If you are looking for on-premise, air-gapped deployment, please{' '}
          <Typography 
            component="a" 
            href="https://verifywise.ai/contact" 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ 
              color: 'primary.main', 
              textDecoration: 'underline',
              '&:hover': {
                textDecoration: 'none'
              }
            }}
          >
            contact us
          </Typography>
        </Typography>

        {/* Unified Pricing and Features Table */}
        <Card variant="outlined" sx={{ borderRadius: '8px' }}>
            <TableContainer>
              <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
                <TableBody>
                  {/* Pricing Header Rows */}

                  {/* Plan Name Row */}
                  <TableRow>
                    <TableCell sx={{ width: '25%', py: 2, borderRight: 1, borderColor: 'grey.200' }}>
                      {/* Empty cell for feature column */}
                    </TableCell>
                    {allTiers?.map((tier: Tier) => (
                        <TableCell key={`name-${tier.id}`} align="center" sx={{ width: '18.75%', py: 2, borderRight: tier.id !== allTiers[allTiers.length - 1]?.id ? 1 : 0, borderColor: 'grey.200' }}>
                          <Typography variant="h6" fontWeight="bold">
                            {tier.name}
                          </Typography>
                        </TableCell>
                    ))}
                  </TableRow>

                  {/* Price Row */}
                  <TableRow>
                    <TableCell sx={{ width: '25%', py: 2, borderRight: 1, borderColor: 'grey.200' }}>
                      {/* Empty cell for feature column */}
                    </TableCell>
                    {allTiers?.map((tier: Tier) => (
                      <TableCell key={`price-${tier.id}`} align="center" sx={{ width: '18.75%', py: 2, borderRight: tier.id !== allTiers[allTiers.length - 1]?.id ? 1 : 0, borderColor: 'grey.200' }}>
                        <Typography variant="h5" fontWeight="bold" color="primary.main">
                          {tier.price === null ? 'Contact Us' : `$${tier.price}`}
                          {tier.price !== null && (
                            <Typography component="span" variant="body2" color="text.secondary">
                              /month
                            </Typography>
                          )}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Description Row */}
                  <TableRow>
                    <TableCell sx={{ width: '25%', py: 2, borderRight: 1, borderColor: 'grey.200' }}>
                      {/* Empty cell for feature column */}
                    </TableCell>
                    {allTiers?.map((tier: Tier) => {
                      const enhancedPlan = ENHANCED_PLAN_FEATURES[tier.name];
                      return (
                        <TableCell key={`desc-${tier.id}`} align="center" sx={{ width: '18.75%', py: 2, borderRight: tier.id !== allTiers[allTiers.length - 1]?.id ? 1 : 0, borderColor: 'grey.200' }}>
                          <Typography variant="body2" color="text.secondary">
                            {enhancedPlan?.description || 'Choose this plan for your needs'}
                          </Typography>
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* CTA Button Row */}
                  <TableRow sx={{ borderBottom: 2, borderColor: 'grey.300' }}>
                    <TableCell sx={{ width: '25%', py: 2, borderRight: 1, borderColor: 'grey.200' }}>
                      {/* Empty cell for feature column */}
                    </TableCell>
                    {allTiers?.map((tier: Tier) => (
                      <TableCell key={`cta-${tier.id}`} align="center" sx={{ width: '18.75%', py: 2, borderRight: tier.id !== allTiers[allTiers.length - 1]?.id ? 1 : 0, borderColor: 'grey.200' }}>
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
                              size="medium"
                              onClick={() => handleSubscribe(tier.id)}
                              disabled={organizationTierId === tier.id || (tier.id === 1 && organizationTierId !== 1)}
                              endIcon={<ArrowForwardIcon />}
                              disableRipple={true}
                              sx={{
                                bgcolor: 'primary.main',
                                '&:hover': {
                                  bgcolor: 'primary.dark',
                                  transform: 'scale(1.02)',
                                },
                                transition: 'all 0.15s ease-in-out',
                              }}
                            >
                              {organizationTierId === tier.id ? 'Current Plan' : (tier.id === 1 && organizationTierId !== 1) ? 'Not Available' : 'Subscribe'}
                            </Button>
                          </span>
                        </Tooltip>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Feature Categories */}
                  {getFeatureCategories().map((category) => (
                    <React.Fragment key={category}>
                      {/* Category Header */}
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell colSpan={allTiers.length + 1} sx={{ py: 2, borderBottom: 1, borderColor: 'grey.200' }}>
                          <Typography variant="h6" fontWeight="semibold" color="text.primary">
                            {category}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      
                      {/* Feature Rows */}
                      {getFeaturesByCategory(category).map((feature) => (
                        <TableRow key={feature} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                          <TableCell sx={{ width: '25%', py: 2, borderRight: 1, borderColor: 'grey.200' }}>
                            <Typography variant="body2" fontWeight="medium">
                              {feature}
                            </Typography>
                          </TableCell>
                          
                          {allTiers.map((tier: Tier) => {
                            const enhancedPlan = ENHANCED_PLAN_FEATURES[tier.name];
                            const featureValue = enhancedPlan?.features[category]?.[feature];
                            
                            return (
                              <TableCell key={tier.id} align="center" sx={{ width: '18.75%', py: 2, borderRight: tier.id !== allTiers[allTiers.length - 1]?.id ? 1 : 0, borderColor: 'grey.200' }}>
                                {renderFeatureValue(featureValue || false)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
      </Stack>
    </Box>
  );
};

export default Subscription;
