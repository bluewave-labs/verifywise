# Entity Graph Modal

The Entity Graph Modal displays the Entity Graph in a full-screen overlay, allowing you to explore entity relationships without leaving your current page.

## Overview

When you click "View relationships" on any entity (model, vendor, risk, or use case), this modal opens with the graph centered on that entity. The entity is highlighted with an orange border and the view automatically zooms to show it clearly.

## Features

### Header

The modal header displays:
- "Entity relationships" title
- The focused entity's type and name (e.g., "Model: GPT-4 Production")
- Close button (X) to exit

### Graph area

The main area contains the interactive Entity Graph with all its features:
- Filtering by entity type
- Search functionality
- Problems-only filter
- Detail sidebar
- Mini-map navigation

### Closing the modal

Close the modal by:
- Clicking the X button in the header
- Clicking outside the modal
- Pressing the Escape key

## Behavior

When the modal opens:
1. The graph loads and displays all entities
2. The view centers on the focused entity
3. The focused entity is highlighted with an orange glow
4. Related entity types are automatically shown

The highlight fades after 2 seconds, but the entity remains centered.
