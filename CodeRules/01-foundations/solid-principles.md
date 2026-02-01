# SOLID Principles

The SOLID principles are five design principles for writing maintainable, scalable object-oriented code. While TypeScript is not purely OOP, these principles apply to component design, service architecture, and module organization.

## Overview

| Principle | Name | Summary |
|-----------|------|---------|
| **S** | Single Responsibility | A class/module should have only one reason to change |
| **O** | Open/Closed | Open for extension, closed for modification |
| **L** | Liskov Substitution | Subtypes must be substitutable for their base types |
| **I** | Interface Segregation | Many specific interfaces are better than one general |
| **D** | Dependency Inversion | Depend on abstractions, not concretions |

## S - Single Responsibility Principle (SRP)

> "A class should have only one reason to change."

Each module, class, or function should have responsibility over a single part of functionality.

### Bad Example

```typescript
// Bad: User class does too many things
class User {
  constructor(
    public name: string,
    public email: string
  ) {}

  // User data management
  save(): Promise<void> {
    // Saves to database
  }

  // Validation logic
  validate(): boolean {
    return this.email.includes('@') && this.name.length > 0;
  }

  // Email sending
  sendWelcomeEmail(): Promise<void> {
    // Sends email via SMTP
  }

  // Report generation
  generateReport(): string {
    // Creates PDF report
  }

  // Authentication
  authenticate(password: string): boolean {
    // Checks password
  }
}
```

### Good Example

```typescript
// Good: Separate responsibilities into focused classes/modules

// User entity - only holds data
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

// Validation service
class UserValidator {
  validate(input: CreateUserInput): ValidationResult {
    const errors: string[] = [];

    if (!input.email.includes('@')) {
      errors.push('Invalid email format');
    }
    if (input.name.length === 0) {
      errors.push('Name is required');
    }

    return { isValid: errors.length === 0, errors };
  }
}

// Persistence service
class UserRepository {
  async save(user: User): Promise<User> {
    return await this.db.users.create(user);
  }

  async findById(id: string): Promise<User | null> {
    return await this.db.users.findByPk(id);
  }
}

// Email service
class EmailService {
  async sendWelcomeEmail(user: User): Promise<void> {
    await this.mailer.send({
      to: user.email,
      template: 'welcome',
      data: { name: user.name },
    });
  }
}

// Authentication service
class AuthenticationService {
  async authenticate(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }
}
```

### React Component Example

```tsx
// Bad: Component does too much
function UserDashboard({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetches user data
  useEffect(() => { /* fetch user */ }, [userId]);
  // Fetches posts
  useEffect(() => { /* fetch posts */ }, [userId]);
  // Fetches notifications
  useEffect(() => { /* fetch notifications */ }, [userId]);
  // Sets up websocket for real-time updates
  useEffect(() => { /* websocket logic */ }, []);

  // Renders everything
  return (
    <div>
      {/* User profile */}
      {/* Posts list */}
      {/* Notifications */}
      {/* Sidebar */}
    </div>
  );
}

// Good: Split into focused components
function UserDashboard({ userId }: { userId: string }) {
  return (
    <DashboardLayout>
      <UserProfile userId={userId} />
      <UserPosts userId={userId} />
      <NotificationPanel userId={userId} />
    </DashboardLayout>
  );
}

function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUser(userId);
  if (isLoading) return <ProfileSkeleton />;
  return <ProfileCard user={user} />;
}

function UserPosts({ userId }: { userId: string }) {
  const { data: posts } = usePosts(userId);
  return <PostList posts={posts} />;
}
```

## O - Open/Closed Principle (OCP)

> "Software entities should be open for extension, but closed for modification."

Design modules that can be extended with new functionality without changing existing code.

### Bad Example

```typescript
// Bad: Must modify function to add new payment types
function processPayment(payment: Payment): void {
  if (payment.type === 'credit_card') {
    // Process credit card
    chargeCreditCard(payment.cardNumber, payment.amount);
  } else if (payment.type === 'paypal') {
    // Process PayPal
    chargePayPal(payment.email, payment.amount);
  } else if (payment.type === 'stripe') {
    // Process Stripe - had to modify this function!
    chargeStripe(payment.stripeToken, payment.amount);
  }
  // Every new payment type requires modifying this function
}
```

### Good Example

