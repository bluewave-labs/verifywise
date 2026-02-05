# Type Safety

Advanced TypeScript patterns for building type-safe applications.

## Utility Types

TypeScript provides built-in utility types for common type transformations.

### Partial<T>

Makes all properties optional.

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// All properties optional
type PartialUser = Partial<User>;
// { id?: string; name?: string; email?: string; }

// Use for update operations
function updateUser(id: string, updates: Partial<User>): Promise<User> {
  return api.patch(`/users/${id}`, updates);
}

updateUser('123', { name: 'New Name' }); // Only update name
```

### Required<T>

Makes all properties required.

```typescript
interface Config {
  host?: string;
  port?: number;
  timeout?: number;
}

// All properties required
type RequiredConfig = Required<Config>;
// { host: string; port: number; timeout: number; }

function initializeServer(config: RequiredConfig): void {
  // All values guaranteed to exist
}
```

### Readonly<T>

Makes all properties readonly.

```typescript
interface State {
  users: User[];
  loading: boolean;
}

type ImmutableState = Readonly<State>;

function reducer(state: ImmutableState, action: Action): ImmutableState {
  // state.loading = true; // Error: Cannot assign to readonly property
  return { ...state, loading: true };
}

// Deep readonly for nested objects
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
```

### Pick<T, K>

Creates a type with only specified properties.

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Only id and name
type UserSummary = Pick<User, 'id' | 'name'>;
// { id: string; name: string; }

// Use for API responses that don't include all fields
function getUserSummary(id: string): Promise<UserSummary> {
  return api.get(`/users/${id}/summary`);
}
```

### Omit<T, K>

Creates a type without specified properties.

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

// Everything except password
type SafeUser = Omit<User, 'password'>;
// { id: string; name: string; email: string; }

// For creating new records (no id yet)
type CreateUserInput = Omit<User, 'id'>;

function createUser(data: CreateUserInput): Promise<User> {
  return api.post('/users', data);
}
```

### Record<K, V>

Creates an object type with specified key and value types.

```typescript
// String keys, User values
type UserMap = Record<string, User>;

// Specific keys
type RolePermissions = Record<'admin' | 'user' | 'guest', string[]>;

const permissions: RolePermissions = {
  admin: ['read', 'write', 'delete'],
  user: ['read', 'write'],
  guest: ['read'],
};

// HTTP status codes
type StatusMessages = Record<number, string>;
const messages: StatusMessages = {
  200: 'OK',
  404: 'Not Found',
  500: 'Internal Server Error',
};
```

### Extract<T, U> and Exclude<T, U>

Filter union types.

```typescript
type Status = 'pending' | 'active' | 'inactive' | 'deleted';

// Only active statuses
type ActiveStatus = Extract<Status, 'pending' | 'active'>;
// 'pending' | 'active'

// Non-deleted statuses
type VisibleStatus = Exclude<Status, 'deleted'>;
// 'pending' | 'active' | 'inactive'

// Practical example
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type SafeMethod = Exclude<HttpMethod, 'DELETE'>;
```

### NonNullable<T>

Removes null and undefined from a type.

```typescript
type MaybeUser = User | null | undefined;

type DefiniteUser = NonNullable<MaybeUser>;
// User

function processUser(user: NonNullable<MaybeUser>): void {
  // user is guaranteed to be User, not null or undefined
  console.log(user.name);
}
```

### ReturnType<T> and Parameters<T>

Extract function return type and parameter types.

```typescript
function createUser(name: string, email: string): User {
  return { id: generateId(), name, email };
}

type CreateUserReturn = ReturnType<typeof createUser>;
// User

type CreateUserParams = Parameters<typeof createUser>;
// [string, string]

// Useful for wrapper functions
function wrappedCreateUser(...args: Parameters<typeof createUser>) {
  console.log('Creating user...');
  return createUser(...args);
}
```

## Type Guards

Type guards narrow types at runtime while providing compile-time safety.

### typeof Guards

```typescript
function formatValue(value: string | number): string {
  if (typeof value === 'string') {
    return value.toUpperCase(); // TypeScript knows it's string
  }
  return value.toFixed(2); // TypeScript knows it's number
}
```

### instanceof Guards

```typescript
class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

