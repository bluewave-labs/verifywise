# API Document Generation

This document serves as the persistent blueprint for generating and maintaining the VerifyWise API documentation site.

**Version:** 1.7.0
**Last Updated:** 2024-12-02
**Mode:** INITIAL

---

## Overview

The API documentation is a standalone React application that can be:
1. Deployed independently as a static site
2. Integrated into the main VerifyWise application
3. Merged with the Resources/Help Center alongside User Documentation and Style Guide

---

## Architecture

### Technology Stack
- **React 18** with TypeScript
- **Vite** for build tooling
- **Material-UI (MUI)** for base components (matching main app)
- **Prism.js** for syntax highlighting
- **Lucide React** for icons

### Design System Alignment
The docs follow the VerifyWise design system from `/style-guide`:
- Primary color: `#13715B`
- Border color: `#d0d5dd`
- Border radius: `4px`
- Font: `Geist` (fallback: `Inter`)
- Base font size: `13px`
- Button height: `34px`

---

## Folder Structure

```
docs/api-docs/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── CodeBlock.tsx     # Syntax-highlighted code display
│   │   ├── EndpointCard.tsx  # Individual endpoint documentation
│   │   ├── ParamTable.tsx    # Parameters table display
│   │   ├── ResponseBlock.tsx # Response schema display
│   │   ├── TryItOut.tsx      # Interactive API testing
│   │   ├── MethodBadge.tsx   # HTTP method badge (GET, POST, etc.)
│   │   └── SchemaViewer.tsx  # JSON schema display
│   │
│   ├── layout/               # Layout components
│   │   ├── ApiLayout.tsx     # Main layout wrapper
│   │   ├── SidebarNav.tsx    # Left sidebar navigation
│   │   ├── TopBar.tsx        # Top navigation bar with tabs
│   │   └── VersionSwitcher.tsx # Version dropdown
│   │
│   ├── pages/                # Documentation pages (one per tag/category)
│   │   ├── Overview.tsx      # API overview and getting started
│   │   ├── Authentication.tsx # Auth endpoints
│   │   ├── Users.tsx         # User management endpoints
│   │   ├── Organizations.tsx # Organization endpoints
│   │   ├── Projects.tsx      # Project endpoints
│   │   ├── Risks.tsx         # Project and vendor risks
│   │   ├── Vendors.tsx       # Vendor management
│   │   ├── Assessments.tsx   # Assessment endpoints
│   │   ├── Compliance.tsx    # EU AI Act, ISO frameworks
│   │   ├── Models.tsx        # Model inventory and risks
│   │   ├── Policies.tsx      # Policy management
│   │   └── Errors.tsx        # Error codes reference
│   │
│   ├── config/               # Configuration
│   │   ├── versions.ts       # Available API versions
│   │   ├── endpoints.ts      # Parsed endpoint data from swagger
│   │   └── theme.ts          # Theme configuration
│   │
│   ├── styles/               # Global styles
│   │   └── globals.css       # Global CSS
│   │
│   ├── types/                # TypeScript types
│   │   └── api.ts            # API-related types
│   │
│   ├── utils/                # Utility functions
│   │   └── apiHelpers.ts     # API helper functions
│   │
│   ├── App.tsx               # Main app component
│   ├── main.tsx              # Entry point
│   └── index.html            # HTML template
│
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Vite config
└── README.md                 # Documentation readme
```

---

## API Resource to Page Mapping

| Swagger Tag | Page Component | Route |
|-------------|---------------|-------|
| Overview | Overview.tsx | `/overview` |
| Authentication | Authentication.tsx | `/authentication` |
| Users | Users.tsx | `/users` |
| Organizations | Organizations.tsx | `/organizations` |
| Projects | Projects.tsx | `/projects` |
| Project Risks | Risks.tsx | `/risks` |
| Vendor Risks | Risks.tsx | `/risks` |
| Project Scopes | Projects.tsx | `/projects` |
| Vendors | Vendors.tsx | `/vendors` |
| Assessments | Assessments.tsx | `/assessments` |
| Questions | Assessments.tsx | `/assessments` |
| Subtopics | Assessments.tsx | `/assessments` |
| Subcontrols | Compliance.tsx | `/compliance` |
| Roles | Users.tsx | `/users` |
| Files | Overview.tsx | `/overview` |
| Policies | Policies.tsx | `/policies` |
| Control Categories | Compliance.tsx | `/compliance` |
| Controls | Compliance.tsx | `/compliance` |
| Model Risks | Models.tsx | `/models` |
| Model Inventory | Models.tsx | `/models` |
| Training | Models.tsx | `/models` |
| Frameworks | Compliance.tsx | `/compliance` |
| EU AI Act | Compliance.tsx | `/compliance` |
| ISO 27001 | Compliance.tsx | `/compliance` |
| ISO 42001 | Compliance.tsx | `/compliance` |
| AI Trust Centre | Overview.tsx | `/overview` |
| Bias and Fairness | Models.tsx | `/models` |
| Email Services | Overview.tsx | `/overview` |
| Demo Data | Overview.tsx | `/overview` |

