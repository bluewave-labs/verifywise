# Database Patterns

Guidelines for working with PostgreSQL and Sequelize in VerifyWise.

## Sequelize Model Definition

### Basic Model

```typescript
// models/User.ts
import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/database';

class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare passwordHash: string;
  declare name: string;
  declare role: 'admin' | 'user';
  declare isActive: CreationOptional<boolean>;
  declare lastLoginAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash', // Snake case in DB
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      defaultValue: 'user',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'users',
    underscored: true, // Use snake_case for all fields
    timestamps: true,
  }
);

export { User };
```

### Model with Associations

```typescript
// models/Project.ts
import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, NonAttribute } from 'sequelize';
import { User } from './User';

class Project extends Model<
  InferAttributes<Project>,
  InferCreationAttributes<Project>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare description: string | null;
  declare ownerId: ForeignKey<User['id']>;
  declare status: 'draft' | 'active' | 'completed' | 'archived';
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Association accessors
  declare owner?: NonAttribute<User>;
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'owner_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'completed', 'archived'),
      defaultValue: 'draft',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'projects',
    underscored: true,
    timestamps: true,
  }
);

export { Project };
```

### Define Associations

```typescript
// models/index.ts
import { User } from './User';
import { Project } from './Project';
import { ProjectMember } from './ProjectMember';

// Define associations
User.hasMany(Project, {
  foreignKey: 'ownerId',
  as: 'ownedProjects',
});

Project.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner',
});

// Many-to-many through join table
User.belongsToMany(Project, {
  through: ProjectMember,
  foreignKey: 'userId',
  otherKey: 'projectId',
  as: 'projects',
});

Project.belongsToMany(User, {
  through: ProjectMember,
  foreignKey: 'projectId',
  otherKey: 'userId',
  as: 'members',
});

export { User, Project, ProjectMember };
```

## Migrations

### Creating Migrations

```typescript
// migrations/20240101000000-create-users-table.ts
import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('users', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      defaultValue: 'user',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Add indexes
  await queryInterface.addIndex('users', ['email'], { unique: true });
  await queryInterface.addIndex('users', ['role']);
  await queryInterface.addIndex('users', ['is_active']);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('users');
}
```

### Migration Best Practices

```typescript
// Always provide rollback
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.addColumn('users', 'phone', {
    type: DataTypes.STRING(20),
    allowNull: true,
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeColumn('users', 'phone');
}

// Use transactions for multi-step migrations
export async function up(queryInterface: QueryInterface): Promise<void> {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    await queryInterface.addColumn(
      'users',
      'status',
      { type: DataTypes.STRING(20), allowNull: true },
      { transaction }
    );

    await queryInterface.sequelize.query(
      `UPDATE users SET status = 'active' WHERE is_active = true`,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `UPDATE users SET status = 'inactive' WHERE is_active = false`,
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

## Queries

### Basic Queries

```typescript
// services/user.service.ts

// Find by ID
async findById(id: string): Promise<User | null> {
  return User.findByPk(id);
}

// Find one by condition
async findByEmail(email: string): Promise<User | null> {
  return User.findOne({
    where: { email },
  });
}

// Find all with conditions
async findActiveUsers(): Promise<User[]> {
  return User.findAll({
    where: { isActive: true },
    order: [['createdAt', 'DESC']],
  });
}

// Create
async create(data: CreateUserInput): Promise<User> {
  return User.create({
    email: data.email,
    passwordHash: await hashPassword(data.password),
    name: data.name,
  });
}

// Update
async update(id: string, data: UpdateUserInput): Promise<User | null> {
  const user = await User.findByPk(id);
  if (!user) return null;

  await user.update(data);
  return user;
}

// Delete
async delete(id: string): Promise<boolean> {
  const deleted = await User.destroy({
    where: { id },
  });
  return deleted > 0;
}
```

### Complex Queries

```typescript
// Pagination
async findAll(options: {
  page: number;
  limit: number;
  search?: string;
}): Promise<{ users: User[]; total: number }> {
  const { page, limit, search } = options;
  const offset = (page - 1) * limit;

  const where: WhereOptions<User> = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows: users, count: total } = await User.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return { users, total };
}

// With associations
async findWithProjects(userId: string): Promise<User | null> {
  return User.findByPk(userId, {
    include: [
      {
        model: Project,
        as: 'ownedProjects',
        where: { status: 'active' },
        required: false,
      },
    ],
  });
}