function handleError(error: Error) {
  if (error instanceof ApiError) {
    console.log(`API Error ${error.statusCode}: ${error.message}`);
  } else {
    console.log(`Error: ${error.message}`);
  }
}
```

### in Operator Guards

```typescript
interface Bird {
  fly(): void;
  layEggs(): void;
}

interface Fish {
  swim(): void;
  layEggs(): void;
}

function move(animal: Bird | Fish) {
  if ('fly' in animal) {
    animal.fly(); // TypeScript knows it's Bird
  } else {
    animal.swim(); // TypeScript knows it's Fish
  }
}
```

### Custom Type Guards

Create reusable type predicates with `is` keyword.

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// Type guard function
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'email' in value &&
    typeof (value as User).id === 'string' &&
    typeof (value as User).name === 'string' &&
    typeof (value as User).email === 'string'
  );
}

// Usage
function processData(data: unknown) {
  if (isUser(data)) {
    console.log(data.name); // Type-safe access
  }
}

// Array type guard
function isUserArray(value: unknown): value is User[] {
  return Array.isArray(value) && value.every(isUser);
}
```

### Discriminated Unions

Use a common property to discriminate between union members.

```typescript
interface SuccessResponse {
  status: 'success';
  data: User;
}

interface ErrorResponse {
  status: 'error';
  message: string;
  code: number;
}

type ApiResponse = SuccessResponse | ErrorResponse;

function handleResponse(response: ApiResponse) {
  if (response.status === 'success') {
    // TypeScript knows this is SuccessResponse
    console.log(response.data.name);
  } else {
    // TypeScript knows this is ErrorResponse
    console.log(`Error ${response.code}: ${response.message}`);
  }
}
```

### Assertion Functions

Assert that a value is a certain type.

```typescript
function assertIsUser(value: unknown): asserts value is User {
  if (!isUser(value)) {
    throw new Error('Value is not a User');
  }
}

function processUser(data: unknown) {
  assertIsUser(data);
  // After assertion, data is typed as User
  console.log(data.name);
}

// Non-null assertion function
function assertDefined<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error('Value is null or undefined');
  }
}

function process(value: string | null) {
  assertDefined(value);
  console.log(value.toUpperCase()); // Type-safe
}
```

## Generics

Write reusable, type-safe code that works with multiple types.

### Basic Generics

```typescript
// Generic function
function identity<T>(value: T): T {
  return value;
}

const str = identity('hello'); // type: string
const num = identity(42);      // type: number

// Generic interface
interface Container<T> {
  value: T;
  getValue(): T;
}

const stringContainer: Container<string> = {
  value: 'hello',
  getValue() { return this.value; },
};
```

### Generic Constraints

Limit what types can be used with generics.

```typescript
// Constraint to objects with id property
interface HasId {
  id: string;
}

function findById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// Works with any type that has id
interface User { id: string; name: string; }
interface Product { id: string; price: number; }

findById<User>(users, '123');
findById<Product>(products, '456');

// Constraint to specific keys
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'John', age: 30 };
const name = getProperty(user, 'name'); // type: string
const age = getProperty(user, 'age');   // type: number
// getProperty(user, 'invalid'); // Error: invalid key
```

### Multiple Type Parameters

```typescript
// Map function with two type parameters
function mapArray<T, U>(array: T[], transform: (item: T) => U): U[] {
  return array.map(transform);
}

const numbers = [1, 2, 3];
const strings = mapArray(numbers, n => n.toString()); // string[]

// Key-value pair
interface KeyValuePair<K, V> {
  key: K;
  value: V;
}

const pair: KeyValuePair<string, number> = { key: 'age', value: 30 };
```

### Generic Classes

```typescript
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
const num = numberStack.pop(); // type: number | undefined

const stringStack = new Stack<string>();
stringStack.push('hello');
```

### Generic Defaults

```typescript
// Default type parameter
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}

const response: ApiResponse = { data: {}, status: 200 }; // T is unknown
const userResponse: ApiResponse<User> = { data: user, status: 200 };

// Multiple defaults
interface Config<T = string, U = number> {
  name: T;
  value: U;
}
```