```typescript
// Good: Use interfaces and polymorphism
interface PaymentProcessor {
  type: string;
  process(payment: Payment): Promise<PaymentResult>;
}

class CreditCardProcessor implements PaymentProcessor {
  type = 'credit_card';

  async process(payment: Payment): Promise<PaymentResult> {
    return await this.gateway.charge(payment.cardNumber, payment.amount);
  }
}

class PayPalProcessor implements PaymentProcessor {
  type = 'paypal';

  async process(payment: Payment): Promise<PaymentResult> {
    return await this.paypal.charge(payment.email, payment.amount);
  }
}

// New payment type - no modification to existing code
class StripeProcessor implements PaymentProcessor {
  type = 'stripe';

  async process(payment: Payment): Promise<PaymentResult> {
    return await this.stripe.charge(payment.token, payment.amount);
  }
}

// Payment service uses registry pattern
class PaymentService {
  private processors = new Map<string, PaymentProcessor>();

  register(processor: PaymentProcessor): void {
    this.processors.set(processor.type, processor);
  }

  async process(payment: Payment): Promise<PaymentResult> {
    const processor = this.processors.get(payment.type);
    if (!processor) {
      throw new Error(`Unknown payment type: ${payment.type}`);
    }
    return await processor.process(payment);
  }
}
```

### React Example with Composition

```tsx
// Bad: Hardcoded notification types
function Notification({ notification }: Props) {
  if (notification.type === 'success') {
    return <div className="success">{notification.message}</div>;
  } else if (notification.type === 'error') {
    return <div className="error">{notification.message}</div>;
  } else if (notification.type === 'warning') {
    return <div className="warning">{notification.message}</div>;
  }
  return null;
}

// Good: Extensible through composition
interface NotificationProps {
  message: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

function Notification({ message, icon, actions }: NotificationProps) {
  return (
    <Alert>
      {icon && <AlertIcon>{icon}</AlertIcon>}
      <AlertMessage>{message}</AlertMessage>
      {actions && <AlertActions>{actions}</AlertActions>}
    </Alert>
  );
}

// Extend without modifying base component
function SuccessNotification({ message }: { message: string }) {
  return <Notification message={message} icon={<CheckIcon />} />;
}

function ErrorNotification({ message, onRetry }: Props) {
  return (
    <Notification
      message={message}
      icon={<ErrorIcon />}
      actions={<Button onClick={onRetry}>Retry</Button>}
    />
  );
}
```

## L - Liskov Substitution Principle (LSP)

> "Objects of a superclass should be replaceable with objects of its subclasses without breaking the application."

Derived classes must be substitutable for their base classes.

### Bad Example

```typescript
// Bad: Square violates LSP when substituted for Rectangle
class Rectangle {
  constructor(
    protected width: number,
    protected height: number
  ) {}

  setWidth(width: number): void {
    this.width = width;
  }

  setHeight(height: number): void {
    this.height = height;
  }

  getArea(): number {
    return this.width * this.height;
  }
}

class Square extends Rectangle {
  setWidth(width: number): void {
    this.width = width;
    this.height = width; // Violates LSP - unexpected side effect
  }

  setHeight(height: number): void {
    this.width = height;
    this.height = height; // Violates LSP - unexpected side effect
  }
}

// This function breaks with Square
function resize(rect: Rectangle): void {
  rect.setWidth(10);
  rect.setHeight(5);
  // Expected area: 50
  // Square area: 25 (broken!)
  console.log(rect.getArea());
}
```

### Good Example

```typescript
// Good: Use composition and interfaces
interface Shape {
  getArea(): number;
}

class Rectangle implements Shape {
  constructor(
    private width: number,
    private height: number
  ) {}

  getArea(): number {
    return this.width * this.height;
  }
}

class Square implements Shape {
  constructor(private side: number) {}

  getArea(): number {
    return this.side * this.side;
  }
}

// Both work correctly
function calculateTotalArea(shapes: Shape[]): number {
  return shapes.reduce((total, shape) => total + shape.getArea(), 0);
}
```

### TypeScript Interface Example

```typescript
// Bad: Implementation doesn't match contract
interface DataFetcher {
  fetch(url: string): Promise<Response>;
}

class CachedFetcher implements DataFetcher {
  async fetch(url: string): Promise<Response> {
    const cached = this.cache.get(url);
    if (cached) {
      // Returns a different type than expected!
      return cached as any;
    }
    return await fetch(url);
  }
}

// Good: Consistent behavior
interface DataFetcher<T> {
  fetch(url: string): Promise<T>;
}

class ApiFetcher implements DataFetcher<ApiResponse> {
  async fetch(url: string): Promise<ApiResponse> {
    const response = await fetch(url);
    return response.json();
  }
}

class CachedFetcher implements DataFetcher<ApiResponse> {
  constructor(private fetcher: DataFetcher<ApiResponse>) {}

  async fetch(url: string): Promise<ApiResponse> {
    const cached = this.cache.get(url);
    if (cached) {
      return cached; // Same type as non-cached
    }
    const result = await this.fetcher.fetch(url);
    this.cache.set(url, result);
    return result;
  }
}
```

## I - Interface Segregation Principle (ISP)

> "Clients should not be forced to depend on interfaces they do not use."

Create specific interfaces rather than one general-purpose interface.

### Bad Example