---

## Naming Conventions

### Files
- **Components:** PascalCase (e.g., `EndpointCard.tsx`)
- **Pages:** PascalCase (e.g., `Authentication.tsx`)
- **Config/Utils:** camelCase (e.g., `endpoints.ts`, `apiHelpers.ts`)
- **Styles:** kebab-case (e.g., `globals.css`)

### Components
- **Props interfaces:** `{ComponentName}Props`
- **Event handlers:** `handle{Action}` (e.g., `handleCopy`, `handleTryIt`)
- **State variables:** descriptive camelCase (e.g., `isExpanded`, `activeTab`)

### CSS Classes
- Use MUI's `sx` prop for styling (consistent with main app)
- Use `theme.palette.*` for colors
- Never hardcode hex values

---

## Version Switching

### Configuration
Versions are defined in `config/versions.ts`:

```typescript
export const API_VERSIONS = [
  { version: "1.7.0", path: "/api/1.7.0", current: true },
  // Future versions will be added here
];
```

### Behavior
1. Version dropdown shows all available versions
2. Selecting a version navigates to that version's docs
3. Current version is marked with a badge
4. URLs follow pattern: `/api/{version}/{page}`

### Adding New Versions
1. Add entry to `API_VERSIONS` array
2. Generate new page components for that version
3. Update `current: true` flag appropriately

---

## Handling Endpoint Changes

### New Endpoints
1. Add endpoint data to `config/endpoints.ts`
2. Add UI section in the appropriate page component
3. Document in the changelog section

### Changed Endpoints
1. Update endpoint data in `config/endpoints.ts`
2. Update UI in the page component
3. Add "Changed in {version}" badge if significant

### Removed Endpoints
1. Mark as deprecated with strikethrough and warning
2. Keep in docs for one version with deprecation notice
3. Remove completely in subsequent version
4. Add to "Deprecated" section in changelog

---

## Component Patterns

### EndpointCard Pattern
Each endpoint is displayed using:
```tsx
<EndpointCard
  method="GET"
  path="/users/{userId}"
  summary="Get user by ID"
  description="Retrieves user details..."
  parameters={[...]}
  requestBody={...}
  responses={[...]}
  requiresAuth={true}
/>
```

### TryItOut Pattern
Interactive testing component:
```tsx
<TryItOut
  method="POST"
  path="/users/login"
  baseUrl="http://localhost:3000/api"
  defaultBody={{ email: "", password: "" }}
  onResponse={(response) => {...}}
/>
```

---

## Style Rules

### Typography
- Page title: `24px`, weight `600`
- Section title: `18px`, weight `600`
- Subsection: `14px`, weight `600`
- Body text: `13px`, weight `400`
- Code/monospace: `12px`, `Fira Code`

### Spacing
- Page padding: `32px 40px`
- Section gap: `32px`
- Card padding: `24px`
- Inner content gap: `16px`

### Colors
- Primary actions: `#13715B`
- Borders: `#d0d5dd`
- Background alt: `#FCFCFD`
- Text primary: `#1c2130`
- Text secondary: `#344054`
- Text tertiary: `#475467`

### HTTP Method Colors
- GET: `#10B981` (green)
- POST: `#3B82F6` (blue)
- PUT: `#F59E0B` (amber)
- PATCH: `#8B5CF6` (purple)
- DELETE: `#EF4444` (red)

---

## Integration with Help Center

This API documentation is designed to be one tab in a larger "Resources/Help Center" that includes:

1. **User Documentation** - End-user guides
2. **API Documentation** - This documentation (current)
3. **Style Guide** - Design system reference (existing `/style-guide`)

### Merge Requirements
- Same top tab bar pattern as StyleGuide
- Same sidebar navigation pattern
- Same content section styling
- Shared components can be extracted to a common location

---

## Future Update Rules

When running in UPDATE mode:

1. **Always read this document first** to understand current structure
2. **Preserve existing patterns** - don't change conventions without updating this doc
3. **Only modify changed endpoints** - don't regenerate unchanged sections
4. **Update version config** - add new version, update `current` flag
5. **Update this document** - add any new patterns or changes made
6. **Keep changelog** - document what changed between versions

---

## Changelog

### Version 1.7.0 (Initial)
- Initial API documentation generation
- Covers all endpoints from swagger.yaml
- Interactive "Try it out" functionality
- Matches VerifyWise design system
