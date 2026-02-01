# TypeScript Standards

TypeScript standards and best practices for VerifyWise, aligned with our ESLint configuration.

## ESLint Configuration

Our project enforces these rules (see `Clients/eslint.config.js`):

```javascript
{
  '@typescript-eslint/no-unused-vars': ['error', {
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_',
    caughtErrorsIgnorePattern: '^_',
  }],
  '@typescript-eslint/no-explicit-any': 'warn',
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
}
```

## Strict Mode

TypeScript strict mode is enabled. All code must pass strict type checking.

### Enabled Strict Flags

- `strictNullChecks` - null and undefined are distinct types
- `strictFunctionTypes` - stricter function type checking
- `strictPropertyInitialization` - class properties must be initialized
- `noImplicitAny` - error on expressions with implied `any`
- `noImplicitThis` - error on `this` with implied `any`

## Avoiding `any`

The `any` type bypasses TypeScript's type checking. Avoid it.

### Problems with `any`

```typescript
// Bad: any defeats the purpose of TypeScript
function processData(data: any) {
  return data.foo.bar.baz; // No type checking, runtime errors possible
}

// No errors at compile time, crashes at runtime
processData(null);
processData({ wrong: 'structure' });
```

### Alternatives to `any`

#### Use `unknown` for Unknown Types

```typescript
// Good: unknown is type-safe
function processData(data: unknown): ProcessedData {
  // Must narrow type before use
  if (isValidData(data)) {
    return transform(data);
  }
  throw new Error('Invalid data');
}

// Type guard for narrowing
function isValidData(data: unknown): data is ValidData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'foo' in data &&
    typeof (data as ValidData).foo === 'string'
  );
}
```

#### Use Generics for Flexible Types

```typescript
// Bad: any for flexible function
function firstElement(arr: any[]): any {
  return arr[0];
}

// Good: generic preserves type information
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

const num = firstElement([1, 2, 3]); // type: number | undefined
const str = firstElement(['a', 'b']); // type: string | undefined
```

#### Use Specific Types

```typescript
// Bad: any because "it could be anything"
function handleEvent(event: any) {
  console.log(event.target.value);
}

// Good: specific event type
function handleEvent(event: React.ChangeEvent<HTMLInputElement>) {
  console.log(event.target.value);
}
```

#### Use Union Types

```typescript
// Bad: any for multiple possible types
function formatValue(value: any): string {
  return String(value);
}

// Good: union of expected types
function formatValue(value: string | number | boolean): string {
  return String(value);
}
```

### When `any` Might Be Acceptable

1. **Third-party libraries without types** (but prefer `@types/*` packages)
2. **Gradual migration** from JavaScript (temporary, mark with TODO)
3. **Testing mocks** (but prefer `jest.Mock<T>`)

```typescript
// If unavoidable, document why
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API, types pending
const legacyData: any = await legacyService.getData();
```

## Interfaces vs Types

Both can define object shapes. Use interfaces for objects that might be extended.

### Use Interface for Object Shapes

```typescript
// Good: interface for extensible object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

interface AdminUser extends User {
  permissions: string[];
  adminLevel: number;
}

// Good: interface for React props
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}
```

### Use Type for Unions, Intersections, Utilities

```typescript
// Good: type for unions
type Status = 'pending' | 'active' | 'inactive' | 'deleted';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// Good: type for intersections
type UserWithProfile = User & Profile;

// Good: type for mapped/utility types
type ReadonlyUser = Readonly<User>;
type PartialUser = Partial<User>;
type UserKeys = keyof User;
```

### Naming Conventions

```typescript
// Do NOT prefix interfaces with 'I'
// Bad
interface IUser { }
interface IUserService { }

// Good
interface User { }
interface UserService { }

// Type aliases are also not prefixed
type UserId = string;
type UserRole = 'admin' | 'user' | 'guest';
```

## Null and Undefined

### Prefer `undefined` Over `null`

```typescript
// Prefer undefined for optional values
interface Config {
  timeout?: number; // undefined if not set
  retries?: number;
}

// Use null when explicitly representing "no value"
interface SearchResult {
  user: User | null; // explicitly searched but not found
}
```

### Optional Chaining and Nullish Coalescing

```typescript
// Good: optional chaining for safe access
const city = user?.address?.city;
const firstItem = items?.[0];
const result = callback?.();

// Good: nullish coalescing for defaults
const timeout = config.timeout ?? 5000;
const name = user.name ?? 'Anonymous';

// Note: ?? only checks null/undefined, || checks all falsy
const count = data.count ?? 0; // 0 if null/undefined
const count = data.count || 0; // 0 if null/undefined/0/''
```

### Non-Null Assertion

Use sparingly and only when you're certain the value exists.

```typescript
// Avoid unless absolutely necessary
const element = document.getElementById('app')!;

// Better: handle the null case
const element = document.getElementById('app');
if (!element) {
  throw new Error('App element not found');
}
```

