# Design Principles

Fundamental design principles that guide software architecture decisions in VerifyWise.

## DRY - Don't Repeat Yourself

> "Every piece of knowledge must have a single, unambiguous, authoritative representation within a system."
> - Andy Hunt & Dave Thomas, "The Pragmatic Programmer"

### The Problem with Duplication

```typescript
// Bad: Validation logic duplicated across files

// In userController.ts
function createUser(data: UserInput) {
  if (!data.email.includes('@')) {
    throw new Error('Invalid email');
  }
  if (data.password.length < 8) {
    throw new Error('Password too short');
  }
  // ... create user
}

// In authController.ts (same validation repeated)
function register(data: UserInput) {
  if (!data.email.includes('@')) {
    throw new Error('Invalid email');
  }
  if (data.password.length < 8) {
    throw new Error('Password too short');
  }
  // ... register user
}

// In adminController.ts (again!)
function addUser(data: UserInput) {
  if (!data.email.includes('@')) {
    throw new Error('Invalid email');
  }
  if (data.password.length < 8) {
    throw new Error('Password too short');
  }
  // ... add user
}
```

### The Solution

```typescript
// Good: Single source of truth for validation

// validators/user.validator.ts
export const UserValidator = {
  validateEmail(email: string): void {
    if (!email.includes('@')) {
      throw new ValidationError('Invalid email format');
    }
  },

  validatePassword(password: string): void {
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      );
    }
  },

  validateUserInput(input: UserInput): void {
    this.validateEmail(input.email);
    this.validatePassword(input.password);
  },
};

// All controllers use the same validator
function createUser(data: UserInput) {
  UserValidator.validateUserInput(data);
  // ... create user
}

function register(data: UserInput) {
  UserValidator.validateUserInput(data);
  // ... register user
}
```

### Types of Duplication to Avoid

#### 1. Code Duplication

```typescript
// Bad: Same formatting logic everywhere
function displayUserDate(user: User) {
  return `${user.createdAt.getMonth() + 1}/${user.createdAt.getDate()}/${user.createdAt.getFullYear()}`;
}

function displayOrderDate(order: Order) {
  return `${order.orderDate.getMonth() + 1}/${order.orderDate.getDate()}/${order.orderDate.getFullYear()}`;
}

// Good: Extract to utility
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US');
}
```

#### 2. Data Duplication

```typescript
// Bad: User data stored in multiple places
interface Order {
  id: string;
  userId: string;
  userEmail: string;    // Duplicated from User
  userName: string;     // Duplicated from User
  userAddress: string;  // Duplicated from User
}

// Good: Reference the user
interface Order {
  id: string;
  userId: string;
  // Get user data through relationship when needed
}
```

#### 3. Logic Duplication

```typescript
// Bad: Business rule scattered across codebase
// In frontend
const canEdit = user.role === 'admin' || user.id === resource.ownerId;

// In backend
if (user.role === 'admin' || user.id === resource.ownerId) {
  // allow edit
}

// In middleware
const hasPermission = req.user.role === 'admin' || req.user.id === resource.ownerId;

// Good: Centralized permission check
// permissions/resource.permissions.ts
export function canEditResource(user: User, resource: Resource): boolean {
  return user.role === 'admin' || user.id === resource.ownerId;
}
```

### When Duplication is Acceptable

Not all apparent duplication is bad. Code that looks similar but changes for different reasons should remain separate.

```typescript
// These look similar but serve different purposes

// For API responses - may need different fields for external consumers
interface UserApiResponse {
  id: string;
  name: string;
  email: string;
}

// For internal use - may need more fields
interface UserInternal {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  internalNotes: string;
}

// These should NOT be merged just because they look similar
```

## KISS - Keep It Simple, Stupid

> "Simplicity is the ultimate sophistication." - Leonardo da Vinci

Prefer simple solutions over complex ones. Simple code is easier to understand, maintain, and debug.

### Over-Engineering Examples

```typescript
// Bad: Over-engineered for a simple task
class StringReverserFactory {
  createReverser(): StringReverser {
    return new StringReverserImpl();
  }
}

interface StringReverser {
  reverse(str: string): string;
}

class StringReverserImpl implements StringReverser {
  reverse(str: string): string {
    return new StringBuilder(str).reverse().build();
  }
}

class StringBuilder {
  // ... 50 lines of abstraction
}

// Good: Simple and direct
function reverseString(str: string): string {
  return str.split('').reverse().join('');
}
```

