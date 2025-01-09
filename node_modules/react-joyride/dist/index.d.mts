import * as React from 'react';
import { CSSProperties, ReactNode, ElementType, MouseEventHandler, RefCallback } from 'react';
import { Styles as Styles$1, Props as Props$1 } from 'react-floater';
export { Props as FloaterProps } from 'react-floater';
import { ValueOf, Simplify, SetRequired, PartialDeep } from 'type-fest';

declare const ACTIONS: {
    readonly INIT: "init";
    readonly START: "start";
    readonly STOP: "stop";
    readonly RESET: "reset";
    readonly PREV: "prev";
    readonly NEXT: "next";
    readonly GO: "go";
    readonly CLOSE: "close";
    readonly SKIP: "skip";
    readonly UPDATE: "update";
};
declare const EVENTS: {
    readonly TOUR_START: "tour:start";
    readonly STEP_BEFORE: "step:before";
    readonly BEACON: "beacon";
    readonly TOOLTIP: "tooltip";
    readonly STEP_AFTER: "step:after";
    readonly TOUR_END: "tour:end";
    readonly TOUR_STATUS: "tour:status";
    readonly TARGET_NOT_FOUND: "error:target_not_found";
    readonly ERROR: "error";
};
declare const LIFECYCLE: {
    readonly INIT: "init";
    readonly READY: "ready";
    readonly BEACON: "beacon";
    readonly TOOLTIP: "tooltip";
    readonly COMPLETE: "complete";
    readonly ERROR: "error";
};
declare const ORIGIN: {
    readonly BUTTON_CLOSE: "button_close";
    readonly BUTTON_PRIMARY: "button_primary";
    readonly KEYBOARD: "keyboard";
    readonly OVERLAY: "overlay";
};
declare const STATUS: {
    readonly IDLE: "idle";
    readonly READY: "ready";
    readonly WAITING: "waiting";
    readonly RUNNING: "running";
    readonly PAUSED: "paused";
    readonly SKIPPED: "skipped";
    readonly FINISHED: "finished";
    readonly ERROR: "error";
};

type Actions = ValueOf<typeof ACTIONS>;
type Events = ValueOf<typeof EVENTS>;
type Lifecycle = ValueOf<typeof LIFECYCLE>;
type Origin = ValueOf<typeof ORIGIN>;
type Status = ValueOf<typeof STATUS>;
type AnyObject<T = any> = Record<string, T>;
type NarrowPlainObject<T extends Record<string, any>> = Exclude<T, Array<unknown> | Function | Map<unknown, unknown> | Set<unknown>>;
interface Locale {
    /**
     * Label for the back button.
     * @default 'Back'
     */
    back?: ReactNode;
    /**
     * Label for the close button.
     * @default 'Close'
     */
    close?: ReactNode;
    /**
     * Label for the last button.
     * @default 'Last'
     */
    last?: ReactNode;
    /**
     * Label for the next button.
     * @default 'Next'
     */
    next?: ReactNode;
    /**
     * Label for the next button with `showProgress`.
     * Use the `{step}` and `{steps}` placeholders to display the current step and the total steps.
     * @default 'Next (Step {step} of {steps})'
     */
    nextLabelWithProgress?: ReactNode;
    /**
     * Label for the open button.
     * @default 'Open the dialog'
     */
    open?: ReactNode;
    /**
     * Label for the skip button.
     * @default 'Skip'
     */
    skip?: ReactNode;
}
type Placement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end' | 'right' | 'right-start' | 'right-end';
interface Styles {
    beacon: CSSProperties;
    beaconInner: CSSProperties;
    beaconOuter: CSSProperties;
    buttonBack: CSSProperties;
    buttonClose: CSSProperties;
    buttonNext: CSSProperties;
    buttonSkip: CSSProperties;
    options: Partial<StylesOptions>;
    overlay: CSSProperties;
    overlayLegacy: CSSProperties;
    overlayLegacyCenter: CSSProperties;
    spotlight: CSSProperties;
    spotlightLegacy: CSSProperties;
    tooltip: CSSProperties;
    tooltipContainer: CSSProperties;
    tooltipContent: CSSProperties;
    tooltipFooter: CSSProperties;
    tooltipFooterSpacer: CSSProperties;
    tooltipTitle: CSSProperties;
}
interface StylesWithFloaterStyles extends Styles {
    floaterStyles: Styles$1;
}
interface StylesOptions {
    arrowColor: string;
    backgroundColor: string;
    beaconSize: number;
    overlayColor: string;
    primaryColor: string;
    spotlightShadow: string;
    textColor: string;
    width?: string | number;
    zIndex: number;
}

