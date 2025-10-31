# VerifyWise Codebase Index & Architecture Documentation

## Overview
VerifyWise is a comprehensive AI governance and compliance management platform built with React, TypeScript, and Material-UI. It helps organizations manage AI risks, ensure regulatory compliance (EU AI Act, ISO standards), and maintain transparency throughout the AI lifecycle.

## Architecture

### Clean Architecture Pattern
```
src/
├── application/     # Application logic, hooks, repositories
├── domain/         # Business models, types, and interfaces
├── infrastructure/ # External dependencies, API layer
└── presentation/   # UI components, pages, and styling
```

### Technology Stack
- **Frontend**: React 18.3.1 + TypeScript
- **UI Framework**: Material-UI (MUI) v6.1.6
- **State Management**: Redux Toolkit + Zustand
- **Routing**: React Router v6
- **Data Fetching**: Axios + React Query
- **Rich Text**: Tiptap Editor
- **File Upload**: Uppy
- **Charts**: Plotly.js + MUI X-Charts
- **Styling**: Emotion + Styled Components

## Core Modules & Features

### 1. **Project Management**
- Create and manage AI projects
- Assign owners and team members
- Track project status and progress
- Risk classification (high/limited/minimal)

### 2. **Compliance Frameworks**
- **EU AI Act**: Full compliance tracking with risk categories
- **ISO 27001**: Information security management
- **ISO 42001**: AI management system
- NIST AI RMF: Risk management framework

### 3. **Risk Management**
- Risk identification and assessment
- Risk mitigation strategies
- Vendor risk management
- Continuous monitoring

### 4. **Model Governance**
- Model inventory and registry
- Model lifecycle management
- Performance monitoring
- Bias and fairness detection

### 5. **Assessment & Auditing**
- Compliance assessments
- Control implementation tracking
- Audit trails and reporting
- Evidence management

### 6. **Documentation & Policies**
- Policy management
- Document repository
- Version control
- Approval workflows

## Key Components

### UI Components (`/presentation/components/`)
- **Button**: Customizable button component with variants
- **Table**: Advanced data table with sorting, filtering, pagination
- **Chip**: Status and category chips
- **Forms**: Dynamic form generation with validation
- **RichTextEditor**: Tiptap-based editor with plugins
- **FileUpload**: Uppy-based file upload component
- **Charts**: Various chart types for dashboards

### Pages (`/presentation/pages/`)
- **Dashboard**: Main overview with metrics and insights
- **ProjectView**: Detailed project management interface
- **RiskManagement**: Risk assessment and mitigation
- **ComplianceTracker**: Framework compliance monitoring
- **Assessment**: Compliance assessment workflows
- **SettingsPage**: User and organization settings

### Domain Models (`/domain/types/`)
- **Project**: Core project entity
- **Control**: Compliance controls
- **Risk**: Risk management entities
- **Policy**: Policy documents
- **User**: User management
- **File**: File and document handling

## State Management

### Redux Store Structure
```typescript
interface AppState {
  auth: {
    authToken: string;
    user: User;
    isAuthenticated: boolean;
  };
  ui: {
    mode: 'light' | 'dark';
    theme: any;
  };
  file: {
    uploadedFiles: File[];
    uploading: boolean;
  };
}
```

### Custom Hooks
- **useAuth**: Authentication state management
- **useUsers**: User data management
- **useProject**: Project operations
- **useCommandPalette**: Global search functionality

## API Integration

### Network Layer (`/infrastructure/api/`)
- **customAxios**: Axios instance with interceptors
  - Automatic token injection
  - Token refresh logic
  - Error handling
  - Request/response logging
- **networkServices**: HTTP service methods
  - GET, POST, PATCH, PUT, DELETE
  - Type-safe responses
  - Centralized error handling

### Authentication Flow
1. Login with credentials
2. Receive JWT access token + refresh token (HTTP-only cookie)
3. Access token stored in Redux
4. Automatic token refresh on 406 response
5. Logout on refresh token failure

## Design System

