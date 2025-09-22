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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { getAllTiers } from "../../../../application/repository/tiers.repository";
import { useDashboard } from "../../../../application/hooks/useDashboard";

const pricingUrlMap = {
  Business: 'https://buy.stripe.com/00w7sKgEZ75ffV8coTa7C0c', // Growth tier $799/mo
  Enterprise: 'https://verifywise.ai/contact', // Redirect to contact page for custom pricing
};

// Feature tooltips
const FEATURE_TOOLTIPS: Record<string, string> = {
  // Core Features
  'Seats': 'Number of team members who can access and use the VerifyWise platform simultaneously.',
  'Projects': 'Maximum number of AI projects you can manage and track within the platform at any given time.',
  'Frameworks': 'Access to different AI governance frameworks like EU AI Act, ISO 42001, NIST AI RMF, and custom frameworks.',

  // AI Governance Features
  'Project risks': 'Comprehensive risk assessment tools to identify, evaluate, and monitor potential risks across all your AI projects.',
  'Reports': 'Automated generation of compliance reports, audit documentation, and executive summaries for stakeholders.',
  'Evidence center': 'Centralized repository to store and manage all compliance documentation, audit trails, and evidence.',
  'Vendor & risk module': 'Tools to assess third-party AI vendors, manage supplier risks, and ensure supply chain compliance.',
  'Bias & fairness check': 'Automated testing and monitoring tools to detect and mitigate bias in AI models and ensure fairness.',
  'AI policy manager': 'Create, manage, and enforce AI governance policies across your organization with automated compliance tracking.',
  'Model inventory': 'Complete catalog of all AI models with detailed risk profiles, performance metrics, and lifecycle management.',
  'Tasks': 'Workflow management system to assign, track, and complete compliance tasks across teams.',
  'MIT AI risk inventory': 'Pre-built risk assessment framework based on MIT\'s AI risk categories and best practices.',
  'AI trust center': 'Public-facing portal to showcase your AI governance practices and build stakeholder confidence.',
  'Audit logs': 'Comprehensive activity tracking and logging system for compliance audits and regulatory requirements.',
  'AI training register': 'Documentation and tracking system for internal staff training activities, AI governance education, and compliance training records.',

  // Enterprise Features
  'Secure authentication with OpenID Connect': 'Secure authentication with OpenID Connect integration for streamlined access management.',
  'Custom integrations / development': 'Tailored API integrations and custom feature development to fit your specific workflow needs.',
  'On-prem deployment': 'Deploy VerifyWise on your own infrastructure for maximum security and data control.',

  // Support & Training
  'Support': 'Different levels of customer support including email, phone, and dedicated success managers.',
  'Private Slack/Teams channel': 'Exclusive access to a dedicated Slack or Microsoft Teams channel for direct communication with our team and other users.',
  'Response SLA': 'Guaranteed response times for support requests based on your plan level.',
  'Training': 'Comprehensive onboarding workshops and ongoing training sessions to maximize platform adoption.'
};

