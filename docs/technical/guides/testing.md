# Testing Guidelines

This guide documents the testing patterns, tools, and best practices used in VerifyWise.

## Testing Stack

| Tool | Purpose |
|------|---------|
| Jest | Test runner and assertion library |
| React Testing Library | React component testing |
| Supertest | API endpoint testing |
| Mock Service Worker (MSW) | API mocking |

## Project Configuration

### Backend (Jest)

```javascript
// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/domain.layer/tests"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: [
    "**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
};
```

### Test Scripts

```json
{
  "scripts": {
    "test": "jest --detectOpenHandles --forceExit",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Test File Organization

### Backend Tests

```
Servers/
├── domain.layer/
│   └── tests/
│       ├── models/
│       │   ├── task.model.test.ts
│       │   └── user.model.test.ts
│       ├── utils/
│       │   ├── task.utils.test.ts
│       │   └── validation.utils.test.ts
│       └── controllers/
│           ├── task.ctrl.test.ts
│           └── auth.ctrl.test.ts
```

### Frontend Tests

```
Clients/src/
├── __tests__/
│   ├── components/
│   │   ├── Button.test.tsx
│   │   └── Modal.test.tsx
│   ├── hooks/
│   │   ├── useAuth.test.ts
│   │   └── useTasks.test.ts
│   └── pages/
│       └── Tasks.test.tsx
├── components/
│   └── Button/
│       ├── index.tsx
│       └── Button.test.tsx  # Co-located tests
```

## Test Naming Conventions

### File Names

```
entityName.test.ts       # Unit tests
entityName.spec.ts       # Integration tests (alternative)
entityName.e2e.test.ts   # End-to-end tests
```

### Test Descriptions

Use descriptive `describe` and `it` blocks:

```typescript
describe("TaskModel", () => {
  describe("validateTaskData", () => {
    it("should return error when title is empty", () => {
      // ...
    });

    it("should return error when title exceeds 255 characters", () => {
      // ...
    });

    it("should pass validation with valid data", () => {
      // ...
    });
  });

  describe("isOverdue", () => {
    it("should return true when due_date is in the past", () => {
      // ...
    });

    it("should return false when task is completed", () => {
      // ...
    });
  });
});
```

## Unit Testing Patterns

### Model Tests

```typescript
// domain.layer/tests/models/task.model.test.ts
import { TaskModel } from "../../models/tasks/tasks.model";
import { TaskStatus } from "../../enums/task-status.enum";
import { TaskPriority } from "../../enums/task-priority.enum";

describe("TaskModel", () => {
  describe("validateTaskData", () => {
    it("should return error when title is missing", () => {
      const data = { description: "Test description" };
      const errors = TaskModel.validateTaskData(data);

      expect(errors).toContain("Title is required");
    });

    it("should return error when title is too long", () => {
      const data = { title: "a".repeat(256) };
      const errors = TaskModel.validateTaskData(data);

      expect(errors).toContain("Title must be 255 characters or less");
    });

    it("should return no errors for valid data", () => {
      const data = {
        title: "Valid Task",
        description: "A valid description",
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.OPEN,
      };
      const errors = TaskModel.validateTaskData(data);

      expect(errors).toHaveLength(0);
    });
  });

  describe("isOverdue", () => {
    it("should return true when due_date is in the past", () => {
      const task = new TaskModel();
      task.due_date = new Date("2020-01-01");
      task.status = TaskStatus.OPEN;

      expect(task.isOverdue()).toBe(true);
    });

    it("should return false when due_date is in the future", () => {
      const task = new TaskModel();
      task.due_date = new Date("2030-01-01");
      task.status = TaskStatus.OPEN;

      expect(task.isOverdue()).toBe(false);
    });

    it("should return false when task is completed", () => {
      const task = new TaskModel();
      task.due_date = new Date("2020-01-01");
      task.status = TaskStatus.COMPLETED;

      expect(task.isOverdue()).toBe(false);
    });

    it("should return false when due_date is not set", () => {
      const task = new TaskModel();
      task.status = TaskStatus.OPEN;

      expect(task.isOverdue()).toBe(false);
    });
  });
});
```

### Utility Function Tests

```typescript
// domain.layer/tests/utils/validation.utils.test.ts
import {
  isValidEmail,
  isValidTenantHash,
  sanitizeInput,
} from "../../utils/validation.utils";