## Enums vs Union Types

Prefer union types over enums for better type inference and tree-shaking.

```typescript
// Avoid: enums have runtime overhead
enum Status {
  Pending = 'pending',
  Active = 'active',
  Inactive = 'inactive',
}

// Prefer: union types
type Status = 'pending' | 'active' | 'inactive';

// If you need the values as an array
const STATUSES = ['pending', 'active', 'inactive'] as const;
type Status = (typeof STATUSES)[number];
```

### When to Use Enums

```typescript
// Acceptable: numeric enums for bit flags
enum Permissions {
  None = 0,
  Read = 1 << 0,
  Write = 1 << 1,
  Execute = 1 << 2,
  All = Read | Write | Execute,
}

const userPerms = Permissions.Read | Permissions.Write;
```

## Function Types

### Explicit Return Types

Add return types to exported functions and public methods.

```typescript
// Good: explicit return type for exported function
export function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Good: explicit return type for async functions
export async function fetchUser(id: string): Promise<User> {
  const response = await api.get(`/users/${id}`);
  return response.data;
}

// Good: explicit return type for functions returning complex types
export function createUserActions(userId: string): {
  update: (data: Partial<User>) => Promise<User>;
  delete: () => Promise<void>;
} {
  return {
    update: (data) => api.patch(`/users/${userId}`, data),
    delete: () => api.delete(`/users/${userId}`),
  };
}
```

### Void vs Undefined

```typescript
// void: function returns nothing
function logMessage(msg: string): void {
  console.log(msg);
}

// undefined: function explicitly returns undefined
function findItem(id: string): Item | undefined {
  return items.find(item => item.id === id);
}
```

### Async Functions

```typescript
// Always use Promise<T> for async return types
async function fetchData(): Promise<Data> {
  return await api.getData();
}

// Void async functions return Promise<void>
async function saveData(data: Data): Promise<void> {
  await api.saveData(data);
}
```

## Object Types

### Readonly Properties

```typescript
// Use readonly for properties that shouldn't change
interface Config {
  readonly apiUrl: string;
  readonly maxRetries: number;
}

// Use Readonly<T> utility for entire objects
function processConfig(config: Readonly<Config>): void {
  // config.apiUrl = 'new-url'; // Error: Cannot assign to readonly property
}
```

### Index Signatures

```typescript
// Use Record for dictionaries
type UserMap = Record<string, User>;

// Or explicit index signature
interface StringMap {
  [key: string]: string;
}

// Prefer specific types when keys are known
interface Translations {
  en: string;
  es: string;
  fr: string;
}
```

## Type Assertions

Use type assertions sparingly. Prefer type guards.

```typescript
// Avoid: type assertion without validation
const user = data as User; // Dangerous if data isn't actually User

// Better: type guard with validation
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'email' in data
  );
}

if (isUser(data)) {
  console.log(data.name); // Type-safe
}
```

### Acceptable Type Assertions

```typescript
// DOM elements when you know the type
const input = document.getElementById('email') as HTMLInputElement;

// Narrowing from broader to narrower type
interface ApiResponse {
  type: 'user' | 'admin';
  data: unknown;
}

if (response.type === 'user') {
  const userData = response.data as UserData;
}
```

## Common Patterns

### Discriminated Unions

```typescript
// Use discriminated unions for type-safe variants
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function handleResult<T>(result: Result<T>) {
  if (result.success) {
    console.log(result.data); // TypeScript knows data exists
  } else {
    console.error(result.error); // TypeScript knows error exists
  }
}
```

### Exhaustive Checks

```typescript
type Status = 'pending' | 'active' | 'inactive';

function handleStatus(status: Status): string {
  switch (status) {
    case 'pending':
      return 'Waiting...';
    case 'active':
      return 'Running';
    case 'inactive':
      return 'Stopped';
    default:
      // Ensures all cases are handled
      const _exhaustive: never = status;
      return _exhaustive;
  }
}
```

### Template Literal Types

```typescript
// Type-safe event names
type EventName = `on${Capitalize<'click' | 'focus' | 'blur'>}`;
// Result: 'onClick' | 'onFocus' | 'onBlur'

// API endpoints
type Endpoint = `/api/${string}`;
type UserEndpoint = `/api/users/${number}`;
```

## Summary

| Rule | Description |
|------|-------------|
| Avoid `any` | Use `unknown`, generics, or specific types instead |
| Use interfaces | For object shapes that might be extended |
| Use types | For unions, intersections, and utilities |
| Explicit returns | Add return types to exported functions |
| Prefer `undefined` | Over `null` for optional values |
| Use type guards | Instead of type assertions |
| Use discriminated unions | For type-safe variants |

## Related Documents

- [Naming Conventions](./naming-conventions.md)
- [Type Safety](./type-safety.md)
- [Clean Code Principles](../01-foundations/clean-code.md)
