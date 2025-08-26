import React, { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import IntegrationCard from "../../components/IntegrationCard";
import { getAllIntegrations } from "../../../application/repository/integration.repository";
import CustomizableSkeleton from "../../vw-v2-components/Skeletons";

interface Integration {
  integration_type: string;
  name: string;
  description: string;
  icon: string;
  status: "connected" | "not_connected" | "error";
  connection?: any;
}

const IntegrationsGrid: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [controller, setController] = useState<AbortController | null>(null);

  const createAbortController = () => {
    if (controller) {
      controller.abort();
    }
    const newController = new AbortController();
    setController(newController);
    return newController.signal;
  };

  const fetchIntegrations = async () => {
    const signal = createAbortController();
    if (signal.aborted) return;
    
    setIsLoading(true);
    try {
      const response = await getAllIntegrations({ signal });
      if (response?.data) {
        setIntegrations(response.data);
      }
    } catch (error) {
      console.error("Error fetching integrations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
    return () => {
      controller?.abort();
    };
  }, []);

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3].map((index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <CustomizableSkeleton height={200} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {integrations.map((integration) => (
        <Grid item xs={12} sm={6} md={4} key={integration.integration_type}>
          <IntegrationCard 
            integration={{
              id: integration.integration_type,
              name: integration.name,
              description: integration.description,
              status: integration.status,
              provider: integration.integration_type as "confluence",
            }} 
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default IntegrationsGrid;