## Mapped Types

Transform existing types into new types.

### Basic Mapped Types

```typescript
// Make all properties optional
type Optional<T> = {
  [P in keyof T]?: T[P];
};

// Make all properties nullable
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

// Make all properties readonly
type Immutable<T> = {
  readonly [P in keyof T]: T[P];
};

interface User {
  name: string;
  age: number;
}

type OptionalUser = Optional<User>;
// { name?: string; age?: number; }

type NullableUser = Nullable<User>;
// { name: string | null; age: number | null; }
```

### Conditional Mapped Types

```typescript
// Extract only string properties
type StringProperties<T> = {
  [P in keyof T as T[P] extends string ? P : never]: T[P];
};

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

type UserStrings = StringProperties<User>;
// { name: string; email: string; }

// Rename properties
type Getters<T> = {
  [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P];
};

type UserGetters = Getters<User>;
// { getId: () => number; getName: () => string; ... }
```

## Template Literal Types

Create types from string patterns.

```typescript
// Event names
type EventName = 'click' | 'focus' | 'blur';
type EventHandler = `on${Capitalize<EventName>}`;
// 'onClick' | 'onFocus' | 'onBlur'

// API endpoints
type Method = 'get' | 'post' | 'put' | 'delete';
type Endpoint = `/${string}`;
type ApiMethod = `${Uppercase<Method>} ${Endpoint}`;
// 'GET /...' | 'POST /...' | 'PUT /...' | 'DELETE /...'

// CSS properties
type CSSUnit = 'px' | 'em' | 'rem' | '%';
type CSSValue = `${number}${CSSUnit}`;

const width: CSSValue = '100px'; // Valid
const height: CSSValue = '50%';  // Valid
// const invalid: CSSValue = '10'; // Error: not valid CSSValue
```

## Conditional Types

Create types based on conditions.

```typescript
// Basic conditional
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false

// Infer keyword
type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never;

function greet(): string { return 'hello'; }
type GreetReturn = ReturnTypeOf<typeof greet>; // string

// Flatten arrays
type Flatten<T> = T extends Array<infer U> ? U : T;

type Flattened = Flatten<string[]>; // string
type NotFlattened = Flatten<string>; // string

// Unwrap promises
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

type ResolvedType = Awaited<Promise<Promise<string>>>; // string
```

## Best Practices

### Prefer Specific Types

```typescript
// Bad: too loose
function process(data: object): object { }

// Good: specific types
function process(data: ProcessInput): ProcessOutput { }
```

### Use Type Inference

```typescript
// Unnecessary: TypeScript infers this
const name: string = 'John';
const numbers: number[] = [1, 2, 3];

// Better: let TypeScript infer
const name = 'John';
const numbers = [1, 2, 3];

// Do specify when it helps readability or the type isn't obvious
const config: Config = loadConfig(); // Clarifies expected return type
```

### Avoid Type Assertions

```typescript
// Bad: bypasses type checking
const user = data as User;

// Good: use type guard
if (isUser(data)) {
  const user = data;
}
```

### Use Discriminated Unions for State

```typescript
// Bad: multiple booleans
interface State {
  isLoading: boolean;
  isError: boolean;
  data: User | null;
  error: Error | null;
}

// Good: discriminated union
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };

function renderState(state: State) {
  switch (state.status) {
    case 'idle': return <Idle />;
    case 'loading': return <Spinner />;
    case 'success': return <UserCard user={state.data} />;
    case 'error': return <ErrorMessage error={state.error} />;
  }
}
```

## Summary

| Technique | Use Case |
|-----------|----------|
| **Utility Types** | Transform existing types (Partial, Pick, Omit) |
| **Type Guards** | Runtime type checking with compile-time safety |
| **Generics** | Reusable type-safe functions and classes |
| **Mapped Types** | Transform all properties of a type |
| **Conditional Types** | Types based on conditions |
| **Template Literals** | String pattern types |

## Related Documents

- [TypeScript Standards](./typescript-standards.md)
- [Naming Conventions](./naming-conventions.md)
- [Clean Code Principles](../01-foundations/clean-code.md)
