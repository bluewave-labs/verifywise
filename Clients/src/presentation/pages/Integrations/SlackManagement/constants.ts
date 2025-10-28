import { SlackNotificationRoutingType } from "../../../../application/hooks/useSlackIntegrations";

export const NotificationRoutingTypes = [
    {
        name: SlackNotificationRoutingType.MEMBERSHIP_AND_ROLES,
        desc: "Get notified when users are added, removed, or assigned roles within your organization.",
    },
    {
        name: SlackNotificationRoutingType.PROJECTS_AND_ORGANIZATIONS,
        desc: "Receive updates when new projects are created, modified, or linked to your organization.",
    },
    {
        name: SlackNotificationRoutingType.POLICY_REMINDERS_AND_STATUS,
        desc: "Stay on track with automated reminders and updates about policy reviews or compliance status.",
    },
    {
        name: SlackNotificationRoutingType.EVIDENCE_AND_TASK_ALERTS,
        desc: "Be alerted when new evidence is uploaded, reviewed, or when tasks are assigned and completed.",
    },
    {
        name: SlackNotificationRoutingType.CONTROL_OR_POLICY_CHANGES,
        desc: "Get immediate notifications when key controls or policies are updated or changed.",
    },
]