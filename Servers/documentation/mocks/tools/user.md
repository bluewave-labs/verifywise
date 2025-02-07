# User Mock Service Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Service Methods](#service-methods)
- [Additional Methods](#additional-methods)
- [Data Types](#data-types)

## Overview

This service provides mock implementations for user-related operations, including CRUD functionality for users and associated data relationships.

## Dependencies

```typescript
import { users } from "../users.data";
import { getAllSubcontrolsQuery } from "../../utils/subControl.utils";
// Additional imports for related services
```

## Service Methods

### Get All Users

```typescript
getAllMockUsers(): Array<any>
```

- **Description**: Retrieves all mock users
- **Returns**: Array of user objects

### Get User by Email

```typescript
getMockUserByEmail(email: string): object | undefined
```

- **Description**: Retrieves a user by email address
- **Parameters**: `email` (string)
- **Returns**: User object if found, undefined otherwise

### Get User by ID

```typescript
getMockUserById(id: number): object | undefined
```

- **Description**: Retrieves a user by ID
- **Parameters**: `id` (number)
- **Returns**: User object if found, undefined otherwise

### Create User

```typescript
createMockUser(user: any): object
```

- **Description**: Creates a new user
- **Parameters**: `user` (User object)
- **Returns**: Created user object
- **Throws**: Error if email or ID already exists

### Reset Password

```typescript
resetMockPassword(email: string, newPassword: string): object | undefined
```

- **Description**: Resets a user's password
- **Parameters**:
  - `email` (string)
  - `newPassword` (string)
- **Returns**: Updated user object if found, undefined otherwise

### Update User

```typescript
updateMockUserById(id: number, user: any): object | null
```

- **Description**: Updates an existing user
- **Parameters**:
  - `id` (number)
  - `user` (Partial User object)
- **Returns**: Updated user object if found, null otherwise

### Delete User

```typescript
deleteMockUserById(id: number): object | null
```

- **Description**: Deletes a user by ID
- **Parameters**: `id` (number)
- **Returns**: Deleted user object if found, null otherwise

### Check User Exists

```typescript
checkMockUserExists(): boolean
```

- **Description**: Checks if any users exist in the system
- **Returns**: Boolean indicating if users exist

## Additional Methods

### Get User Projects

```typescript
getMockUserProjects(userId: number): Array<any>
```

- **Description**: Retrieves all projects owned by a user
- **Parameters**: `userId` (number)
- **Returns**: Array of project objects

### Get Control Categories for Project

```typescript
getMockControlCategoriesForProject(projectId: number): Array<any>
```

- **Description**: Retrieves control categories for a project
- **Parameters**: `projectId` (number)
- **Returns**: Array of control category objects

### Get Controls for Control Category

```typescript
getMockControlForControlCategory(controlCategoryId: number): Array<any>
```

- **Description**: Retrieves controls for a control category
- **Parameters**: `controlCategoryId` (number)
- **Returns**: Array of control objects

### Get Subcontrols for Control

```typescript
getMockSubControlForControl(controlId: number): Promise<Array<any>>
```

- **Description**: Retrieves subcontrols for a control
- **Parameters**: `controlId` (number)
- **Returns**: Promise resolving to array of subcontrol objects

### Get Assessments for Project

```typescript
getMockAssessmentsForProject(projectId: number): Array<any>
```

- **Description**: Retrieves assessments for a project
- **Parameters**: `projectId` (number)
- **Returns**: Array of assessment objects

### Get Topics for Assessment

```typescript
getMockTopicsForAssessment(assessmentId: number): Array<any>
```

- **Description**: Retrieves topics for an assessment
- **Parameters**: `assessmentId` (number)
- **Returns**: Array of topic objects

### Get Subtopics for Topic

```typescript
getMockSubTopicsForTopic(topicId: number): Array<any>
```

- **Description**: Retrieves subtopics for a topic
- **Parameters**: `topicId` (number)
- **Returns**: Array of subtopic objects

### Get Questions for Subtopic

```typescript
getMockQuestionsForSubTopic(subtopicId: number): Array<any>
```

- **Description**: Retrieves questions for a subtopic
- **Parameters**: `subtopicId` (number)
- **Returns**: Array of question objects

## Data Types

```typescript
interface User {
  id: number;
  email: string;
  password_hash: string;
  // Additional user properties
}
```

Note: The actual User interface should be referenced from the mock data structure
