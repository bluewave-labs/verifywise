import { SlotComponentProps } from '@mui/utils';
export default function mergeSlotProps<T extends SlotComponentProps<React.ElementType, {}, {}>, K = T, U = T extends Function ? T : K extends Function ? K : T extends undefined ? K : T>(externalSlotProps: T | undefined, defaultSlotProps: K): U;
