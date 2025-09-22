import { useEffect, useState } from "react";
import { getSlackIntegrations } from "../repository/slack.integration.repository";

interface ISlackWebhook {
  id?: number;
  access_token_iv?: string;
  access_token: string;
  scope: string;
  user_id?: number; // FK to users table
  team_name: string;
  team_id: string;
  channel: string;
  channel_id: string;
  configuration_url: string; // configuration URL to manage the webhook
  url_iv?: string;
  url: string; // URL of the slack workspace
  created_at?: string;
  is_active?: boolean;
}
export interface SlackWebhook {
  id?: number;
  scope: string;
  teamName: string;
  teamId: string;
  channel: string;
  channelId: string;
  createdAt?: string;
  isActive?: boolean;
}

interface ApiResponse {
  data: ISlackWebhook[];
}

const useSlackIntegrations = (userId: number | null) => {
  const [slackIntegrations, setSlackIntegrations] = useState<SlackWebhook[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlackIntegrations = async () => {
    try {
      const controller = new AbortController();
      const signal = controller.signal;
      setLoading(true);
      const response = await getSlackIntegrations({ id: userId!, signal });

      const integrations: SlackWebhook[] = (response as ApiResponse).data.map(
        (item: ISlackWebhook): SlackWebhook => ({
          id: item.id,
          scope: item.scope,
          teamName: item.team_name,
          teamId: item.team_id,
          channel: item.channel,
          channelId: item.channel_id,
          createdAt: item.created_at,
          isActive: item.is_active,
        }),
      );

      setSlackIntegrations(integrations);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch slack integrations",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlackIntegrations();
  }, []);

  return {
    slackIntegrations,
    loading,
    error,
    refreshSlackIntegrations: fetchSlackIntegrations,
  };
};

export default useSlackIntegrations;
