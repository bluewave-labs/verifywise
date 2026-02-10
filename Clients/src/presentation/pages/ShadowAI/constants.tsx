/**
 * Shared constants and small utility components for the Shadow AI pages.
 */

import { ChevronsUpDown } from "lucide-react";

/** Period filter options shared by InsightsPage and UserActivityPage. */
export const PERIOD_OPTIONS = [
  { _id: "7d", name: "Last 7 days" },
  { _id: "30d", name: "Last 30 days" },
  { _id: "90d", name: "Last 90 days" },
];

/** Icon component used as the MUI Select dropdown indicator. */
export const SelectorVertical = (props: React.SVGAttributes<SVGSVGElement>) => (
  <ChevronsUpDown size={16} {...props} />
);