// Enhanced pricing plans with detailed features for comparison table
const ENHANCED_PLAN_FEATURES = {
  'Starter': {
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
        'Private Slack/Teams channel': false,
        'Response SLA': '24 hours',
        'Training': 'None'
      }
    }
  },
  'Growth': {
    description: 'Best for growing organizations',
    popular: true,
    features: {
      'Core Features': {
        'Seats': 'Unlimited seats',
        'Projects': '5 projects',
        'Frameworks': '2 frameworks'
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
        'Private Slack/Teams channel': true,
        'Response SLA': '12 hours',
        'Training': 'Remote training'
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
        'AI training register': true,
        'Secure authentication with OpenID Connect': true
      },
      'Support & Training': {
        'Support': 'Phone + email support',
        'Private Slack/Teams channel': true,
        'Response SLA': '6 hours',
        'Training': 'Custom training'
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
    if (!selectedTier) return;

    // Get project limit from enhanced features for accurate validation
    const planKey = selectedTier.name === 'Free' ? 'Starter' :
                  selectedTier.name === 'Business' ? 'Growth' :
                  selectedTier.name;
    const enhancedPlan = ENHANCED_PLAN_FEATURES[planKey as keyof typeof ENHANCED_PLAN_FEATURES];
    const projectLimitStr = enhancedPlan?.features['Core Features']?.['Projects'] as string;

    // Parse project limit (handle "Unlimited projects", "5 projects", etc.)
    let projectLimit = 0;
    if (projectLimitStr && !projectLimitStr.toLowerCase().includes('unlimited')) {
      const match = projectLimitStr.match(/\d+/);
      projectLimit = match ? parseInt(match[0]) : 0;
    }

    // If project limit is 0, it means unlimited projects (Enterprise tier)
    // Only show warning if tier has a project limit > 0 and current projects exceed that limit
    if (projectLimit > 0 && ((dashboard?.projects ?? 0) >= projectLimit)) {
      setAlertMessage("You can't subscribe to this tier since the project exceeds the limit. Doing so will make you unable to use VerifyWise.");
      return;
    } else {
      const url = `${pricingUrlMap[selectedTier.name as keyof typeof pricingUrlMap]}`;
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

    // Map tier name and find in enhanced features
    const sampleTier = allTiers.find(tier => {
      const planKey = tier.name === 'Free' ? 'Starter' :
                    tier.name === 'Business' ? 'Growth' :
                    tier.name;
      return ENHANCED_PLAN_FEATURES[planKey as keyof typeof ENHANCED_PLAN_FEATURES];
    });
    if (!sampleTier) return [];

    const planKey = sampleTier.name === 'Free' ? 'Starter' :
                  sampleTier.name === 'Business' ? 'Growth' :
                  sampleTier.name;
    const enhancedFeatures = ENHANCED_PLAN_FEATURES[planKey as keyof typeof ENHANCED_PLAN_FEATURES].features;
    return Object.keys(enhancedFeatures);
  };

  const getFeaturesByCategory = (category: string) => {
    if (!allTiers.length) return [];

    // Map tier name and find in enhanced features
    const sampleTier = allTiers.find(tier => {
      const planKey = tier.name === 'Free' ? 'Starter' :
                    tier.name === 'Business' ? 'Growth' :
                    tier.name;
      return ENHANCED_PLAN_FEATURES[planKey as keyof typeof ENHANCED_PLAN_FEATURES];
    });
    if (!sampleTier) return [];

    const planKey = sampleTier.name === 'Free' ? 'Starter' :
                  sampleTier.name === 'Business' ? 'Growth' :
                  sampleTier.name;
    const enhancedFeatures = ENHANCED_PLAN_FEATURES[planKey as keyof typeof ENHANCED_PLAN_FEATURES].features;
    return Object.keys(
      enhancedFeatures[category as keyof typeof enhancedFeatures] || {}
    );
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

        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 4 }}>
          <Box
            sx={{
              backgroundColor: '#EAF3EC',
              border: '1px solid #A3B18A',
              borderRadius: 2,
              width: 'fit-content',
              px: 2,
              py: 1.5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Typography sx={{ fontWeight: 600, color: '#344E41' }}>
              Current Plan:
            </Typography>
            <Typography sx={{ fontWeight: 600, color: '#344E41' }}>
              {(() => {
                const currentTier = allTiers.find(tier => tier.id === organizationTierId);
                if (!currentTier) return '—';
                // Map tier name for display
                return currentTier.name === 'Free' ? 'Starter' :
                       currentTier.name === 'Team' ? 'Team (Legacy)' :
                       currentTier.name === 'Business' ? 'Growth' :
                       currentTier.name;
              })()}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 6 }}>
            <Typography
              component="a" 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.open('https://billing.stripe.com/p/login/bIY8yAdHWcJpchifYY', '_blank');
              }}
              sx={{ 
                color: 'primary.main',
                textDecoration: 'underline',
                fontSize: '13px', 
                cursor: 'pointer', 
                '&:hover': {
                  textDecoration: 'none'
                }
              }}
            >
              Manage Subscription
            </Typography>
          </Box>
        </Box>

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
                    {allTiers?.filter(tier => tier.name !== 'Team').map((tier: Tier, index: number, filteredTiers: Tier[]) => {
                      // Map tier names for display
                      const displayName = tier.name === 'Free' ? 'Starter' :
                                        tier.name === 'Business' ? 'Growth' :
                                        tier.name;
                      return (
                        <TableCell key={`name-${tier.id}`} align="center" sx={{ width: '18.75%', py: 2, borderRight: index !== filteredTiers.length - 1 ? 1 : 0, borderColor: 'grey.200' }}>
                          <Typography variant="h6" fontWeight="bold">
                            {displayName}
                          </Typography>
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Price Row */}
                  <TableRow>
                    <TableCell sx={{ width: '25%', py: 2, borderRight: 1, borderColor: 'grey.200' }}>
                      {/* Empty cell for feature column */}
                    </TableCell>
                    {allTiers?.filter(tier => tier.name !== 'Team').map((tier: Tier, index: number, filteredTiers: Tier[]) => {
                      // Override pricing for display
                      const displayPrice = tier.name === 'Business' ? 799 :
                                         tier.name === 'Enterprise' ? null :
                                         tier.price;
                      return (
                        <TableCell key={`price-${tier.id}`} align="center" sx={{ width: '18.75%', py: 2, borderRight: index !== filteredTiers.length - 1 ? 1 : 0, borderColor: 'grey.200' }}>
                          <Typography variant="h5" fontWeight="bold" color="primary.main">
                            {displayPrice === null ? 'Custom' : `$${displayPrice}`}
                            {displayPrice !== null && (
                              <Typography component="span" variant="body2" color="text.secondary">
                                /month
                              </Typography>
                            )}
                          </Typography>
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Description Row */}
                  <TableRow>
                    <TableCell sx={{ width: '25%', py: 2, borderRight: 1, borderColor: 'grey.200' }}>
                      {/* Empty cell for feature column */}
                    </TableCell>
                    {allTiers?.filter(tier => tier.name !== 'Team').map((tier: Tier, index: number, filteredTiers: Tier[]) => {
                      // Map tier names for enhanced plan lookup
                      const planKey = tier.name === 'Free' ? 'Starter' :
                                    tier.name === 'Business' ? 'Growth' :
                                    tier.name;
                      const enhancedPlan = ENHANCED_PLAN_FEATURES[planKey as keyof typeof ENHANCED_PLAN_FEATURES];
                      return (
                        <TableCell key={`desc-${tier.id}`} align="center" sx={{ width: '18.75%', py: 2, borderRight: index !== filteredTiers.length - 1 ? 1 : 0, borderColor: 'grey.200' }}>
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
                    {allTiers?.filter(tier => tier.name !== 'Team').map((tier: Tier, index: number, filteredTiers: Tier[]) => (
                      <TableCell key={`cta-${tier.id}`} align="center" sx={{ width: '18.75%', py: 2, borderRight: index !== filteredTiers.length - 1 ? 1 : 0, borderColor: 'grey.200' }}>
                        {/* Hide button for Free tier if organizationTierId is not 1 */}
                        {tier.id === 1 && organizationTierId !== 1 ? null : (
                          <Tooltip
                            title={
                              organizationTierId === tier.id
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
                                disabled={organizationTierId === tier.id}
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
                                {organizationTierId === tier.id ? 'Current Plan' :
                                 tier.name === 'Enterprise' ? 'Contact Sales' : 'Subscribe'}
                              </Button>
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Feature Categories */}
                  {getFeatureCategories().map((category) => (
                    <React.Fragment key={category}>
                      {/* Category Header */}
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell colSpan={allTiers.filter(tier => tier.name !== 'Team').length + 1} sx={{ py: 2, borderBottom: 1, borderColor: 'grey.200' }}>
                          <Typography variant="h6" fontWeight="semibold" color="success.main" sx={{ fontSize: '15px' }}>
                            {category}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      
                      {/* Feature Rows */}
                      {getFeaturesByCategory(category).map((feature) => (
                        <TableRow key={feature} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                          <TableCell sx={{ width: '25%', py: 2, borderRight: 1, borderColor: 'grey.200' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {feature}
                              </Typography>
                              {FEATURE_TOOLTIPS[feature] && (
                                <Tooltip
                                  title={FEATURE_TOOLTIPS[feature]}
                                  placement="top"
                                  arrow
                                  componentsProps={{
                                    tooltip: {
                                      sx: {
                                        fontSize: '13px'
                                      }
                                    }
                                  }}
                                >
                                  <InfoOutlinedIcon
                                    sx={{
                                      fontSize: 16,
                                      color: 'text.secondary',
                                      cursor: 'help'
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          
                          {allTiers.filter(tier => tier.name !== 'Team').map((tier: Tier, index: number, filteredTiers: Tier[]) => {
                            // Map tier names for enhanced plan lookup
                            const planKey = tier.name === 'Free' ? 'Starter' :
                                          tier.name === 'Business' ? 'Growth' :
                                          tier.name;
                            const enhancedPlan = ENHANCED_PLAN_FEATURES[planKey as keyof typeof ENHANCED_PLAN_FEATURES];
                            const featureCategory = enhancedPlan?.features[category as keyof typeof enhancedPlan.features] as Record<string, boolean | string> | undefined;
                            const featureValue = featureCategory ? featureCategory[feature] : false;

                            return (
                              <TableCell key={tier.id} align="center" sx={{ width: '18.75%', py: 2, borderRight: index !== filteredTiers.length - 1 ? 1 : 0, borderColor: 'grey.200' }}>
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