describe("Validation Utils", () => {
  describe("isValidEmail", () => {
    it("should return true for valid email", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
    });

    it("should return false for invalid email", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
    });
  });

  describe("isValidTenantHash", () => {
    it("should return true for valid 10-char alphanumeric hash", () => {
      expect(isValidTenantHash("abc123XYZ9")).toBe(true);
    });

    it("should return false for invalid hash", () => {
      expect(isValidTenantHash("short")).toBe(false);
      expect(isValidTenantHash("toolongstring123")).toBe(false);
      expect(isValidTenantHash("has-dashes")).toBe(false);
    });
  });

  describe("sanitizeInput", () => {
    it("should remove HTML tags", () => {
      expect(sanitizeInput("<script>alert('xss')</script>")).toBe("alert('xss')");
    });

    it("should trim whitespace", () => {
      expect(sanitizeInput("  hello world  ")).toBe("hello world");
    });
  });
});
```

### Controller Tests

```typescript
// domain.layer/tests/controllers/task.ctrl.test.ts
import request from "supertest";
import express from "express";
import { getTaskById, createTask } from "../../controllers/task.ctrl";
import * as taskUtils from "../../utils/task.utils";

// Mock utils
jest.mock("../../utils/task.utils");

const app = express();
app.use(express.json());

// Mock authentication middleware
app.use((req, res, next) => {
  req.userId = 1;
  req.tenantId = "tenant123";
  next();
});

app.get("/tasks/:id", getTaskById);
app.post("/tasks", createTask);

describe("Task Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /tasks/:id", () => {
    it("should return task when found", async () => {
      const mockTask = {
        id: 1,
        title: "Test Task",
        status: "Open",
      };

      (taskUtils.getTaskByIdQuery as jest.Mock).mockResolvedValue(mockTask);

      const response = await request(app).get("/tasks/1");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockTask);
    });

    it("should return 404 when task not found", async () => {
      (taskUtils.getTaskByIdQuery as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get("/tasks/999");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Task not found");
    });

    it("should return 400 for invalid ID", async () => {
      const response = await request(app).get("/tasks/invalid");

      expect(response.status).toBe(400);
    });
  });

  describe("POST /tasks", () => {
    it("should create task with valid data", async () => {
      const mockTask = {
        id: 1,
        title: "New Task",
        status: "Open",
      };

      (taskUtils.createTaskQuery as jest.Mock).mockResolvedValue(mockTask);

      const response = await request(app)
        .post("/tasks")
        .send({ title: "New Task" });

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockTask);
    });

    it("should return 400 for missing title", async () => {
      const response = await request(app)
        .post("/tasks")
        .send({ description: "No title" });

      expect(response.status).toBe(400);
    });
  });
});
```

## React Component Tests

### Basic Component Test

```typescript
// components/Button/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "./index";