type Listener = (state: State) => void;
type PopperData = Parameters<NonNullable<Props$1['getPopper']>>[0];
declare class Store {
    private beaconPopper;
    private tooltipPopper;
    private data;
    private listener;
    private store;
    constructor(options?: StoreOptions);
    getState(): State;
    private getNextState;
    private getSteps;
    private hasUpdatedState;
    private setState;
    addListener: (listener: Listener) => void;
    setSteps: (steps: Array<Step>) => void;
    getHelpers(): StoreHelpers;
    getPopper: (name: "beacon" | "tooltip") => PopperData | null;
    setPopper: (name: "beacon" | "tooltip", popper: PopperData) => void;
    cleanupPoppers: () => void;
    close: (origin?: Origin | null) => void;
    go: (nextIndex: number) => void;
    info: () => State;
    next: () => void;
    open: () => void;
    prev: () => void;
    reset: (restart?: boolean) => void;
    skip: () => void;
    start: (nextIndex?: number) => void;
    stop: (advance?: boolean) => void;
    update: (state: Partial<State>) => void;
}
type StoreInstance = ReturnType<typeof createStore>;
declare function createStore(options?: StoreOptions): Store;

type BaseProps = {
    /**
     * A React component to use instead the default Beacon.
     */
    beaconComponent?: ElementType<BeaconRenderProps>;
    /**
     * Disable closing the tooltip on ESC.
     * @default false
     */
    disableCloseOnEsc?: boolean;
    /**
     * Don't show the overlay.
     * @default false
     */
    disableOverlay?: boolean;
    /**
     * Don't close the tooltip when clicking the overlay.
     * @default false
     */
    disableOverlayClose?: boolean;
    /**
     * Disable the fix to handle "unused" overflow parents.
     * @default false
     */
    disableScrollParentFix?: boolean;
    /**
     * @default false
     */
    disableScrolling?: boolean;
    /**
     * Options to be passed to react-floater
     */
    floaterProps?: Partial<Props$1>;
    /**
     * Hide the Back button.
     * @default false
     */
    hideBackButton?: boolean;
    /**
     * Hide the Close button.
     * @default false
     */
    hideCloseButton?: boolean;
    /**
     * The strings used in the tooltip.
     */
    locale?: Locale;
    /**
     * @default false
     */
    showProgress?: boolean;
    /**
     * @default false
     */
    showSkipButton?: boolean;
    /**
     * @default false
     */
    spotlightClicks?: boolean;
    /**
     * The padding of the spotlight.
     * @default 10
     */
    spotlightPadding?: number;
    /**
     * Override the styling of the Tooltip
     */
    styles?: PartialDeep<Styles>;
    /**
     * A React component to use instead the default Tooltip.
     */
    tooltipComponent?: ElementType<TooltipRenderProps>;
};
type BeaconProps = Simplify<Pick<Props, 'beaconComponent' | 'nonce'> & BeaconRenderProps & {
    locale: Locale;
    onClickOrHover: MouseEventHandler<HTMLElement>;
    shouldFocus: boolean;
    styles: Styles;
}>;
type BeaconRenderProps = {
    continuous: boolean;
    index: number;
    isLastStep: boolean;
    size: number;
    step: StepMerged;
};
type Callback = (data: CallBackProps) => void;
type CallBackProps = {
    /**
     * The action that updated the state.
     */
    action: Actions;
    /**
     * It the tour is in `controlled` mode.
     * (using the `stepIndex` prop)
     */
    controlled: boolean;
    /**
     * The current step's index
     */
    index: number;
    /**
     *  The step's lifecycle.
     */
    lifecycle: Lifecycle;
    /**
     * The element that triggered the action (if available).
     */
    origin: Origin | null;
    /**
     * The number of steps
     */
    size: number;
    /**
     * The tour's status.
     */
    status: Status;
    /**
     * The current step's data.
     */
    step: Step;
    /**
     * The type of the event.
     */
    type: Events;
};
type OverlayProps = Simplify<StepMerged & {
    continuous: boolean;
    debug: boolean;
    lifecycle: Lifecycle;
    onClickOverlay: () => void;
}>;
type Props = Simplify<BaseProps & {
    /**
     * A function to be called when Joyride's state changes.
     * It returns a single parameter with the state.
     */
    callback?: Callback;
    /**
     * The tour is played sequentially with the Next button.
     * @default false
     */
    continuous?: boolean;
    /**
     * Log Joyride's actions to the console.
     * @default false
     */
    debug?: boolean;
    /**
     * Get the store methods to control the tour programmatically. `prev, next, go, close, skip, reset, info`
     */
    getHelpers?: (helpers: StoreHelpers) => void;
    /**
     * A nonce value for inline styles (Content Security Policy - CSP)
     */
    nonce?: string;
    /**
     * Run/stop the tour.
     * @default true
     */
    run?: boolean;
    /**
     * The duration for scroll to element.
     * @default 300
     */
    scrollDuration?: number;
    /**
     * The scroll distance from the element scrollTop value.
     * @default 20
     */
    scrollOffset?: number;
    /**
     * Scroll the page for the first step.
     * @default false
     */
    scrollToFirstStep?: boolean;
    /**
     * Setting a number here will turn Joyride into `controlled` mode.
     * You'll have to keep an internal state by yourself and update it with the events in the `callback`.
     */
    stepIndex?: number;
    /**
     * The tour's steps.
     */
    steps: Array<Step>;
}>;
type State = {
    action: Actions;
    controlled: boolean;
    index: number;
    lifecycle: Lifecycle;
    origin: Origin | null;
    size: number;
    status: Status;
};
type Step = Simplify<BaseProps & {
    /**
     * The tooltip's body.
     */
    content: ReactNode;
    /**
     * Additional data you can add to the step.
     */
    data?: any;
    /**
     * Don't show the Beacon before the tooltip.
     * @default false
     */
    disableBeacon?: boolean;
    /**
     * The event to trigger the beacon.
     * @default click
     */
    event?: 'click' | 'hover';
    /**
     * Options to be passed to react-floater
     */
    floaterProps?: Props$1;
    /**
     * Hide the tooltip's footer.
     * @default false
     */
    hideFooter?: boolean;
    /**
     * Force the step to be fixed.
     * @default false
     */
    isFixed?: boolean;
    /**
     * @default 10
     */
    offset?: number;
    /**
     * The placement of the beacon and tooltip. It will re-position itself if there's no space available.
     * @default bottom
     */
    placement?: Placement | 'auto' | 'center';
    /**
     * The placement of the beacon. It will use the `placement` if nothing is passed
     */
    placementBeacon?: Placement;
    /**
     * The target for the step.
     * It can be a CSS selector or an HTMLElement ref.
     */
    target: string | HTMLElement;
    /**
     * The tooltip's title.
     */
    title?: ReactNode;
}>;
type StepMerged = Simplify<SetRequired<Step, 'disableBeacon' | 'disableCloseOnEsc' | 'disableOverlay' | 'disableOverlayClose' | 'disableScrollParentFix' | 'disableScrolling' | 'event' | 'hideBackButton' | 'hideCloseButton' | 'hideFooter' | 'isFixed' | 'locale' | 'offset' | 'placement' | 'showProgress' | 'showSkipButton' | 'spotlightClicks' | 'spotlightPadding'> & {
    styles: Styles;
}>;
type StepProps = Simplify<State & {
    callback: Callback;
    continuous: boolean;
    debug: boolean;
    helpers: StoreHelpers;
    nonce?: string;
    shouldScroll: boolean;
    step: StepMerged;
    store: StoreInstance;
}>;
type StoreHelpers = {
    close: (origin?: Origin | null) => void;
    go: (nextIndex: number) => void;
    info: () => State;
    next: () => void;
    open: () => void;
    prev: () => void;
    reset: (restart: boolean) => void;
    skip: () => void;
};
type StoreOptions = Simplify<Props & {
    controlled: boolean;
}>;
type TooltipProps = {
    continuous: boolean;
    helpers: StoreHelpers;
    index: number;
    isLastStep: boolean;
    setTooltipRef: RefCallback<HTMLElement>;
    size: number;
    step: StepMerged;
};
type TooltipRenderProps = Simplify<BeaconRenderProps & {
    backProps: {
        'aria-label': string;
        'data-action': string;
        onClick: MouseEventHandler<HTMLElement>;
        role: string;
        title: string;
    };
    closeProps: {
        'aria-label': string;
        'data-action': string;
        onClick: MouseEventHandler<HTMLElement>;
        role: string;
        title: string;
    };
    primaryProps: {
        'aria-label': string;
        'data-action': string;
        onClick: MouseEventHandler<HTMLElement>;
        role: string;
        title: string;
    };
    skipProps: {
        'aria-label': string;
        'data-action': string;
        onClick: MouseEventHandler<HTMLElement>;
        role: string;
        title: string;
    };
    tooltipProps: {
        'aria-modal': boolean;
        ref: RefCallback<HTMLElement>;
        role: string;
    };
}>;

