export interface Grid2Classes {
    /** Styles applied to the root element. */
    root: string;
    /** Styles applied to the root element if `container={true}`. */
    container: string;
}
export type Grid2ClassKey = keyof Grid2Classes;
export declare function getGrid2UtilityClass(slot: string): string;
declare const grid2Classes: Grid2Classes;
export default grid2Classes;