describe("Button", () => {
  it("renders with correct text", () => {
    render(<Button>Click Me</Button>);

    expect(screen.getByRole("button")).toHaveTextContent("Click Me");
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    fireEvent.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Click Me</Button>);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows loading spinner when isLoading is true", () => {
    render(<Button isLoading>Click Me</Button>);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
```

### Component with State

```typescript
// components/SearchInput/SearchInput.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchInput from "./index";

describe("SearchInput", () => {
  it("calls onSearch with debounced value", async () => {
    const user = userEvent.setup();
    const handleSearch = jest.fn();

    render(<SearchInput onSearch={handleSearch} debounceMs={100} />);

    await user.type(screen.getByRole("textbox"), "test query");

    // Should not call immediately due to debounce
    expect(handleSearch).not.toHaveBeenCalled();

    // Wait for debounce
    await waitFor(
      () => {
        expect(handleSearch).toHaveBeenCalledWith("test query");
      },
      { timeout: 200 }
    );
  });

  it("clears input when clear button is clicked", async () => {
    const user = userEvent.setup();

    render(<SearchInput onSearch={jest.fn()} />);

    await user.type(screen.getByRole("textbox"), "test");
    expect(screen.getByRole("textbox")).toHaveValue("test");

    await user.click(screen.getByLabelText("clear search"));
    expect(screen.getByRole("textbox")).toHaveValue("");
  });
});
```

### Hook Tests

```typescript
// hooks/useAuth.test.ts
import { renderHook, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { useAuth } from "./useAuth";
import authReducer from "../redux/slices/authSlice";
import * as authRepository from "../repository/auth.repository";

jest.mock("../repository/auth.repository");

const createWrapper = () => {
  const store = configureStore({
    reducer: { auth: authReducer },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial unauthenticated state", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("should login user successfully", async () => {
    const mockUser = { id: 1, email: "test@example.com" };
    const mockToken = "jwt-token";

    (authRepository.loginAPI as jest.Mock).mockResolvedValue({
      user: mockUser,
      token: mockToken,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.login("test@example.com", "password");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it("should logout user", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
```

## Mocking Patterns

### Mocking Modules

```typescript
// Mock entire module
jest.mock("../../utils/task.utils");

// Mock specific functions
jest.mock("../../utils/task.utils", () => ({
  getTaskByIdQuery: jest.fn(),
  createTaskQuery: jest.fn(),
  // Keep other functions unmocked
  ...jest.requireActual("../../utils/task.utils"),
}));
```

### Mocking API Calls

```typescript
// Using MSW (Mock Service Worker)
import { rest } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  rest.get("/api/tasks", (req, res, ctx) => {
    return res(
      ctx.json({
        status: 200,
        data: [
          { id: 1, title: "Task 1" },
          { id: 2, title: "Task 2" },
        ],
      })
    );
  }),

  rest.post("/api/tasks", async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(201),
      ctx.json({
        status: 201,
        data: { id: 3, ...body },
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Mocking Hooks

```typescript
// Mock custom hook
jest.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, email: "test@example.com" },
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));
```

## Test Utilities

### Custom Render with Providers

```typescript
// test-utils.tsx
import { render, RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import { configureStore } from "@reduxjs/toolkit";
import { theme } from "../themes/light";
import rootReducer from "../redux/rootReducer";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: Partial<RootState>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </QueryClientProvider>
      </Provider>
    );
  }

  return {
    store,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Usage
import { renderWithProviders } from "../test-utils";

it("renders task list", () => {
  renderWithProviders(<TaskList />, {
    preloadedState: {
      auth: { isAuthenticated: true, user: mockUser },
    },
  });
});
```

### Factory Functions

```typescript
// factories/task.factory.ts
import { ITask } from "../domain/interfaces/i.task";

export function createMockTask(overrides: Partial<ITask> = {}): ITask {
  return {
    id: 1,
    title: "Test Task",
    description: "Test description",
    status: "Open",
    priority: "Medium",
    creator_id: 1,
    organization_id: 1,
    categories: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// Usage
const task = createMockTask({ status: "Completed" });
```

## Best Practices

### Test Organization

```typescript
describe("ComponentName", () => {
  // Setup
  beforeEach(() => {
    // Reset mocks, setup test data
  });

  afterEach(() => {
    // Cleanup
  });

  // Group related tests
  describe("rendering", () => {
    it("renders correctly with default props", () => {});
    it("renders loading state", () => {});
    it("renders error state", () => {});
  });

  describe("user interactions", () => {
    it("handles click events", () => {});
    it("handles form submission", () => {});
  });

  describe("edge cases", () => {
    it("handles empty data", () => {});
    it("handles very long text", () => {});
  });
});
```

### Assertions

```typescript
// Prefer specific assertions
expect(element).toHaveTextContent("Hello");
expect(button).toBeDisabled();
expect(input).toHaveValue("test");

// Over generic assertions
expect(element.textContent).toBe("Hello");
expect(button.disabled).toBe(true);
```

### Async Testing

```typescript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});

// Use findBy for elements that appear asynchronously
const element = await screen.findByText("Loaded");
```

### Avoid Implementation Details

```typescript
// Bad - testing implementation
expect(component.state.isLoading).toBe(true);

// Good - testing behavior
expect(screen.getByRole("progressbar")).toBeInTheDocument();
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- task.model.test.ts

# Run tests matching pattern
npm test -- --grep "validation"
```

## Related Documentation

- [Backend Patterns](./backend-patterns.md)
- [Frontend Patterns](./frontend-patterns.md)
- [Code Style](./code-style.md)