```typescript
// Bad: Monolithic interface
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
  attendMeeting(): void;
  writeReport(): void;
  managePeople(): void;
}

// Robot can't eat or sleep
class Robot implements Worker {
  work(): void { /* works */ }
  eat(): void { throw new Error('Robots cannot eat'); }
  sleep(): void { throw new Error('Robots cannot sleep'); }
  attendMeeting(): void { /* attends */ }
  writeReport(): void { /* writes */ }
  managePeople(): void { throw new Error('Robots cannot manage'); }
}
```

### Good Example

```typescript
// Good: Segregated interfaces
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

interface Manageable {
  attendMeeting(): void;
  writeReport(): void;
}

interface Managing {
  managePeople(): void;
}

// Human implements what it needs
class Human implements Workable, Eatable, Sleepable, Manageable {
  work(): void { }
  eat(): void { }
  sleep(): void { }
  attendMeeting(): void { }
  writeReport(): void { }
}

// Robot only implements what it can do
class Robot implements Workable {
  work(): void { }
}

// Manager extends Human capabilities
class Manager extends Human implements Managing {
  managePeople(): void { }
}
```

### React Props Example

```tsx
// Bad: Component receives too many props it doesn't use
interface UserCardProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onExport: () => void;
  onPrint: () => void;
  permissions: Permission[];
  theme: Theme;
  locale: string;
}

function UserCard(props: UserCardProps) {
  // Only uses user and onEdit, but receives everything
  return (
    <Card>
      <h2>{props.user.name}</h2>
      <Button onClick={props.onEdit}>Edit</Button>
    </Card>
  );
}

// Good: Focused props
interface UserDisplayProps {
  user: User;
}

interface UserActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
}

function UserCard({ user, onEdit }: UserDisplayProps & UserActionsProps) {
  return (
    <Card>
      <h2>{user.name}</h2>
      {onEdit && <Button onClick={onEdit}>Edit</Button>}
    </Card>
  );
}

// Actions can be composed separately
function UserCardWithActions({ userId }: { userId: string }) {
  const user = useUser(userId);
  const { canEdit, canDelete } = usePermissions();

  return (
    <UserCard
      user={user}
      onEdit={canEdit ? () => editUser(userId) : undefined}
    />
  );
}
```

## D - Dependency Inversion Principle (DIP)

> "High-level modules should not depend on low-level modules. Both should depend on abstractions."

Depend on interfaces, not concrete implementations.

### Bad Example

```typescript
// Bad: High-level module depends on low-level module
class MySQLDatabase {
  save(data: object): void {
    // MySQL-specific implementation
  }
}

class UserService {
  private database = new MySQLDatabase(); // Tight coupling!

  saveUser(user: User): void {
    this.database.save(user);
  }
}
```

### Good Example

```typescript
// Good: Both depend on abstraction
interface Database {
  save(data: object): Promise<void>;
  findById(id: string): Promise<object | null>;
}

class MySQLDatabase implements Database {
  async save(data: object): Promise<void> {
    // MySQL implementation
  }

  async findById(id: string): Promise<object | null> {
    // MySQL implementation
  }
}

class PostgreSQLDatabase implements Database {
  async save(data: object): Promise<void> {
    // PostgreSQL implementation
  }

  async findById(id: string): Promise<object | null> {
    // PostgreSQL implementation
  }
}

class UserService {
  constructor(private database: Database) {} // Depends on abstraction

  async saveUser(user: User): Promise<void> {
    await this.database.save(user);
  }
}

// Usage - can inject any implementation
const mysqlService = new UserService(new MySQLDatabase());
const postgresService = new UserService(new PostgreSQLDatabase());

// Easy to test with mocks
const mockDb: Database = {
  save: jest.fn(),
  findById: jest.fn(),
};
const testService = new UserService(mockDb);
```

### React Context Example

```tsx
// Good: Components depend on abstraction (context)
interface AuthContext {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContext | null>(null);

function useAuth(): AuthContext {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Component depends on abstraction
function UserMenu() {
  const { user, logout } = useAuth(); // Doesn't know implementation details

  if (!user) return <LoginButton />;

  return (
    <Menu>
      <MenuItem>{user.name}</MenuItem>
      <MenuItem onClick={logout}>Logout</MenuItem>
    </Menu>
  );
}

// Can swap implementations
function AuthProvider({ children }: { children: React.ReactNode }) {
  // Can use any auth implementation
  const auth = useFirebaseAuth(); // or useAuth0() or useCustomAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
```

## Summary

| Principle | Key Question | Solution |
|-----------|--------------|----------|
| **SRP** | Does this have more than one reason to change? | Split into focused modules |
| **OCP** | Can I add features without modifying existing code? | Use interfaces and composition |
| **LSP** | Can I substitute subclasses without breaking code? | Ensure consistent behavior |
| **ISP** | Does the interface have methods clients don't use? | Create specific interfaces |
| **DIP** | Am I depending on concrete implementations? | Depend on abstractions |

## Related Documents

- [Clean Code Principles](./clean-code.md)
- [Design Principles](./design-principles.md)
- [TypeScript Standards](../02-typescript/typescript-standards.md)
