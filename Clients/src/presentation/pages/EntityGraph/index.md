# Entity Graph

The Entity Graph provides an interactive visualization of relationships between entities in your AI governance system. It helps you understand how use cases, models, vendors, risks, and compliance frameworks are connected.

## Overview

The Entity Graph displays your governance data as an interactive network diagram. Each entity appears as a node, and the connections between them show their relationships. You can explore the graph by clicking, dragging, and zooming.

## Accessing the Entity Graph

The Entity Graph is accessed through the "View relationships" button, available on:

- Model inventory rows
- Vendor rows
- Risk rows
- Use case rows

When you click this button, the graph opens in a full-screen modal, automatically centered on the selected entity.

## Features

### Entity types

The graph displays six types of entities, each with a distinct color:

| Entity | Color | Description |
|--------|-------|-------------|
| Use cases | Green | Your AI projects and initiatives |
| Models | Blue | AI/ML models in your inventory |
| Vendors | Purple | Third-party AI service providers |
| Risks | Red | Identified project and vendor risks |
| Evidence | Orange | Supporting documentation and files |
| Frameworks | Grey | Compliance frameworks (EU AI Act, ISO, etc.) |

### Filtering entities

Use the toggle buttons in the top-left panel to show or hide specific entity types. By default, use cases, models, vendors, and risks are visible.

### Search

Type in the search box to filter entities by name. The search updates as you type.

### Show problems only

Enable "Show problems only" to display only entities with issues:
- High-risk items
- Entities with compliance gaps
- Items requiring attention

A notification appears explaining what the filter shows.

### Entity details

Click any entity node to open the detail sidebar on the right. The sidebar displays:

- Entity name and type
- Status or risk level
- Key details (owner, dates, descriptions)
- Connected entities with quick navigation

### Navigation

- **Pan**: Click and drag the background
- **Zoom**: Scroll or use the zoom controls (bottom-left)
- **Mini-map**: Use the overview in the bottom-right corner
- **Navigate to entity**: Click a connected entity in the sidebar to focus on it
- **Go to full page**: Click "Go to [entity]" to navigate to the entity's dedicated page

## Understanding relationships

Lines between entities represent their connections:

- **Use case → Model**: The use case uses this model
- **Use case → Vendor**: The vendor provides services for this use case
- **Entity → Risk**: A risk is associated with this entity
- **Model → Framework**: The model complies with this framework

## Tips

- When the graph opens from a specific entity, that entity is highlighted with an orange border
- Hover over any node to see additional details in a tooltip
- The statistics bar shows how many entities and relationships are currently visible
- Drag nodes to rearrange the graph layout