### Unnecessary Abstraction

```typescript
// Bad: Abstraction for single implementation
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

interface IUserService {
  getUser(id: string): Promise<User>;
  createUser(data: CreateUserDto): Promise<User>;
}

interface IUserController {
  handleGetUser(req: Request, res: Response): Promise<void>;
}

// When you'll never have more than one implementation...

// Good: Direct implementation (add abstraction when needed)
class UserService {
  async getUser(id: string): Promise<User> {
    return await User.findByPk(id);
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return await User.create(data);
  }
}
```

### Complex vs Simple Solutions

```typescript
// Bad: Complex state management for simple form
const formSlice = createSlice({
  name: 'contactForm',
  initialState: {
    fields: {
      name: { value: '', touched: false, error: null },
      email: { value: '', touched: false, error: null },
      message: { value: '', touched: false, error: null },
    },
    isSubmitting: false,
    submitError: null,
    submitSuccess: false,
  },
  reducers: {
    setField: (state, action) => { /* ... */ },
    setTouched: (state, action) => { /* ... */ },
    setError: (state, action) => { /* ... */ },
    startSubmit: (state) => { /* ... */ },
    submitSuccess: (state) => { /* ... */ },
    submitFailure: (state, action) => { /* ... */ },
    reset: (state) => { /* ... */ },
  },
});

// Good: Simple local state for simple form
function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await submitForm(formData);
    setIsSubmitting(false);
  };

  return (/* form JSX */);
}
```

### KISS Guidelines

1. **Start simple, add complexity only when needed**
2. **Prefer standard library functions over custom implementations**
3. **Avoid premature optimization**
4. **Question every abstraction - does it earn its complexity?**
5. **Write code that junior developers can understand**

## YAGNI - You Aren't Gonna Need It

> "Always implement things when you actually need them, never when you just foresee that you need them."
> - Ron Jeffries

Don't add functionality until it's necessary.

### Speculative Features

```typescript
// Bad: Building for hypothetical future requirements
interface User {
  id: string;
  name: string;
  email: string;

  // "We might need these later"
  middleName?: string;
  suffix?: string;
  preferredLanguage?: string;
  timezone?: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  bio?: string;
  website?: string;
  twitterHandle?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  // ... 20 more optional fields
}

// Good: Only what's needed now
interface User {
  id: string;
  name: string;
  email: string;
}

// Add fields when there's an actual requirement
```

### Over-Parameterization

```typescript
// Bad: Parameters for every conceivable option
function fetchUsers(options: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterByRole?: string;
  filterByStatus?: string;
  filterByDateRange?: { start: Date; end: Date };
  includeDeleted?: boolean;
  includeInactive?: boolean;
  searchQuery?: string;
  searchFields?: string[];
  projection?: string[];
  populate?: string[];
  lean?: boolean;
  cache?: boolean;
  cacheTTL?: number;
}) {
  // Most of these are never used
}

// Good: Start with what you need
function fetchUsers(options: {
  page?: number;
  limit?: number;
}): Promise<User[]> {
  // Add more options when there's a real use case
}
```

### Premature Abstraction

```typescript
// Bad: Generic solution for specific problem
class GenericDataProcessor<T, U, V> {
  constructor(
    private transformer: DataTransformer<T, U>,
    private validator: DataValidator<U>,
    private persister: DataPersister<U, V>
  ) {}

  async process(data: T): Promise<V> {
    const transformed = await this.transformer.transform(data);
    await this.validator.validate(transformed);
    return await this.persister.persist(transformed);
  }
}

// When you only need to save users...

// Good: Specific solution for specific problem
async function saveUser(userData: UserInput): Promise<User> {
  const validated = validateUserData(userData);
  return await User.create(validated);
}
```

### YAGNI Guidelines

1. **Solve today's problem, not tomorrow's imagined problem**
2. **Delete code that's not being used**
3. **Don't build "just in case" features**
4. **Features can always be added later when needed**
5. **Unused code is not an asset - it's a liability**

## Clean Architecture

