/**
 * Mitigation presentation-layer interfaces
 * Contains UI component props with React dependencies
 */

import { Dispatch, SetStateAction } from "react";
import { IMitigation, IMitigationErrors } from "../../../domain/interfaces/i.mitigation";

// Re-export domain types for convenience
export type { IMitigation, IMitigationErrors } from "../../../domain/interfaces/i.mitigation";

/**
 * Props for mitigation section component
 */
export interface IMitigationSectionProps {
  mitigationValues: IMitigation;
  setMitigationValues: Dispatch<SetStateAction<IMitigation>>;
  mitigationErrors?: IMitigationErrors;
  userRoleName: string;
}