### Theme Configuration (`/presentation/themes/`)
- **Light/Dark mode**: Full theme support
- **Color Palette**: Consistent brand colors
  - Primary: #13715B (green)
  - Secondary: #F4F4F4 (light gray)
  - Success: #079455
  - Warning: #DC6803
  - Error: #f04438
- **Typography**: Inter font family, 13px base size
- **Spacing**: 8px base unit
- **Border Radius**: 2px (small), 4px (medium)

### Component Variants
- Buttons: contained, outlined, text, group
- Tables: striped, bordered, hover
- Cards: elevated, outlined, filled
- Forms: standard, compact, readonly

## Business Logic

### Risk Assessment Workflow
1. **Risk Identification**: Automated and manual risk detection
2. **Risk Analysis**: Impact and likelihood assessment
3. **Risk Evaluation**: Risk level determination
4. **Risk Treatment**: Mitigation strategies
5. **Risk Monitoring**: Continuous tracking

### Compliance Management
1. **Framework Selection**: Choose relevant standards
2. **Control Mapping**: Map controls to requirements
3. **Gap Analysis**: Identify compliance gaps
4. **Implementation**: Apply controls
5. **Evidence Collection**: Document compliance
6. **Audit Preparation**: Ready for audits

### Model Lifecycle
1. **Development**: Initial model creation
2. **Validation**: Testing and validation
3. **Deployment**: Production deployment
4. **Monitoring**: Performance tracking
5. **Retirement**: Model decommissioning

## Key Patterns & Practices

### 1. **Component Composition**
- Container/Presentational pattern
- Compound components for complex UI
- Render props for flexible components

### 2. **Error Handling**
- Error boundaries for graceful failures
- Custom exception handling
- Global error notifications

### 3. **Performance Optimization**
- Code splitting by route
- Lazy loading components
- Memoization for expensive operations
- Virtualization for large lists

### 4. **Accessibility**
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- High contrast mode

### 5. **Security**
- JWT-based authentication
- CSRF protection
- XSS prevention
- Input sanitization

## Configuration

### Environment Variables
```env
REACT_APP_BASE_URL=http://localhost:3000
REACT_APP_ENVIRONMENT=development
REACT_APP_SENTRY_DSN=<sentry-dsn>
```

### Build Process
- **Development**: Vite dev server
- **Production**: TypeScript compilation + Vite build
- **Custom build script**: Handles additional optimizations

## Testing Strategy
- Unit tests: Component and logic testing
- Integration tests: API and data flow
- E2E tests: User journey testing
- Visual regression: UI consistency

## Deployment
- **Frontend**: Static hosting (Vercel, Netlify)
- **Backend**: Node.js/Express server
- **Database**: PostgreSQL
- **File Storage**: AWS S3 or similar

## Recent Developments

### AI Use Case Lifecycle (New Feature)
- **Location**: `/presentation/pages/UseCaseLifecycle/`
- **Purpose**: Manage AI model development lifecycle
- **Stages**: 9 stages from Initiation to Deployment
- **Features**:
  - Visual timeline navigation
  - Stage status tracking
  - User assignments
  - Progress monitoring
  - History tracking

### Current Status
- UI complete with Material-UI components
- Real user integration implemented
- Mock data for demonstration
- Backend API integration needed
- State persistence to be implemented

## Development Guidelines

### Code Style
- TypeScript strict mode
- ESLint for code quality
- Prettier for formatting
- Conventional commits

### File Naming
- Components: PascalCase
- Files: kebab-case
- Types: CamelCase with suffix (e.g., ProjectType)

### Import Order
1. React imports
2. Third-party libraries
3. Internal components
4. Relative imports
5. Types and interfaces

## Future Enhancements

1. **Real-time Collaboration**: WebSocket integration
2. **Advanced Analytics**: ML-powered insights
3. **Mobile App**: React Native implementation
4. **Integration Hub**: Third-party tool connectors
5. **Automation**: Workflow automation engine

## Documentation Resources
- Component Storybook: UI component documentation
- API Docs: REST API specification
- User Guide: End-user documentation
- Developer Guide: Development setup and patterns

---

*Last updated: October 2024*
*Generated by: Claude Opus 4.1*