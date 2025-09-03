import React, { useEffect, useState } from "react";
import { Grid, Card, CardContent, CardActions, Button, Typography, Stack } from "@mui/material";
import { getAllTiers } from "../../../../application/repository/tiers.repository";
import { extractUserToken } from "../../../../application/tools/extractToken";
import { getAuthToken } from "../../../../application/redux/auth/getAuthToken";
import { GetMyOrganization } from "../../../../application/repository/organization.repository";

const PRICING_URL = 'https://verifywise.ai/pricing/';

const Subscription: React.FC = () => {
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const userToken = extractUserToken(getAuthToken());
  const organizationId = userToken?.organizationId;
  const [organizationTierId, setOrganizationTierId] = useState<number | null>(
    null
  );

  useEffect(() => {
    const fetchOrganizationTierId = async () => {
      const organization = await GetMyOrganization({
        routeUrl: `/organizations/${organizationId}`,
      });
      const org = organization.data.data;
      setOrganizationTierId(org.subscription_id);
    };
    fetchOrganizationTierId();
  }, [organizationId]);

  if (!organizationTierId) {
    setOrganizationTierId(1);
  }

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        setLoading(true);
        const tiersObject = await getAllTiers();
        if (tiersObject) {
            const tiersArray = Object.values(tiersObject);
            setTiers(tiersArray);
        }

      } catch (error) {
        console.error("Failed to fetch tiers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTiers();
  }, []);


  const handleSubscribe = () => {
    window.open(PRICING_URL, "_blank");
  };

  if (loading) {
    return <Typography>Loading tiers...</Typography>;
  }

  return (
    <Stack spacing={3} sx={{ mt: 3 }}>
      <Typography variant="h6">Choose a plan</Typography>
      <Grid container spacing={2}>
        {tiers[1]?.map((tier: any) => (
          <Grid item xs={12} sm={6} md={4} key={tier.id}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">{tier.name}</Typography>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  ${tier.price}/mo
                </Typography>
                {tier.features && (
                  <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                    {Object.entries(tier.features).map(([key, value]) => (
                      <li key={key}>
                        <Typography variant="body2">
                          {key}: {String(value) === '0' ? 'Unlimited' : String(value)}
                        </Typography>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSubscribe}
                  disabled={organizationTierId === tier.id}
                >
                  {organizationTierId === tier.id ? 'Current Plan' : 'Subscribe'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
};

export default Subscription;


