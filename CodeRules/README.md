# VerifyWise Code Rules & Best Practices

A comprehensive collection of coding standards, best practices, and guidelines for the VerifyWise project. This documentation is designed to ensure consistency, maintainability, and quality across the entire codebase.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite, Material-UI |
| **Backend** | Node.js, Express.js, TypeScript, Sequelize |
| **Python Services** | FastAPI, Python 3.12 |
| **Database** | PostgreSQL |
| **Testing** | Vitest (80% coverage target), Jest, DeepEval |
| **Linting** | ESLint with TypeScript strict mode |

## Quick Navigation

- **New to the project?** Start with [QUICK_START.md](./QUICK_START.md)
- **Writing a PR?** Use [PR Checklist](./checklists/pr-checklist.md)
- **Creating a component?** See [Component Checklist](./checklists/component-checklist.md)

## Table of Contents

### 1. Foundations
Core programming principles that apply across all languages and frameworks.

- [Clean Code Principles](./01-foundations/clean-code.md) - Meaningful names, small functions, Boy Scout Rule
- [SOLID Principles](./01-foundations/solid-principles.md) - OOP design principles with TypeScript examples
- [Design Principles](./01-foundations/design-principles.md) - DRY, KISS, YAGNI, Clean Architecture

### 2. TypeScript Standards
TypeScript-specific guidelines aligned with our ESLint configuration.

- [TypeScript Standards](./02-typescript/typescript-standards.md) - Strict mode, avoiding `any`, best practices
- [Naming Conventions](./02-typescript/naming-conventions.md) - Consistent naming across the codebase
- [Type Safety](./02-typescript/type-safety.md) - Utility types, type guards, generics

### 3. React Guidelines
Frontend development standards for React applications.

- [React Patterns](./03-react/react-patterns.md) - Function components, custom hooks, compound components
- [Component Guidelines](./03-react/component-guidelines.md) - File structure, MUI theme usage, accessibility
- [Hooks Guidelines](./03-react/hooks-guidelines.md) - Custom hook patterns, React Query integration
- [State Management](./03-react/state-management.md) - Redux Toolkit, React Query, local state

### 4. Backend Guidelines
Node.js and Express.js development standards.

- [Express Patterns](./04-backend/express-patterns.md) - Route organization, middleware, security
- [Controller Guidelines](./04-backend/controller-guidelines.md) - Request handling, validation, responses
- [Middleware Guidelines](./04-backend/middleware-guidelines.md) - Authentication, error handling
- [Database Patterns](./04-backend/database-patterns.md) - Sequelize models, migrations, transactions

### 5. Python Standards
Python and FastAPI development guidelines.

- [Python Standards](./05-python/python-standards.md) - PEP 8 compliance, code organization
- [FastAPI Patterns](./05-python/fastapi-patterns.md) - Routers, Pydantic, dependency injection
- [Type Hints](./05-python/type-hints.md) - Type annotations, mypy compatibility

### 6. Security
Security best practices aligned with OWASP guidelines.

- [Security Checklist](./06-security/security-checklist.md) - OWASP-aligned security checklist
- [Authentication](./06-security/authentication.md) - JWT handling, password security
- [Input Validation](./06-security/input-validation.md) - Validation strategies, sanitization
- [Error Handling](./06-security/error-handling.md) - Secure error handling, no internal exposure

### 7. Testing
Testing strategies and implementation guidelines.

- [Testing Strategy](./07-testing/testing-strategy.md) - Test pyramid, TDD, coverage targets
- [Frontend Testing](./07-testing/frontend-testing.md) - Vitest, React Testing Library
- [Backend Testing](./07-testing/backend-testing.md) - Jest, mocking patterns
- [Python Testing](./07-testing/python-testing.md) - pytest, DeepEval for AI testing

### 8. Workflow
Development workflow and collaboration guidelines.

- [Git Workflow](./08-workflow/git-workflow.md) - Branching strategy, commit messages
- [Code Review](./08-workflow/code-review.md) - Review focus areas, feedback format
- [PR Guidelines](./08-workflow/pr-guidelines.md) - Pull request best practices
- [Documentation](./08-workflow/documentation.md) - JSDoc, docstrings, component docs

### Checklists
Quick reference checklists for common tasks.

- [PR Checklist](./checklists/pr-checklist.md) - Pre-submission checklist
- [Component Checklist](./checklists/component-checklist.md) - React component checklist
- [API Endpoint Checklist](./checklists/api-endpoint-checklist.md) - Backend endpoint checklist
- [Security Review Checklist](./checklists/security-review-checklist.md) - Security review checklist

### Templates & Examples
Copy-paste templates for common patterns.

- [React Component Template](./examples/react-component-template.md)
- [Express Controller Template](./examples/express-controller-template.md)
- [Custom Hook Template](./examples/custom-hook-template.md)
- [FastAPI Router Template](./examples/fastapi-router-template.md)

## Key Sources

These guidelines are based on industry best practices from:

| Topic | Source |
|-------|--------|
| Clean Code | Robert C. Martin - "Clean Code" |
| DRY/KISS/YAGNI | Andy Hunt & Dave Thomas - "The Pragmatic Programmer" |
| SOLID Principles | Robert C. Martin |
| Security | OWASP Top 10 & Secure Coding Practices |
| TDD | Kent Beck - "Test-Driven Development" |
| TypeScript | Google TypeScript Style Guide |
| React | React 19 Documentation |
| Node.js | goldbergyoni/nodebestpractices |
| Python | PEP 8 Style Guide |

## Contributing

When updating these guidelines:

1. Ensure changes align with existing ESLint configuration
2. Provide concrete examples for each guideline
3. Include both good and bad examples where applicable
4. Update the relevant checklist if adding new requirements
5. Keep guidelines actionable and specific to VerifyWise

## Project Standards

These guidelines align with existing project standards:

- **ESLint Configuration**: See `Clients/eslint.config.js` for enforced rules
- **Clean Architecture**: See `Clients/clean-architecture.md` for layer structure
- **PR Template**: See `.github/pull_request_template.md` for submission requirements
