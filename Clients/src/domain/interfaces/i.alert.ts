/**
 * Re-export domain types from domain types file
 * Domain layer has zero external dependencies
 */
export type { alertState, AlertCorProps } from "../types/alert.types";

/**
 * Backwards compatibility: re-export presentation adapter type
 * Note: AlertProps now includes MUI SxProps for proper component usage
 */
export type { AlertProps } from "../../presentation/types/alert.types";