// Aggregations
async getStatsByRole(): Promise<{ role: string; count: number }[]> {
  const results = await User.findAll({
    attributes: [
      'role',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    group: ['role'],
    raw: true,
  });

  return results as { role: string; count: number }[];
}
```

### Query Operators

```typescript
import { Op } from 'sequelize';

// Comparison
User.findAll({
  where: {
    createdAt: { [Op.gte]: new Date('2024-01-01') },
    role: { [Op.ne]: 'admin' },
    age: { [Op.between]: [18, 65] },
  },
});

// Logical
User.findAll({
  where: {
    [Op.or]: [
      { role: 'admin' },
      { isActive: true },
    ],
    [Op.and]: [
      { createdAt: { [Op.gte]: startDate } },
      { createdAt: { [Op.lte]: endDate } },
    ],
  },
});

// String matching
User.findAll({
  where: {
    email: { [Op.like]: '%@example.com' },
    name: { [Op.iLike]: '%john%' }, // Case insensitive (PostgreSQL)
  },
});

// Array operators
User.findAll({
  where: {
    role: { [Op.in]: ['admin', 'manager'] },
    id: { [Op.notIn]: excludedIds },
  },
});

// Null checks
User.findAll({
  where: {
    lastLoginAt: { [Op.not]: null },
    deletedAt: { [Op.is]: null },
  },
});
```

## Transactions

### Basic Transaction

```typescript
import { sequelize } from '../config/database';

async transferCredits(
  fromUserId: string,
  toUserId: string,
  amount: number
): Promise<void> {
  const transaction = await sequelize.transaction();

  try {
    // Deduct from sender
    await User.decrement('credits', {
      by: amount,
      where: { id: fromUserId },
      transaction,
    });

    // Add to receiver
    await User.increment('credits', {
      by: amount,
      where: { id: toUserId },
      transaction,
    });

    // Log the transfer
    await TransferLog.create({
      fromUserId,
      toUserId,
      amount,
    }, { transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

### Managed Transaction

```typescript
// Sequelize handles commit/rollback automatically
async createProjectWithMembers(
  projectData: CreateProjectInput,
  memberIds: string[]
): Promise<Project> {
  return sequelize.transaction(async (transaction) => {
    const project = await Project.create(projectData, { transaction });

    await ProjectMember.bulkCreate(
      memberIds.map(userId => ({
        projectId: project.id,
        userId,
        role: 'member',
      })),
      { transaction }
    );

    return project;
  });
}
```

### Transaction Isolation Levels

```typescript
import { Transaction } from 'sequelize';

await sequelize.transaction(
  {
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  },
  async (transaction) => {
    // Operations with serializable isolation
  }
);

// Isolation levels:
// - READ_UNCOMMITTED
// - READ_COMMITTED (default for PostgreSQL)
// - REPEATABLE_READ
// - SERIALIZABLE
```

## Soft Deletes

### Model with Paranoid

```typescript
class User extends Model {
  declare deletedAt: Date | null;
}

User.init(
  {
    // ... other fields
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    tableName: 'users',
    paranoid: true, // Enable soft deletes
    timestamps: true,
  }
);
```

### Soft Delete Queries

```typescript
// Delete (soft)
await user.destroy(); // Sets deletedAt

// Find excludes soft-deleted by default
const users = await User.findAll(); // Only non-deleted

// Include soft-deleted
const allUsers = await User.findAll({ paranoid: false });

// Find only soft-deleted
const deletedUsers = await User.findAll({
  where: { deletedAt: { [Op.not]: null } },
  paranoid: false,
});

// Restore soft-deleted
await user.restore();

// Permanently delete
await user.destroy({ force: true });
```

## Hooks

### Model Hooks

```typescript
User.init(/* ... */, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.passwordHash = await hashPassword(user.password);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.passwordHash = await hashPassword(user.password);
      }
    },
    afterCreate: async (user) => {
      await sendWelcomeEmail(user.email);
    },
  },
});

// Or define separately
User.beforeCreate(async (user) => {
  user.email = user.email.toLowerCase();
});

User.afterDestroy(async (user) => {
  await cleanupUserData(user.id);
});
```

### Available Hooks

```typescript
// Validation
beforeValidate, afterValidate

// Create
beforeCreate, afterCreate

// Update
beforeUpdate, afterUpdate

// Save (create or update)
beforeSave, afterSave

// Delete
beforeDestroy, afterDestroy

// Bulk operations
beforeBulkCreate, afterBulkCreate
beforeBulkUpdate, afterBulkUpdate
beforeBulkDestroy, afterBulkDestroy

// Find
beforeFind, afterFind
```

## Performance

### Indexes

```typescript
// In migration
await queryInterface.addIndex('users', ['email'], {
  unique: true,
  name: 'users_email_unique',
});

await queryInterface.addIndex('users', ['role', 'is_active'], {
  name: 'users_role_active',
});

// Partial index
await queryInterface.addIndex('users', ['email'], {
  where: { is_active: true },
  name: 'users_active_email',
});
```

### Query Optimization

```typescript
// Select only needed fields
const users = await User.findAll({
  attributes: ['id', 'name', 'email'],
});

// Avoid N+1 with eager loading
const projects = await Project.findAll({
  include: [{ model: User, as: 'owner' }],
});

// Use raw queries for complex operations
const results = await sequelize.query(
  `SELECT u.id, COUNT(p.id) as project_count
   FROM users u
   LEFT JOIN projects p ON p.owner_id = u.id
   GROUP BY u.id
   HAVING COUNT(p.id) > :minProjects`,
  {
    replacements: { minProjects: 5 },
    type: QueryTypes.SELECT,
  }
);

// Batch operations
await User.bulkCreate(users, {
  updateOnDuplicate: ['name', 'updatedAt'],
});
```

### Connection Pool

```typescript
// config/database.ts
import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  pool: {
    max: 20,      // Maximum connections
    min: 5,       // Minimum connections
    acquire: 30000, // Max time to get connection
    idle: 10000,  // Max idle time before release
  },
  logging: process.env.NODE_ENV === 'development'
    ? console.log
    : false,
});
```

## Summary

| Topic | Key Points |
|-------|------------|
| **Models** | Use TypeScript types, snake_case in DB, camelCase in code |
| **Migrations** | Always provide rollback, use transactions |
| **Queries** | Use operators, avoid N+1, select only needed fields |
| **Transactions** | Use for multi-step operations |
| **Soft Deletes** | Use paranoid mode for recoverable deletes |
| **Performance** | Index frequently queried columns, batch operations |

## Related Documents

- [Express Patterns](./express-patterns.md)
- [Controller Guidelines](./controller-guidelines.md)
- [Backend Testing](../07-testing/backend-testing.md)
