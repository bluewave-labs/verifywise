# Naming Conventions

Consistent naming conventions improve code readability and maintainability across the VerifyWise codebase.

## Overview

| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `userName`, `isActive` |
| Functions | camelCase | `getUserData`, `calculateTotal` |
| Components | PascalCase | `UserProfile`, `DataTable` |
| Classes | PascalCase | `UserService`, `DatabaseConnection` |
| Interfaces | PascalCase | `User`, `ApiResponse` |
| Types | PascalCase | `UserId`, `HttpMethod` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| Enums | PascalCase | `UserRole`, `HttpStatus` |
| Enum Members | PascalCase | `UserRole.Admin` |
| Files (Components) | PascalCase | `UserProfile.tsx` |
| Files (Utilities) | camelCase | `formatDate.ts` |
| Folders | kebab-case | `user-management`, `api-client` |
| CSS Classes | kebab-case | `user-profile-card` |
| Database Tables | snake_case | `user_profiles` |
| Database Columns | snake_case | `created_at` |

## Variables

### Regular Variables

Use camelCase. Names should be descriptive and reveal intent.

```typescript
// Good
const userName = 'John';
const userList = [];
const activeUsers = users.filter(u => u.isActive);
const totalPrice = calculateTotal(items);

// Bad
const user_name = 'John';  // snake_case
const UserName = 'John';   // PascalCase
const u = 'John';          // too short
const theUserNameString = 'John'; // redundant
```

### Boolean Variables

Use prefixes like `is`, `has`, `can`, `should`, `will`, `did`.

```typescript
// Good - reads as a question
const isAuthenticated = true;
const hasPermission = checkPermission(user);
const canEdit = user.role === 'admin';
const shouldRefresh = data.isStale;
const willRedirect = response.status === 302;
const didComplete = task.status === 'completed';

// Bad - unclear intent
const authenticated = true;
const permission = true;
const edit = true;
const flag = true;
```

### Arrays and Collections

Use plural nouns.

```typescript
// Good
const users: User[] = [];
const selectedItems: Item[] = [];
const validationErrors: ValidationError[] = [];

// Bad
const user: User[] = [];      // singular for array
const userList: User[] = [];  // redundant 'List'
const userArray: User[] = []; // redundant 'Array'
```

### Maps and Dictionaries

Use descriptive names that indicate key-value relationship.

```typescript
// Good
const userById: Map<string, User> = new Map();
const permissionsByRole: Record<Role, Permission[]> = {};
const priceByProductId: Record<string, number> = {};

// Bad
const userMap: Map<string, User> = new Map();  // redundant 'Map'
const data: Record<string, User> = {};         // too generic
```

## Constants

Use UPPER_SNAKE_CASE for true constants (values that never change).

```typescript
// Good - compile-time constants
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;
const API_BASE_URL = 'https://api.example.com';
const MIN_PASSWORD_LENGTH = 8;

// Configuration objects can use UPPER_SNAKE_CASE
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
} as const;

// Bad
const maxRetryAttempts = 3;   // Looks mutable
const max_retry_attempts = 3; // Wrong case
```

### Runtime Values

For values determined at runtime, use camelCase even if they don't change.

```typescript
// Good - determined at runtime
const currentUser = await fetchCurrentUser();
const serverConfig = loadConfig();
const startTime = Date.now();

// Not constants - these are computed values
```

## Functions

Use camelCase. Names should describe the action.

### Action Functions

Use verbs that describe what the function does.

```typescript
// Good - clear action verbs
function getUserById(id: string): Promise<User> { }
function calculateTotalPrice(items: CartItem[]): number { }
function validateEmail(email: string): boolean { }
function sendNotification(user: User, message: string): Promise<void> { }

// Bad - unclear or noun-like
function user(id: string): Promise<User> { }
function total(items: CartItem[]): number { }
function email(email: string): boolean { }
```

### Getter Functions

Use `get` prefix when retrieving a value.

```typescript
// Good
function getUser(id: string): User { }
function getCurrentTimestamp(): number { }
function getFormattedDate(date: Date): string { }

// For computed properties, 'get' is optional
function fullName(user: User): string { }
function totalCount(items: Item[]): number { }
```

### Boolean-Returning Functions

Use `is`, `has`, `can`, `should` prefixes.

```typescript
// Good
function isValidEmail(email: string): boolean { }
function hasPermission(user: User, action: string): boolean { }
function canAccessResource(user: User, resource: Resource): boolean { }
function shouldRetry(error: Error, attempts: number): boolean { }

// Bad
function validateEmail(email: string): boolean { }  // unclear if returns boolean
function checkPermission(user: User): boolean { }    // 'check' is ambiguous
```

### Event Handlers

Use `handle` prefix or `on` prefix for callbacks.

```typescript
// Good - handler functions
function handleSubmit(event: FormEvent): void { }
function handleUserClick(user: User): void { }
function handleError(error: Error): void { }

// Good - callback props
interface Props {
  onClick: () => void;
  onSubmit: (data: FormData) => void;
  onError: (error: Error) => void;
}
```

### Async Functions

Include `async` in name if it clarifies intent (optional).

```typescript
// Both are acceptable
async function fetchUser(id: string): Promise<User> { }
async function getUser(id: string): Promise<User> { }

// The 'fetch' prefix implies async operation
async function fetchData(): Promise<Data> { }
async function loadConfiguration(): Promise<Config> { }
```

## Classes and Interfaces

