# User Database Queries Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Core Database Functions](#core-database-functions)
- [Relationship Query Functions](#relationship-query-functions)
- [Data Types](#data-types)
- [Error Handling](#error-handling)

## Overview

This module provides database query functions for managing users and their related entities in a PostgreSQL database.

## Dependencies

```typescript
import { User } from "../models/user.model";
import pool from "../database/db";
```

## Core Database Functions

### User Management

```typescript
export const getAllUsersQuery = async (): Promise<User[]>
export const getUserByEmailQuery = async (email: string): Promise<User>
export const getUserByIdQuery = async (id: string): Promise<User>
export const createNewUserQuery = async (user: Omit<User, "id">): Promise<User>
export const resetPasswordQuery = async (email: string, newPassword: string): Promise<User>
export const updateUserByIdQuery = async (id: string, user: Partial<User>): Promise<User>
export const deleteUserByIdQuery = async (id: string): Promise<User>
export const checkUserExistsQuery = async (): Promise<boolean>
```

## Relationship Query Functions

### Project Hierarchy

```typescript
export const getUserProjects = async (id: number): Promise<any[]>
export const getControlCategoriesForProject = async (id: number): Promise<any[]>
export const getControlForControlCategory = async (id: number): Promise<any[]>
export const getSubControlForControl = async (id: number): Promise<any[]>
```

### Assessment Hierarchy

```typescript
export const getAssessmentsForProject = async (id: number): Promise<any[]>
export const getTopicsForAssessment = async (id: number): Promise<any[]>
export const getSubTopicsForTopic = async (id: number): Promise<any[]>
export const getQuestionsForSubTopic = async (id: number): Promise<any[]>
```

## Data Types

```typescript
interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  password_hash: string;
  role: number;
  created_at: Date;
  last_login: Date;
}
```

## Error Handling

All database operations:

- Include error logging through console.error
- Use try-catch blocks for error handling
- Throw errors for database query failures
- Include proper error messages for debugging
- Handle potential null cases for single-record operations
- Return typed promises using the User interface