VerifyWise follows Clean Architecture principles to separate concerns and maintain independence between layers.

### Layer Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│                    (React Components)                    │
├─────────────────────────────────────────────────────────┤
│                    Application Layer                     │
│              (Use Cases, Business Logic)                 │
├─────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                   │
│         (Database, External APIs, File System)           │
└─────────────────────────────────────────────────────────┘
```

### Dependency Rule

Dependencies should always point inward. Inner layers should not know about outer layers.

```typescript
// Good: Inner layer defines interface
// domain/repositories/IUserRepository.ts
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

// Outer layer implements interface
// infrastructure/repositories/UserRepository.ts
class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    return await UserModel.findByPk(id);
  }

  async save(user: User): Promise<User> {
    return await UserModel.create(user);
  }
}

// Application layer depends on abstraction
// application/services/UserService.ts
class UserService {
  constructor(private userRepo: IUserRepository) {}

  async getUser(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new UserNotFoundError(id);
    return user;
  }
}
```

### React Application Structure

```
src/
├── components/        # Presentational components (UI)
│   ├── common/       # Shared UI components
│   └── features/     # Feature-specific components
├── pages/            # Page components (route handlers)
├── hooks/            # Custom hooks (application logic)
├── services/         # API services (infrastructure)
├── stores/           # State management (application)
├── types/            # TypeScript types (domain)
└── utils/            # Utility functions
```

### Benefits

1. **Testability**: Business logic can be tested without UI or database
2. **Flexibility**: Can swap implementations (e.g., change database)
3. **Maintainability**: Changes in one layer don't ripple through
4. **Independence**: Teams can work on layers independently

## Composition Over Inheritance

Prefer composing objects from smaller pieces rather than inheriting from base classes.

### Inheritance Problems

```typescript
// Bad: Deep inheritance hierarchy
class Animal {
  eat() { }
  sleep() { }
}

class Mammal extends Animal {
  breathe() { }
  walk() { }
}

class Dog extends Mammal {
  bark() { }
}

class Robot {
  // Can't reuse walk() without inheriting Animal properties
}

// What about a robotic dog that walks but doesn't eat?
```

### Composition Solution

```typescript
// Good: Compose behaviors
interface Walker {
  walk(): void;
}

interface Eater {
  eat(): void;
}

interface Barker {
  bark(): void;
}

// Mix behaviors as needed
class Dog implements Walker, Eater, Barker {
  constructor(
    private walkBehavior: WalkBehavior,
    private eatBehavior: EatBehavior
  ) {}

  walk() { this.walkBehavior.walk(); }
  eat() { this.eatBehavior.eat(); }
  bark() { console.log('Woof!'); }
}

class RobotDog implements Walker, Barker {
  constructor(private walkBehavior: WalkBehavior) {}

  walk() { this.walkBehavior.walk(); }
  bark() { console.log('WOOF!'); }
  // No eat() - robots don't eat
}
```

### React Composition

```tsx
// Bad: Inheritance pattern in React
class BaseButton extends React.Component {
  render() {
    return <button className="base">{this.props.children}</button>;
  }
}

class PrimaryButton extends BaseButton {
  render() {
    return <button className="primary">{this.props.children}</button>;
  }
}

// Good: Composition pattern
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

function Button({ variant = 'primary', size = 'medium', children }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} btn-${size}`}>
      {children}
    </button>
  );
}

// Compose specialized buttons
function DeleteButton({ children, ...props }: Omit<ButtonProps, 'variant'>) {
  return (
    <Button variant="danger" {...props}>
      <TrashIcon /> {children}
    </Button>
  );
}
```

## Summary

| Principle | Key Question | Action |
|-----------|--------------|--------|
| **DRY** | Is this logic duplicated elsewhere? | Extract to single source |
| **KISS** | Is there a simpler solution? | Reduce complexity |
| **YAGNI** | Is this needed right now? | Remove speculative code |
| **Clean Architecture** | Do dependencies point inward? | Separate concerns |
| **Composition** | Am I inheriting too much? | Compose from smaller pieces |

## Related Documents

- [Clean Code Principles](./clean-code.md)
- [SOLID Principles](./solid-principles.md)
- [TypeScript Standards](../02-typescript/typescript-standards.md)
