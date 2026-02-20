/**
 * Release video configuration — single file to update per release.
 *
 * For each new release:
 * 1. Update `version` to the new version string
 * 2. Replace `features` with the new release's feature list
 * 3. The modal title, localStorage key, and composition all derive from this
 *
 * Old release videos are automatically superseded — only the current
 * version's video is shown, and old localStorage keys are cleaned up.
 */

export const RELEASE_VERSION = "2.1";

export const RELEASE_FEATURES = [
  {
    number: "01",
    category: "Detection",
    title: "Shadow AI detection",
    description: "Discover unauthorized AI tool usage across the organization",
  },
  {
    number: "02",
    category: "Discovery",
    title: "AI agent discovery & inventory",
    description: "Catalog and monitor AI agents org-wide",
  },
  {
    number: "03",
    category: "Evaluation",
    title: "Law-aware bias audit module",
    description: "Bias auditing for LLM evaluations with legal awareness",
  },
  {
    number: "04",
    category: "Plugin",
    title: "Jira integration plugin",
    description: "Connect your AI governance workflow directly to Jira",
  },
  {
    number: "05",
    category: "Plugin",
    title: "Model inventory lifecycle plugin",
    description: "Track and manage the full lifecycle of your AI models",
  },
  {
    number: "06",
    category: "Plugin",
    title: "Dataset bulk upload plugin",
    description: "Upload and manage evaluation datasets in bulk",
  },
  {
    number: "07",
    category: "Detection",
    title: "Extended AI detection",
    description: "Now covers workflows, containers, and configs",
  },
  {
    number: "08",
    category: "Governance",
    title: "Lifecycle initialization wizard",
    description: "Shadow AI governance wizard for lifecycle setup",
  },
];

export const STORAGE_KEY_PREFIX = "seen_release_video_";
export const STORAGE_KEY = `${STORAGE_KEY_PREFIX}${RELEASE_VERSION}`;
