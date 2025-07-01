# Multi-Tenancy Configuration

This document explains how to configure multi-tenancy for the VerifyWise application.

## Overview

When multi-tenancy is enabled, the application changes its authentication flow to:

- Show the login page by default instead of admin registration
- Provide a "Register" link on the login page for new organizations
- Allow organizations to register with their own admin accounts

## Configuration

### Environment Variables

To enable multi-tenancy, create you `.env.local` file inside `/Clients` folder and set the following environment variable:

```bash
VITE_IS_MULTI_TENANT=true
```

### Single-Tenant Mode (Default)

When `VITE_IS_MULTI_TENANT` is not set or is `false`:

- Shows admin registration page when no users exist
- Redirects to login page when users exist
- Standard single-organization setup

### Multi-Tenant Mode

When `VITE_IS_MULTI_TENANT=true`:

- Always shows login page by default
- Provides "Register" link for new organization registration
- Allows multiple organizations to register independently
- Each organization gets its own admin account

## Routes

### Multi-Tenant Routes

- `/login` - Login page with "Register" link
- `/register` - Organization and admin registration flow
- `/admin-reg` - Legacy admin registration (redirects to login in multi-tenant mode)
- `/user-reg` - User registration (if needed)

### Single-Tenant Routes

- `/admin-reg` - Admin registration (when no users exist)
- `/login` - Login page (when users exist)

## User Experience

### Multi-Tenant Flow

1. User visits the application
2. Login page is displayed with "Don't have an organization? Register" link
3. User clicks "Register" to create new organization
4. Organization form is shown first (name, email)
5. Admin account form is shown second (name, surname, email, password)
6. After successful registration, user is redirected to login
7. User can now log in with their credentials

### Single-Tenant Flow

1. User visits the application
2. If no users exist: Admin registration page is shown
3. If users exist: Login page is shown
4. Standard authentication flow

## Styling

The multi-tenant registration page follows the same styling approach as the existing authentication pages:

- Consistent theme and colors
- Same form field styling
- Matching button styles
- Proper spacing and layout
- "Back to Login" links for navigation
