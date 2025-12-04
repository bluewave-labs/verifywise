import * as React from 'react';
/**
 * This hook returns a `GlobalStyles` component that sets the CSS layer order (for server-side rendering).
 * Then on client-side, it injects the CSS layer order into the document head to ensure that the layer order is always present first before other Emotion styles.
 */
export default function useLayerOrder(theme: {
    modularCssLayers?: boolean | string;
}): React.JSX.Element | null;
