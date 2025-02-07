# User Type Documentation

## Table of Contents

- [Overview](#overview)
- [Data Type Definition](#data-type-definition)
- [Properties](#properties)

## Overview

This file defines the User type which represents the structure for user data in the system.

## Data Type Definition

```typescript
type User = {
  id: number;
  name: string;
  surname: string;
  email: string;
  password_hash: string;
  role: number;
  created_at: Date;
  last_login: Date;
};
```

## Properties

| Property      | Type   | Description                             |
| ------------- | ------ | --------------------------------------- |
| id            | number | Unique identifier for the user          |
| name          | string | First name of the user                  |
| surname       | string | Last name of the user                   |
| email         | string | Email address of the user               |
| password_hash | string | Hashed password for user authentication |
| role          | number | Role identifier for the user            |
| created_at    | Date   | Timestamp of user creation              |
| last_login    | Date   | Timestamp of user's last login          |
