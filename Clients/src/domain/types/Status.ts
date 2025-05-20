export const STATUSES = [
  "Not started",
  "Draft",
  "In progress",
  "Awaiting review",
  "Awaiting approval",
  "Implemented",
  "Audited",
  "Needs rework",
] as const;

export type Status = (typeof STATUSES)[number];
