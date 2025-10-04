'use client';

import * as React from 'react';

import type { TInlineSuggestionData, TLinkElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { getLinkAttributes } from '@platejs/link';
import { SuggestionPlugin } from '@platejs/suggestion/react';
import { PlateElement } from 'platejs/react';

export function LinkElement(props: PlateElementProps<TLinkElement>) {
  const suggestionData = props.editor
    .getApi(SuggestionPlugin)
    .suggestion.suggestionData(props.element) as
    | TInlineSuggestionData
    | undefined;

  // Compute conditional styles
  const baseStyle = {
    fontWeight: 500,
    color: 'primary.main',
    textDecoration: 'underline',
    textDecorationColor: 'primary.main',
    textUnderlineOffset: '4px',
    zIndex: 100,
  } as const;

  const variantStyles =
    suggestionData?.type === 'remove'
      ? { bgcolor: 'error.light', color: 'error.dark' }
      : suggestionData?.type === 'insert'
      ? { bgcolor: 'success.light', color: 'success.dark' }
      : {};

  return (
    <PlateElement
      {...props}
      as="a"
      style={{ ...baseStyle, ...variantStyles }}
      attributes={{
        ...props.attributes,
        ...getLinkAttributes(props.editor, props.element),
        onMouseOver: (e: React.MouseEvent) => {
          e.stopPropagation();
        },
      }}
    >
      {props.children}
    </PlateElement>
  );
}