Use PascalCase. Names should be nouns.

### Classes

```typescript
// Good
class UserService { }
class DatabaseConnection { }
class EmailNotificationSender { }
class AuthenticationMiddleware { }

// Bad
class userService { }        // camelCase
class User_Service { }       // snake_case
class HandleUser { }         // verb
class IUserService { }       // I prefix
```

### Interfaces

```typescript
// Good - no 'I' prefix
interface User {
  id: string;
  name: string;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

interface ButtonProps {
  label: string;
  onClick: () => void;
}

// Bad
interface IUser { }          // I prefix
interface UserInterface { }  // redundant suffix
```

### Types

```typescript
// Good
type UserId = string;
type UserRole = 'admin' | 'user' | 'guest';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type Nullable<T> = T | null;

// Bad
type TUserId = string;       // T prefix
type UserIdType = string;    // redundant suffix
```

## Components

React components use PascalCase.

```typescript
// Good
function UserProfile({ user }: UserProfileProps) { }
function DataTable({ data, columns }: DataTableProps) { }
function NavigationMenu() { }

// Bad
function userProfile() { }   // camelCase
function User_Profile() { }  // snake_case
function USER_PROFILE() { }  // UPPER_CASE
```

### Component Props

```typescript
// Good - Props suffix
interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

// Bad
interface UserCardParameters { }  // Use Props
interface IUserCardProps { }      // No I prefix
```

## Files and Folders

### File Names

```typescript
// Components - PascalCase
UserProfile.tsx
DataTable.tsx
NavigationMenu.tsx

// Hooks - camelCase with 'use' prefix
useUser.ts
useLocalStorage.ts
useDebounce.ts

// Utilities - camelCase
formatDate.ts
validateEmail.ts
apiClient.ts

// Constants - camelCase or UPPER_SNAKE_CASE
constants.ts
config.ts
API_ENDPOINTS.ts

// Types - PascalCase or camelCase
types.ts
User.types.ts
apiTypes.ts

// Tests - match source file
UserProfile.test.tsx
formatDate.test.ts
useUser.test.ts
```

### Folder Names

Use kebab-case for folders.

```
src/
├── components/
│   ├── user-profile/
│   ├── data-table/
│   └── navigation-menu/
├── hooks/
├── services/
│   ├── api-client/
│   └── auth-service/
├── utils/
│   ├── date-formatting/
│   └── validation/
└── types/
```

## Database

### Tables

Use snake_case, plural nouns.

```sql
-- Good
CREATE TABLE users ();
CREATE TABLE user_profiles ();
CREATE TABLE order_items ();
CREATE TABLE password_reset_tokens ();

-- Bad
CREATE TABLE User ();           -- PascalCase
CREATE TABLE user ();           -- singular
CREATE TABLE userProfiles ();   -- camelCase
```

### Columns

Use snake_case.

```sql
-- Good
CREATE TABLE users (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email_address VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  is_active BOOLEAN
);

-- Bad
CREATE TABLE users (
  firstName VARCHAR(100),    -- camelCase
  LastName VARCHAR(100),     -- PascalCase
  emailAddress VARCHAR(255)  -- camelCase
);
```

### Sequelize Models

```typescript
// Model name: PascalCase singular
// Table name: snake_case plural

@Table({ tableName: 'users' })
class User extends Model {
  @Column({ field: 'first_name' })
  firstName: string;

  @Column({ field: 'last_name' })
  lastName: string;

  @Column({ field: 'created_at' })
  createdAt: Date;
}
```

## Special Cases

### Abbreviations

Treat abbreviations as words.

```typescript
// Good
const userId = '123';
const htmlContent = '<div></div>';
const apiUrl = 'https://api.example.com';
const xmlParser = new XmlParser();
const httpClient = new HttpClient();
const ioStream = createStream();

// Bad
const userID = '123';         // ID should be Id
const HTMLContent = '<div>';  // HTML should be Html
const APIUrl = 'https://...'; // API should be Api
```

### Acronyms in PascalCase

```typescript
// Good
class HttpClient { }
class XmlParser { }
class IoManager { }
class ApiService { }
function getUrlPath(): string { }

// Bad
class HTTPClient { }
class XMLParser { }
class IOManager { }
```

### Private Members

Use underscore prefix only for unused parameters (per ESLint config).

```typescript
// Unused parameters - underscore prefix allowed
function handleClick(_event: MouseEvent) {
  // event parameter required by type but not used
}

users.forEach((_user, index) => {
  console.log(index);
});

// Private class members - no underscore needed
class UserService {
  private userRepository: UserRepository; // Not _userRepository
  private cache: Map<string, User>;       // Not _cache

  private fetchFromApi(): Promise<User[]> { } // Not _fetchFromApi
}
```

## Summary Checklist

- [ ] Variables use camelCase
- [ ] Booleans use is/has/can/should prefixes
- [ ] Constants use UPPER_SNAKE_CASE
- [ ] Functions use camelCase with action verbs
- [ ] Classes and interfaces use PascalCase
- [ ] No `I` prefix on interfaces
- [ ] Components use PascalCase
- [ ] Files match their export naming
- [ ] Folders use kebab-case
- [ ] Database tables/columns use snake_case
- [ ] Abbreviations treated as words (Http not HTTP)

## Related Documents

- [TypeScript Standards](./typescript-standards.md)
- [Type Safety](./type-safety.md)
- [Clean Code Principles](../01-foundations/clean-code.md)
