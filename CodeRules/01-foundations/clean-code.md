# Clean Code Principles

Based on Robert C. Martin's "Clean Code" - adapted for the VerifyWise tech stack.

## Core Philosophy

> "Clean code reads like well-written prose." - Robert C. Martin

Clean code is:
- **Readable**: Other developers can understand it quickly
- **Maintainable**: Easy to modify without introducing bugs
- **Testable**: Can be verified through automated tests
- **Efficient**: Does one thing well without unnecessary complexity

## 1. Meaningful Names

Names should reveal intent and be pronounceable, searchable, and consistent.

### Variables

```typescript
// Bad - cryptic, unclear intent
const d = new Date();
const u = users.filter(x => x.a);
const n = 5;

// Good - reveals intent
const currentDate = new Date();
const activeUsers = users.filter(user => user.isActive);
const maxRetryAttempts = 5;
```

### Functions

```typescript
// Bad - vague, doesn't describe what it does
function process(data: unknown) { }
function handle(item: Item) { }
function doStuff() { }

// Good - describes action and context
function validateUserInput(input: UserInput): ValidationResult { }
function calculateTotalPrice(items: CartItem[]): number { }
function sendPasswordResetEmail(user: User): Promise<void> { }
```

### Booleans

```typescript
// Bad - doesn't read naturally
const flag = true;
const status = false;
const check = true;

// Good - reads as a question
const isAuthenticated = true;
const hasPermission = false;
const shouldRefresh = true;
const canEdit = user.role === 'admin';
```

### Collections

```typescript
// Bad - singular or generic names
const user = []; // Is this one user or many?
const list = [];
const data = [];

// Good - plural, descriptive
const users: User[] = [];
const pendingOrders: Order[] = [];
const validationErrors: ValidationError[] = [];
```

### Constants

```typescript
// Bad - magic numbers/strings
if (password.length < 8) { }
if (retries > 3) { }
const url = 'https://api.example.com';

// Good - named constants
const MIN_PASSWORD_LENGTH = 8;
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

if (password.length < MIN_PASSWORD_LENGTH) { }
if (retries > MAX_RETRY_ATTEMPTS) { }
```

## 2. Small Functions

Functions should do one thing, do it well, and do it only.

### Single Responsibility

```typescript
// Bad - does multiple things
async function processUser(userData: UserInput) {
  // Validates
  if (!userData.email.includes('@')) {
    throw new Error('Invalid email');
  }
  if (userData.password.length < 8) {
    throw new Error('Password too short');
  }

  // Hashes password
  const hashedPassword = await bcrypt.hash(userData.password, 12);

  // Saves to database
  const user = await User.create({
    email: userData.email,
    password: hashedPassword,
  });

  // Sends email
  await sendEmail(user.email, 'Welcome!', 'Thanks for joining...');

  return user;
}

// Good - each function does one thing
function validateUserInput(input: UserInput): void {
  validateEmail(input.email);
  validatePassword(input.password);
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function createUser(input: ValidatedUserInput): Promise<User> {
  const hashedPassword = await hashPassword(input.password);
  return User.create({
    email: input.email,
    password: hashedPassword,
  });
}

async function sendWelcomeEmail(user: User): Promise<void> {
  await emailService.send({
    to: user.email,
    template: 'welcome',
    data: { name: user.name },
  });
}

// Orchestration function
async function registerUser(input: UserInput): Promise<User> {
  validateUserInput(input);
  const user = await createUser(input);
  await sendWelcomeEmail(user);
  return user;
}
```

### Function Length

Aim for functions that:
- Fit on one screen (approximately 20-30 lines)
- Have one level of abstraction
- Can be described in a single sentence

```typescript
// Bad - too long, multiple levels of abstraction
async function generateReport(options: ReportOptions) {
  // 100+ lines of mixed concerns...
}

// Good - broken into focused functions
async function generateReport(options: ReportOptions): Promise<Report> {
  const data = await fetchReportData(options);
  const processedData = transformReportData(data);
  const report = formatReport(processedData, options.format);
  await saveReport(report);
  return report;
}
```

### Argument Count

Limit function arguments - ideally 0-2, maximum 3. Use objects for more.

```typescript
// Bad - too many parameters
function createUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  role: string,
  department: string,
  startDate: Date
) { }

// Good - use an options object
interface CreateUserOptions {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  startDate: Date;
}

function createUser(options: CreateUserOptions): Promise<User> { }

// Or group related parameters
interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
}

interface UserCredentials {
  password: string;
  role: UserRole;
}

function createUser(
  profile: UserProfile,
  credentials: UserCredentials
): Promise<User> { }
```

## 3. Comments

Code should be self-documenting. Use comments sparingly and purposefully.

### When to Comment