declare class Joyride extends React.Component<Props, State> {
    private readonly helpers;
    private readonly store;
    static defaultProps: {
        continuous: false;
        debug: false;
        disableCloseOnEsc: false;
        disableOverlay: false;
        disableOverlayClose: false;
        disableScrolling: false;
        disableScrollParentFix: false;
        getHelpers: undefined;
        hideBackButton: false;
        run: true;
        scrollOffset: number;
        scrollDuration: number;
        scrollToFirstStep: false;
        showSkipButton: false;
        showProgress: false;
        spotlightClicks: false;
        spotlightPadding: number;
        steps: never[];
    };
    constructor(props: Props);
    componentDidMount(): void;
    componentDidUpdate(previousProps: Props, previousState: State): void;
    componentWillUnmount(): void;
    /**
     * Trigger the callback.
     */
    callback: (data: CallBackProps) => void;
    /**
     * Keydown event listener
     */
    handleKeyboard: (event: KeyboardEvent) => void;
    handleClickOverlay: () => void;
    /**
     * Sync the store with the component's state
     */
    syncState: (state: State) => void;
    scrollToStep(previousState: State): void;
    render(): React.JSX.Element | null;
}

export { ACTIONS, type Actions, type AnyObject, type BaseProps, type BeaconProps, type BeaconRenderProps, type CallBackProps, type Callback, EVENTS, type Events, LIFECYCLE, type Lifecycle, type Locale, type NarrowPlainObject, ORIGIN, type Origin, type OverlayProps, type Placement, type Props, STATUS, type State, type Status, type Step, type StepMerged, type StepProps, type StoreHelpers, type StoreOptions, type Styles, type StylesOptions, type StylesWithFloaterStyles, type TooltipProps, type TooltipRenderProps, Joyride as default };