```typescript
// Good: Explain WHY, not WHAT
// Using binary search because the array is always sorted and can be large (10k+ items)
const index = binarySearch(sortedUsers, targetId);

// Good: Clarify complex business rules
// Discount applies only to first-time customers who ordered within 30 days of signup
const isEligibleForDiscount =
  !customer.hasPreviousOrders &&
  daysSinceSignup(customer) <= 30;

// Good: Warn about consequences
// WARNING: This clears all user sessions - use only for security incidents
async function invalidateAllSessions(userId: string) { }

// Good: TODO with context
// TODO(#123): Replace with proper caching when Redis is available
const cachedResult = inMemoryCache.get(key);
```

### When NOT to Comment

```typescript
// Bad: Stating the obvious
// Increment counter by one
counter++;

// Get user from database
const user = await User.findById(id);

// Bad: Commented-out code (just delete it)
// const oldImplementation = () => { ... };

// Bad: Explaining bad code (refactor instead)
// This function is complex because it handles all user types
function processUserDataAndValidateAndSaveAndNotify() { }
```

### Use JSDoc for Public APIs

```typescript
/**
 * Calculates the total price including tax and discounts.
 *
 * @param items - Cart items to calculate
 * @param taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @param discountCode - Optional discount code to apply
 * @returns Total price in cents
 * @throws {InvalidDiscountError} If discount code is invalid
 *
 * @example
 * const total = calculateTotal(items, 0.08, 'SAVE10');
 */
function calculateTotal(
  items: CartItem[],
  taxRate: number,
  discountCode?: string
): number { }
```

## 4. The Boy Scout Rule

> "Leave the campground cleaner than you found it."

When you touch code:
- Fix minor issues you encounter
- Improve variable names
- Extract small functions
- Remove dead code
- Add missing types

```typescript
// Before: You're fixing a bug in this function
function calc(d) {
  var t = 0;
  for (var i = 0; i < d.length; i++) {
    t = t + d[i].p * d[i].q;
  }
  return t;
}

// After: Bug fixed AND code improved
function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}
```

### What NOT to Do

- Don't refactor everything at once
- Don't change unrelated code in the same PR
- Don't "improve" code you don't understand
- Don't break working code for style preferences

## 5. Error Handling

Handle errors gracefully without obscuring logic.

### Prefer Exceptions Over Error Codes

```typescript
// Bad - error codes
function getUser(id: string): User | null | -1 | -2 {
  // -1 = not found, -2 = database error ???
}

// Good - meaningful errors
class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

async function getUser(id: string): Promise<User> {
  const user = await User.findById(id);
  if (!user) {
    throw new UserNotFoundError(id);
  }
  return user;
}
```

### Don't Return Null

```typescript
// Bad - caller must remember to check
function findUser(id: string): User | null {
  return users.find(u => u.id === id) || null;
}

// Usage requires null check everywhere
const user = findUser(id);
if (user) {
  console.log(user.name); // Must check first
}

// Better - use Optional pattern or throw
function getUser(id: string): User {
  const user = users.find(u => u.id === id);
  if (!user) {
    throw new UserNotFoundError(id);
  }
  return user;
}

// Or use Result type for expected failures
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function findUser(id: string): Result<User, 'not_found'> {
  const user = users.find(u => u.id === id);
  return user
    ? { ok: true, value: user }
    : { ok: false, error: 'not_found' };
}
```

## 6. Formatting

Consistent formatting improves readability.

### Vertical Spacing

```typescript
// Group related code with blank lines

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { UserService } from '@/services/user';
import { formatDate } from '@/utils/date';

import type { User } from '@/types';

export function UserList() {
  // State declarations grouped
  const [filter, setFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Query hooks grouped
  const { data: users, isLoading } = useQuery({
    queryKey: ['users', filter],
    queryFn: () => UserService.getAll({ filter }),
  });

  // Event handlers grouped
  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  const handleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Render
  return (
    // JSX
  );
}
```

### Line Length

- Aim for 80-100 characters per line
- Break long statements at logical points

```typescript
// Bad - hard to read
const result = await someService.performComplexOperation(userId, { includeDetails: true, filterByStatus: 'active', sortBy: 'createdAt' });

// Good - broken at logical points
const result = await someService.performComplexOperation(userId, {
  includeDetails: true,
  filterByStatus: 'active',
  sortBy: 'createdAt',
});
```

## Summary

| Principle | Key Takeaway |
|-----------|--------------|
| Meaningful Names | Names should reveal intent |
| Small Functions | Do one thing well |
| Comments | Explain why, not what |
| Boy Scout Rule | Leave code cleaner |
| Error Handling | Use exceptions, don't return null |
| Formatting | Be consistent, use vertical spacing |

## Related Documents

- [SOLID Principles](./solid-principles.md)
- [Design Principles](./design-principles.md)
- [TypeScript Standards](../02-typescript/typescript-standards.md)
