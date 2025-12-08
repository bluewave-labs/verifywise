// Auto-generated from swagger.yaml for version 1.7.0
// This file contains all API endpoint definitions

export interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header';
  type: string;
  required: boolean;
  description: string;
}

export interface Response {
  status: number;
  description: string;
}

export interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description?: string;
  requiresAuth: boolean;
  parameters?: Parameter[];
  requestBody?: Record<string, string>;
  responses: Response[];
  tag: string;
}

// Authentication endpoints
export const authenticationEndpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/users/register',
    summary: 'Register a new user',
    description: 'Creates a new user account in the system.',
    requiresAuth: false,
    requestBody: {
      name: 'string (required)',
      surname: 'string (required)',
      email: 'string (required)',
      password: 'string (required, min 8 chars)',
    },
    responses: [{ status: 201, description: 'User registered successfully' }],
    tag: 'Authentication',
  },
  {
    method: 'POST',
    path: '/users/login',
    summary: 'User login',
    description: 'Authenticates a user and returns a JWT token.',
    requiresAuth: false,
    requestBody: {
      email: 'string (required)',
      password: 'string (required)',
    },
    responses: [{ status: 200, description: 'Login successful, returns user data and token' }],
    tag: 'Authentication',
  },
  {
    method: 'POST',
    path: '/users/refresh-token',
    summary: 'Refresh authentication token',
    description: 'Generates a new access token using a refresh token.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Token refreshed successfully' }],
    tag: 'Authentication',
  },
  {
    method: 'GET',
    path: '/users/check/exists',
    summary: 'Check if user exists',
    description: 'Checks if any user exists in the system.',
    requiresAuth: false,
    responses: [{ status: 200, description: 'User existence status returned' }],
    tag: 'Authentication',
  },
];

// User endpoints
export const userEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/users/{userId}',
    summary: 'Get user by ID',
    description: 'Retrieves detailed information about a specific user.',
    requiresAuth: true,
    parameters: [
      { name: 'userId', in: 'path', type: 'integer', required: true, description: 'The unique identifier of the user' },
    ],
    responses: [
      { status: 200, description: 'User details returned successfully' },
      { status: 404, description: 'User not found' },
    ],
    tag: 'Users',
  },
  {
    method: 'PATCH',
    path: '/users/{userId}',
    summary: 'Update user by ID',
    description: 'Updates user information for the specified user.',
    requiresAuth: true,
    parameters: [
      { name: 'userId', in: 'path', type: 'integer', required: true, description: 'The unique identifier of the user' },
    ],
    requestBody: {
      name: 'string (optional)',
      surname: 'string (optional)',
      email: 'string (optional)',
      role_id: 'integer (optional)',
    },
    responses: [{ status: 200, description: 'User updated successfully' }],
    tag: 'Users',
  },
  {
    method: 'DELETE',
    path: '/users/{userId}',
    summary: 'Delete user by ID',
    description: 'Permanently deletes a user from the system.',
    requiresAuth: true,
    parameters: [
      { name: 'userId', in: 'path', type: 'integer', required: true, description: 'The unique identifier of the user' },
    ],
    responses: [{ status: 200, description: 'User deleted successfully' }],
    tag: 'Users',
  },
  {
    method: 'PATCH',
    path: '/users/chng-pass/{userId}',
    summary: 'Change user password',
    description: 'Changes the password for a specific user.',
    requiresAuth: true,
    parameters: [
      { name: 'userId', in: 'path', type: 'integer', required: true, description: 'The unique identifier of the user' },
    ],
    requestBody: {
      id: 'integer (required)',
      currentPassword: 'string (required)',
      newPassword: 'string (required)',
    },
    responses: [{ status: 200, description: 'Password changed successfully' }],
    tag: 'Users',
  },
];

// Organization endpoints
export const organizationEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/organizations/{id}',
    summary: 'Get organization by ID',
    description: 'Retrieves detailed information about a specific organization.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Organization ID' },
    ],
    responses: [{ status: 200, description: 'Organization details returned' }],
    tag: 'Organizations',
  },
  {
    method: 'POST',
    path: '/organizations/{id}',
    summary: 'Create organization',
    description: 'Creates a new organization.',
    requiresAuth: true,
    requestBody: {
      name: 'string (required)',
      description: 'string (optional)',
    },
    responses: [{ status: 201, description: 'Organization created successfully' }],
    tag: 'Organizations',
  },
  {
    method: 'PATCH',
    path: '/organizations/{id}',
    summary: 'Update organization',
    description: 'Updates an existing organization.',
    requiresAuth: true,
    requestBody: {
      name: 'string (optional)',
      description: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Organization updated successfully' }],
    tag: 'Organizations',
  },
];

// Project endpoints
export const projectEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/projects',
    summary: 'Get all projects',
    description: 'Retrieves a list of all projects for the authenticated user\'s organization.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'List of projects returned successfully' }],
    tag: 'Projects',
  },
  {
    method: 'POST',
    path: '/projects',
    summary: 'Create a new project',
    description: 'Creates a new compliance project.',
    requiresAuth: true,
    requestBody: {
      name: 'string (required)',
      description: 'string (optional)',
      status: 'string (optional)',
    },
    responses: [{ status: 201, description: 'Project created successfully' }],
    tag: 'Projects',
  },
  {
    method: 'GET',
    path: '/projects/{id}',
    summary: 'Get project by ID',
    description: 'Retrieves detailed information about a specific project.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Project ID' },
    ],
    responses: [
      { status: 200, description: 'Project details returned successfully' },
      { status: 404, description: 'Project not found' },
    ],
    tag: 'Projects',
  },
  {
    method: 'PATCH',
    path: '/projects/{id}',
    summary: 'Update project',
    description: 'Updates an existing project.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Project ID' },
    ],
    requestBody: {
      name: 'string (optional)',
      description: 'string (optional)',
      status: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Project updated successfully' }],
    tag: 'Projects',
  },
  {
    method: 'DELETE',
    path: '/projects/{id}',
    summary: 'Delete project',
    description: 'Permanently deletes a project and all associated data.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Project ID' },
    ],
    responses: [{ status: 200, description: 'Project deleted successfully' }],
    tag: 'Projects',
  },
];

// Project Risk endpoints
export const projectRiskEndpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/projectRisks',
    summary: 'Create project risk',
    description: 'Creates a new risk entry for a project.',
    requiresAuth: true,
    requestBody: {
      project_id: 'integer (required)',
      risk_name: 'string (required)',
      likelihood: 'very_low | low | medium | high | very_high',
      severity: 'very_low | low | medium | high | very_high',
    },
    responses: [{ status: 201, description: 'Project risk created successfully' }],
    tag: 'Project Risks',
  },
  {
    method: 'GET',
    path: '/projectRisks/{id}',
    summary: 'Get project risk by ID',
    description: 'Retrieves detailed information about a specific project risk.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Project risk ID' },
    ],
    responses: [{ status: 200, description: 'Project risk details returned' }],
    tag: 'Project Risks',
  },
  {
    method: 'PUT',
    path: '/projectRisks/{id}',
    summary: 'Update project risk',
    description: 'Updates an existing project risk.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Project risk ID' },
    ],
    requestBody: {
      risk_name: 'string (optional)',
      likelihood: 'very_low | low | medium | high | very_high',
      severity: 'very_low | low | medium | high | very_high',
      mitigation_status: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Project risk updated successfully' }],
    tag: 'Project Risks',
  },
  {
    method: 'DELETE',
    path: '/projectRisks/{id}',
    summary: 'Delete project risk',
    description: 'Permanently deletes a project risk.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Project risk ID' },
    ],
    responses: [{ status: 200, description: 'Project risk deleted successfully' }],
    tag: 'Project Risks',
  },
  {
    method: 'GET',
    path: '/projectRisks/by-projid/{projectId}',
    summary: 'Get project risks by project ID',
    description: 'Retrieves all risks associated with a specific project.',
    requiresAuth: true,
    parameters: [
      { name: 'projectId', in: 'path', type: 'integer', required: true, description: 'Project ID' },
    ],
    responses: [{ status: 200, description: 'Project risks returned successfully' }],
    tag: 'Project Risks',
  },
  {
    method: 'GET',
    path: '/projectRisks/by-projid/non-mitigated/{projectId}',
    summary: 'Get non-mitigated project risks',
    description: 'Retrieves all non-mitigated risks for a specific project.',
    requiresAuth: true,
    parameters: [
      { name: 'projectId', in: 'path', type: 'integer', required: true, description: 'Project ID' },
    ],
    responses: [{ status: 200, description: 'Non-mitigated project risks returned' }],
    tag: 'Project Risks',
  },
];

// Vendor endpoints
export const vendorEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/vendors',
    summary: 'Get all vendors',
    description: 'Retrieves a list of all vendors in the organization.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'List of vendors returned successfully' }],
    tag: 'Vendors',
  },
  {
    method: 'POST',
    path: '/vendors',
    summary: 'Create a new vendor',
    description: 'Creates a new vendor entry.',
    requiresAuth: true,
    requestBody: {
      name: 'string (required)',
      email: 'string (required)',
      website: 'string (optional)',
    },
    responses: [{ status: 201, description: 'Vendor created successfully' }],
    tag: 'Vendors',
  },
  {
    method: 'GET',
    path: '/vendors/{id}',
    summary: 'Get vendor by ID',
    description: 'Retrieves detailed information about a specific vendor.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Vendor ID' },
    ],
    responses: [{ status: 200, description: 'Vendor details returned successfully' }],
    tag: 'Vendors',
  },
  {
    method: 'PATCH',
    path: '/vendors/{id}',
    summary: 'Update vendor',
    description: 'Updates an existing vendor.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Vendor ID' },
    ],
    requestBody: {
      name: 'string (optional)',
      email: 'string (optional)',
      website: 'string (optional)',
      status: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Vendor updated successfully' }],
    tag: 'Vendors',
  },
  {
    method: 'DELETE',
    path: '/vendors/{id}',
    summary: 'Delete vendor',
    description: 'Permanently deletes a vendor.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Vendor ID' },
    ],
    responses: [{ status: 200, description: 'Vendor deleted successfully' }],
    tag: 'Vendors',
  },
  {
    method: 'GET',
    path: '/vendors/project-id/{projectId}',
    summary: 'Get vendors by project ID',
    description: 'Retrieves all vendors associated with a specific project.',
    requiresAuth: true,
    parameters: [
      { name: 'projectId', in: 'path', type: 'integer', required: true, description: 'Project ID' },
    ],
    responses: [{ status: 200, description: 'Vendors for the project returned successfully' }],
    tag: 'Vendors',
  },
];

// Vendor Risk endpoints
export const vendorRiskEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/vendorRisks/all',
    summary: 'Get all vendor risks',
    description: 'Retrieves all vendor risks across the organization.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'List of all vendor risks' }],
    tag: 'Vendor Risks',
  },
  {
    method: 'POST',
    path: '/vendorRisks',
    summary: 'Create vendor risk',
    description: 'Creates a new vendor risk entry.',
    requiresAuth: true,
    requestBody: {
      vendor_id: 'integer (required)',
      project_id: 'integer (required)',
      risk_description: 'string (required)',
      likelihood: 'very_low | low | medium | high | very_high',
      severity: 'very_low | low | medium | high | very_high',
    },
    responses: [{ status: 201, description: 'Vendor risk created successfully' }],
    tag: 'Vendor Risks',
  },
  {
    method: 'GET',
    path: '/vendorRisks/{id}',
    summary: 'Get vendor risk by ID',
    description: 'Retrieves detailed information about a specific vendor risk.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Vendor risk ID' },
    ],
    responses: [{ status: 200, description: 'Vendor risk details returned' }],
    tag: 'Vendor Risks',
  },
  {
    method: 'PATCH',
    path: '/vendorRisks/{id}',
    summary: 'Update vendor risk',
    description: 'Updates an existing vendor risk.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Vendor risk ID' },
    ],
    requestBody: {
      risk_description: 'string (optional)',
      likelihood: 'very_low | low | medium | high | very_high',
      severity: 'very_low | low | medium | high | very_high',
    },
    responses: [{ status: 200, description: 'Vendor risk updated successfully' }],
    tag: 'Vendor Risks',
  },
  {
    method: 'DELETE',
    path: '/vendorRisks/{id}',
    summary: 'Delete vendor risk',
    description: 'Permanently deletes a vendor risk.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Vendor risk ID' },
    ],
    responses: [{ status: 200, description: 'Vendor risk deleted successfully' }],
    tag: 'Vendor Risks',
  },
  {
    method: 'GET',
    path: '/vendorRisks/by-projid/{projectId}',
    summary: 'Get vendor risks by project ID',
    description: 'Retrieves all vendor risks for a specific project.',
    requiresAuth: true,
    parameters: [
      { name: 'projectId', in: 'path', type: 'integer', required: true, description: 'Project ID' },
    ],
    responses: [{ status: 200, description: 'Vendor risks for the project returned' }],
    tag: 'Vendor Risks',
  },
];

// Assessment endpoints
export const assessmentEndpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/assessments',
    summary: 'Create assessment',
    description: 'Creates a new assessment for a project.',
    requiresAuth: true,
    requestBody: {
      project_id: 'integer (required)',
      assessment_type: 'string (required)',
    },
    responses: [{ status: 201, description: 'Assessment created successfully' }],
    tag: 'Assessments',
  },
  {
    method: 'PATCH',
    path: '/assessments/{id}',
    summary: 'Update assessment',
    description: 'Updates an existing assessment.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Assessment ID' },
    ],
    requestBody: {
      status: 'string (optional)',
      assessment_type: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Assessment updated successfully' }],
    tag: 'Assessments',
  },
  {
    method: 'DELETE',
    path: '/assessments/{id}',
    summary: 'Delete assessment',
    description: 'Permanently deletes an assessment.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Assessment ID' },
    ],
    responses: [{ status: 200, description: 'Assessment deleted successfully' }],
    tag: 'Assessments',
  },
  {
    method: 'GET',
    path: '/assessments/project/byid/{id}',
    summary: 'Get assessment by ID',
    description: 'Retrieves detailed information about a specific assessment.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Assessment ID' },
    ],
    responses: [{ status: 200, description: 'Assessment details returned' }],
    tag: 'Assessments',
  },
  {
    method: 'GET',
    path: '/assessments/getAnswers/{assessmentId}',
    summary: 'Get assessment answers',
    description: 'Retrieves all answers for a specific assessment.',
    requiresAuth: true,
    parameters: [
      { name: 'assessmentId', in: 'path', type: 'integer', required: true, description: 'Assessment ID' },
    ],
    responses: [{ status: 200, description: 'Assessment answers returned' }],
    tag: 'Assessments',
  },
];

// Policy endpoints
export const policyEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/policies',
    summary: 'Get all policies',
    description: 'Retrieves a list of all policies in the organization.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'List of policies returned' }],
    tag: 'Policies',
  },
  {
    method: 'POST',
    path: '/policies',
    summary: 'Create policy',
    description: 'Creates a new policy.',
    requiresAuth: true,
    requestBody: {
      title: 'string (required)',
      content: 'string (required)',
      status: 'string (optional)',
      tags: 'string[] (optional)',
    },
    responses: [{ status: 201, description: 'Policy created successfully' }],
    tag: 'Policies',
  },
  {
    method: 'PUT',
    path: '/policies/{id}',
    summary: 'Update policy',
    description: 'Updates an existing policy.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Policy ID' },
    ],
    requestBody: {
      title: 'string (optional)',
      content: 'string (optional)',
      status: 'string (optional)',
      tags: 'string[] (optional)',
    },
    responses: [{ status: 200, description: 'Policy updated successfully' }],
    tag: 'Policies',
  },
  {
    method: 'DELETE',
    path: '/policies/{id}',
    summary: 'Delete policy',
    description: 'Permanently deletes a policy.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Policy ID' },
    ],
    responses: [{ status: 200, description: 'Policy deleted successfully' }],
    tag: 'Policies',
  },
  {
    method: 'GET',
    path: '/policies/tags',
    summary: 'Get all policy tags',
    description: 'Retrieves all unique tags used across policies.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'List of policy tags returned' }],
    tag: 'Policies',
  },
];

// Model Inventory endpoints
export const modelInventoryEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/model-inventory',
    summary: 'Get all model inventory entries',
    description: 'Retrieves all AI models in the inventory.',
    requiresAuth: true,
    responses: [
      { status: 200, description: 'List of model inventory entries' },
      { status: 204, description: 'No entries found' },
    ],
    tag: 'Model Inventory',
  },
  {
    method: 'POST',
    path: '/model-inventory',
    summary: 'Create model inventory entry',
    description: 'Adds a new AI model to the inventory.',
    requiresAuth: true,
    requestBody: {
      provider: 'string (required)',
      model: 'string (required)',
      version: 'string (optional)',
      approver: 'string (optional)',
      capabilities: 'string[] (optional)',
      security_assessment: 'boolean (optional)',
      status: 'Approved | Restricted | Pending | Blocked',
    },
    responses: [{ status: 201, description: 'Model inventory entry created' }],
    tag: 'Model Inventory',
  },
  {
    method: 'GET',
    path: '/model-inventory/{id}',
    summary: 'Get model inventory entry by ID',
    description: 'Retrieves detailed information about a specific AI model.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Model inventory ID' },
    ],
    responses: [
      { status: 200, description: 'Model inventory entry found' },
      { status: 204, description: 'Entry not found' },
    ],
    tag: 'Model Inventory',
  },
  {
    method: 'PATCH',
    path: '/model-inventory/{id}',
    summary: 'Update model inventory entry',
    description: 'Updates an existing AI model in the inventory.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Model inventory ID' },
    ],
    requestBody: {
      provider: 'string (optional)',
      model: 'string (optional)',
      version: 'string (optional)',
      status: 'Approved | Restricted | Pending | Blocked',
    },
    responses: [
      { status: 200, description: 'Model inventory entry updated' },
      { status: 404, description: 'Entry not found' },
    ],
    tag: 'Model Inventory',
  },
  {
    method: 'DELETE',
    path: '/model-inventory/{id}',
    summary: 'Delete model inventory entry',
    description: 'Removes an AI model from the inventory.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Model inventory ID' },
    ],
    responses: [
      { status: 200, description: 'Model inventory entry deleted' },
      { status: 404, description: 'Entry not found' },
    ],
    tag: 'Model Inventory',
  },
];

// Model Risk endpoints
export const modelRiskEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/modelRisks',
    summary: 'Get all model risks',
    description: 'Retrieves all AI model risks.',
    requiresAuth: true,
    responses: [
      { status: 200, description: 'List of model risks' },
      { status: 204, description: 'No model risks found' },
    ],
    tag: 'Model Risks',
  },
  {
    method: 'POST',
    path: '/modelRisks',
    summary: 'Create model risk',
    description: 'Creates a new AI model risk entry.',
    requiresAuth: true,
    requestBody: {
      riskName: 'string (required)',
      riskCategory: 'Performance | Bias & Fairness | Security | Data Quality | Compliance',
      riskLevel: 'Low | Medium | High | Critical',
      status: 'Open | In Progress | Resolved | Accepted',
      owner: 'string (required)',
      targetDate: 'date (required)',
      description: 'string (optional)',
      mitigationPlan: 'string (optional)',
      modelId: 'integer (optional)',
    },
    responses: [
      { status: 201, description: 'Model risk created successfully' },
      { status: 400, description: 'Validation error' },
    ],
    tag: 'Model Risks',
  },
  {
    method: 'GET',
    path: '/modelRisks/{id}',
    summary: 'Get model risk by ID',
    description: 'Retrieves detailed information about a specific model risk.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Model risk ID' },
    ],
    responses: [
      { status: 200, description: 'Model risk found' },
      { status: 404, description: 'Model risk not found' },
    ],
    tag: 'Model Risks',
  },
  {
    method: 'PUT',
    path: '/modelRisks/{id}',
    summary: 'Update model risk',
    description: 'Fully updates an existing model risk.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Model risk ID' },
    ],
    requestBody: {
      riskName: 'string (required)',
      riskCategory: 'Performance | Bias & Fairness | Security | Data Quality | Compliance',
      riskLevel: 'Low | Medium | High | Critical',
      status: 'Open | In Progress | Resolved | Accepted',
    },
    responses: [
      { status: 200, description: 'Model risk updated' },
      { status: 404, description: 'Model risk not found' },
    ],
    tag: 'Model Risks',
  },
  {
    method: 'DELETE',
    path: '/modelRisks/{id}',
    summary: 'Delete model risk',
    description: 'Permanently deletes a model risk.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Model risk ID' },
    ],
    responses: [
      { status: 200, description: 'Model risk deleted' },
      { status: 404, description: 'Model risk not found' },
    ],
    tag: 'Model Risks',
  },
];

// EU AI Act endpoints
export const euAiActEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/eu-ai-act/topics',
    summary: 'Get all assessment topics',
    description: 'Retrieves all EU AI Act assessment topics.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'List of assessment topics' }],
    tag: 'EU AI Act',
  },
  {
    method: 'GET',
    path: '/eu-ai-act/topicById',
    summary: 'Get assessment topic by ID',
    description: 'Retrieves a specific assessment topic with project context.',
    requiresAuth: true,
    parameters: [
      { name: 'topicId', in: 'query', type: 'integer', required: true, description: 'Topic ID' },
      { name: 'projectFrameworkId', in: 'query', type: 'integer', required: true, description: 'Project framework ID' },
    ],
    responses: [{ status: 200, description: 'Assessment topic details' }],
    tag: 'EU AI Act',
  },
  {
    method: 'GET',
    path: '/eu-ai-act/assessments/progress/{projectFrameworkId}',
    summary: 'Get assessment progress',
    description: 'Retrieves assessment completion progress for a project.',
    requiresAuth: true,
    parameters: [
      { name: 'projectFrameworkId', in: 'path', type: 'integer', required: true, description: 'Project framework ID' },
    ],
    responses: [{ status: 200, description: 'Assessment progress details' }],
    tag: 'EU AI Act',
  },
  {
    method: 'GET',
    path: '/eu-ai-act/controlCategories',
    summary: 'Get control categories',
    description: 'Retrieves EU AI Act control categories for a project.',
    requiresAuth: true,
    parameters: [
      { name: 'projectFrameworkId', in: 'query', type: 'integer', required: true, description: 'Project framework ID' },
    ],
    responses: [{ status: 200, description: 'Control categories' }],
    tag: 'EU AI Act',
  },
  {
    method: 'GET',
    path: '/eu-ai-act/compliances/progress/{projectFrameworkId}',
    summary: 'Get compliance progress',
    description: 'Retrieves compliance completion progress for a project.',
    requiresAuth: true,
    parameters: [
      { name: 'projectFrameworkId', in: 'path', type: 'integer', required: true, description: 'Project framework ID' },
    ],
    responses: [{ status: 200, description: 'Compliance progress details' }],
    tag: 'EU AI Act',
  },
  {
    method: 'PATCH',
    path: '/eu-ai-act/saveAnswer/{answerId}',
    summary: 'Update EU AI Act answer',
    description: 'Updates an assessment answer.',
    requiresAuth: true,
    parameters: [
      { name: 'answerId', in: 'path', type: 'integer', required: true, description: 'Answer ID' },
    ],
    requestBody: {
      answer_text: 'string (optional)',
      evidence: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Answer updated successfully' }],
    tag: 'EU AI Act',
  },
  {
    method: 'PATCH',
    path: '/eu-ai-act/saveControls/{controlId}',
    summary: 'Update control',
    description: 'Updates a control implementation.',
    requiresAuth: true,
    parameters: [
      { name: 'controlId', in: 'path', type: 'integer', required: true, description: 'Control ID' },
    ],
    requestBody: {
      implementation_status: 'string (optional)',
      evidence: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Control updated successfully' }],
    tag: 'EU AI Act',
  },
];

// ISO 27001 endpoints
export const iso27001Endpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/iso-27001/clauses/struct/byProjectId/{projectId}',
    summary: 'Get ISO 27001 clause structure',
    description: 'Retrieves the clause structure for ISO 27001 implementation.',
    requiresAuth: true,
    parameters: [
      { name: 'projectId', in: 'path', type: 'integer', required: true, description: 'Project ID' },
    ],
    responses: [{ status: 200, description: 'ISO 27001 clause structure' }],
    tag: 'ISO 27001',
  },
  {
    method: 'GET',
    path: '/iso-27001/subClauses/byClauseId/{clauseId}',
    summary: 'Get sub-clauses by clause ID',
    description: 'Retrieves sub-clauses for a specific clause.',
    requiresAuth: true,
    parameters: [
      { name: 'clauseId', in: 'path', type: 'integer', required: true, description: 'Clause ID' },
    ],
    responses: [{ status: 200, description: 'Sub-clauses for the clause' }],
    tag: 'ISO 27001',
  },
  {
    method: 'GET',
    path: '/iso-27001/subClause/byId/{id}',
    summary: 'Get sub-clause by ID',
    description: 'Retrieves detailed sub-clause information.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Sub-clause ID' },
      { name: 'projectFrameworkId', in: 'query', type: 'integer', required: true, description: 'Project framework ID' },
    ],
    responses: [{ status: 200, description: 'Sub-clause details' }],
    tag: 'ISO 27001',
  },
  {
    method: 'POST',
    path: '/iso-27001/saveClauses/{id}',
    summary: 'Save ISO 27001 clauses',
    description: 'Saves or updates ISO 27001 clause implementation.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Clause ID' },
    ],
    requestBody: {
      clause_text: 'string (optional)',
      implementation_guidance: 'string (optional)',
      evidence: 'string (optional)',
      status: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Clauses saved successfully' }],
    tag: 'ISO 27001',
  },
  {
    method: 'POST',
    path: '/iso-27001/saveAnnexes/{id}',
    summary: 'Save ISO 27001 annexes',
    description: 'Saves or updates ISO 27001 annex implementation.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Annex ID' },
    ],
    requestBody: {
      control_objective: 'string (optional)',
      implementation_guidance: 'string (optional)',
      evidence: 'string (optional)',
      status: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Annexes saved successfully' }],
    tag: 'ISO 27001',
  },
];

// ISO 42001 endpoints
export const iso42001Endpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/iso-42001/subClause/byId/{id}',
    summary: 'Get ISO 42001 sub-clause by ID',
    description: 'Retrieves detailed ISO 42001 sub-clause information.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Sub-clause ID' },
      { name: 'projectFrameworkId', in: 'query', type: 'integer', required: true, description: 'Project framework ID' },
    ],
    responses: [{ status: 200, description: 'ISO 42001 sub-clause details' }],
    tag: 'ISO 42001',
  },
  {
    method: 'GET',
    path: '/iso-42001/annexCategory/byId/{id}',
    summary: 'Get ISO 42001 annex category',
    description: 'Retrieves annex category details.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Annex category ID' },
      { name: 'projectFrameworkId', in: 'query', type: 'integer', required: true, description: 'Project framework ID' },
    ],
    responses: [{ status: 200, description: 'Annex category details' }],
    tag: 'ISO 42001',
  },
  {
    method: 'POST',
    path: '/iso-42001/saveClauses/{id}',
    summary: 'Save ISO 42001 clauses',
    description: 'Saves or updates ISO 42001 clause implementation.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Clause ID' },
    ],
    requestBody: {
      clause_text: 'string (optional)',
      implementation_guidance: 'string (optional)',
      evidence: 'string (optional)',
      status: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Clauses saved successfully' }],
    tag: 'ISO 42001',
  },
  {
    method: 'POST',
    path: '/iso-42001/saveAnnexes/{id}',
    summary: 'Save ISO 42001 annexes',
    description: 'Saves or updates ISO 42001 annex implementation.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Annex ID' },
    ],
    requestBody: {
      annex_text: 'string (optional)',
      implementation_guidance: 'string (optional)',
      evidence: 'string (optional)',
      status: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Annexes saved successfully' }],
    tag: 'ISO 42001',
  },
];

// Bias and Fairness endpoints
export const biasAndFairnessEndpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/bias_and_fairness/upload',
    summary: 'Upload model for fairness analysis',
    description: 'Uploads a model and dataset for bias and fairness analysis.',
    requiresAuth: true,
    requestBody: {
      model: 'file (required, gzip)',
      data: 'file (required, gzip)',
      target_column: 'string (required)',
      sensitive_column: 'string (required)',
    },
    responses: [{ status: 200, description: 'Upload initiated, returns job_id' }],
    tag: 'Bias and Fairness',
  },
  {
    method: 'GET',
    path: '/bias_and_fairness/upload/status/{jobId}',
    summary: 'Get fairness upload status',
    description: 'Retrieves the status of a fairness analysis job.',
    requiresAuth: true,
    parameters: [
      { name: 'jobId', in: 'path', type: 'string', required: true, description: 'Job ID' },
    ],
    responses: [{ status: 200, description: 'Upload status: In Progress | Completed | Failed' }],
    tag: 'Bias and Fairness',
  },
  {
    method: 'GET',
    path: '/bias_and_fairness/metrics/all',
    summary: 'Get all fairness metrics',
    description: 'Retrieves all fairness metrics metadata.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'List of fairness metrics' }],
    tag: 'Bias and Fairness',
  },
  {
    method: 'GET',
    path: '/bias_and_fairness/metrics/{id}',
    summary: 'Get fairness metrics by ID',
    description: 'Retrieves detailed fairness metrics for a specific analysis.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Metrics ID' },
    ],
    responses: [{ status: 200, description: 'Fairness metrics details' }],
    tag: 'Bias and Fairness',
  },
  {
    method: 'DELETE',
    path: '/bias_and_fairness/metrics/{id}',
    summary: 'Delete fairness check',
    description: 'Deletes a fairness analysis result.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Metrics ID' },
    ],
    responses: [{ status: 200, description: 'Fairness check deleted' }],
    tag: 'Bias and Fairness',
  },
];

// Training endpoints
export const trainingEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/training',
    summary: 'Get all training records',
    description: 'Retrieves all AI-related training records.',
    requiresAuth: true,
    responses: [
      { status: 200, description: 'List of training records' },
      { status: 204, description: 'No training records found' },
    ],
    tag: 'Training',
  },
  {
    method: 'POST',
    path: '/training',
    summary: 'Create training record',
    description: 'Creates a new training registry entry.',
    requiresAuth: true,
    requestBody: {
      training_name: 'string (required)',
      duration: 'string (required)',
      provider: 'string (required)',
      department: 'string (required)',
      status: 'Planned | In Progress | Completed',
      numberOfPeople: 'integer (required)',
      description: 'string (optional)',
    },
    responses: [
      { status: 201, description: 'Training record created' },
      { status: 400, description: 'Missing required fields' },
    ],
    tag: 'Training',
  },
  {
    method: 'GET',
    path: '/training/training-id/{id}',
    summary: 'Get training record by ID',
    description: 'Retrieves detailed information about a specific training record.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Training record ID' },
    ],
    responses: [
      { status: 200, description: 'Training record details' },
      { status: 404, description: 'Training record not found' },
    ],
    tag: 'Training',
  },
  {
    method: 'PATCH',
    path: '/training/{id}',
    summary: 'Update training record',
    description: 'Updates an existing training record.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Training record ID' },
    ],
    requestBody: {
      training_name: 'string (optional)',
      duration: 'string (optional)',
      status: 'Planned | In Progress | Completed',
    },
    responses: [
      { status: 202, description: 'Training record updated' },
      { status: 404, description: 'Training record not found' },
    ],
    tag: 'Training',
  },
  {
    method: 'DELETE',
    path: '/training/{id}',
    summary: 'Delete training record',
    description: 'Permanently deletes a training record.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Training record ID' },
    ],
    responses: [
      { status: 202, description: 'Training record deleted' },
      { status: 404, description: 'Training record not found' },
    ],
    tag: 'Training',
  },
];

// Roles endpoints
export const roleEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/roles',
    summary: 'Get all roles',
    description: 'Retrieves all user roles in the system.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'List of roles' }],
    tag: 'Roles',
  },
  {
    method: 'POST',
    path: '/roles',
    summary: 'Create role',
    description: 'Creates a new user role.',
    requiresAuth: true,
    requestBody: {
      name: 'string (required)',
      description: 'string (optional)',
    },
    responses: [{ status: 201, description: 'Role created successfully' }],
    tag: 'Roles',
  },
  {
    method: 'GET',
    path: '/roles/{id}',
    summary: 'Get role by ID',
    description: 'Retrieves detailed information about a specific role.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Role ID' },
    ],
    responses: [{ status: 200, description: 'Role details' }],
    tag: 'Roles',
  },
  {
    method: 'PUT',
    path: '/roles/{id}',
    summary: 'Update role',
    description: 'Updates an existing role.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Role ID' },
    ],
    requestBody: {
      name: 'string (optional)',
      description: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Role updated successfully' }],
    tag: 'Roles',
  },
  {
    method: 'DELETE',
    path: '/roles/{id}',
    summary: 'Delete role',
    description: 'Permanently deletes a role.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Role ID' },
    ],
    responses: [{ status: 200, description: 'Role deleted successfully' }],
    tag: 'Roles',
  },
];

// Controls endpoints
export const controlEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/controls/{id}',
    summary: 'Get control by ID',
    description: 'Retrieves detailed information about a specific control.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Control ID' },
    ],
    responses: [{ status: 200, description: 'Control details' }],
    tag: 'Controls',
  },
  {
    method: 'POST',
    path: '/controls',
    summary: 'Create control',
    description: 'Creates a new control.',
    requiresAuth: true,
    requestBody: {
      name: 'string (required)',
      description: 'string (optional)',
      control_category_id: 'integer (required)',
    },
    responses: [{ status: 201, description: 'Control created successfully' }],
    tag: 'Controls',
  },
  {
    method: 'DELETE',
    path: '/controls/{id}',
    summary: 'Delete control',
    description: 'Permanently deletes a control.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Control ID' },
    ],
    responses: [{ status: 200, description: 'Control deleted successfully' }],
    tag: 'Controls',
  },
];

// Control Category endpoints
export const controlCategoryEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/controlCategory',
    summary: 'Get all control categories',
    description: 'Retrieves all control categories.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'List of control categories' }],
    tag: 'Control Categories',
  },
  {
    method: 'POST',
    path: '/controlCategory',
    summary: 'Create control category',
    description: 'Creates a new control category.',
    requiresAuth: true,
    requestBody: {
      name: 'string (required)',
      description: 'string (optional)',
      framework_id: 'integer (optional)',
    },
    responses: [{ status: 201, description: 'Control category created' }],
    tag: 'Control Categories',
  },
  {
    method: 'GET',
    path: '/controlCategory/{id}',
    summary: 'Get control category by ID',
    description: 'Retrieves a specific control category.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Control category ID' },
    ],
    responses: [{ status: 200, description: 'Control category details' }],
    tag: 'Control Categories',
  },
  {
    method: 'PATCH',
    path: '/controlCategory/{id}',
    summary: 'Update control category',
    description: 'Updates an existing control category.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Control category ID' },
    ],
    requestBody: {
      name: 'string (optional)',
      description: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Control category updated' }],
    tag: 'Control Categories',
  },
  {
    method: 'DELETE',
    path: '/controlCategory/{id}',
    summary: 'Delete control category',
    description: 'Permanently deletes a control category.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Control category ID' },
    ],
    responses: [{ status: 200, description: 'Control category deleted' }],
    tag: 'Control Categories',
  },
  {
    method: 'GET',
    path: '/controlCategory/byprojectid/{projectId}',
    summary: 'Get control categories by project',
    description: 'Retrieves control categories for a specific project.',
    requiresAuth: true,
    parameters: [
      { name: 'projectId', in: 'path', type: 'integer', required: true, description: 'Project ID' },
    ],
    responses: [{ status: 200, description: 'Control categories for the project' }],
    tag: 'Control Categories',
  },
];

// Framework endpoints
export const frameworkEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/frameworks',
    summary: 'Get all frameworks',
    description: 'Retrieves all available compliance frameworks.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'List of frameworks' }],
    tag: 'Frameworks',
  },
  {
    method: 'POST',
    path: '/frameworks/toProject',
    summary: 'Assign framework to project',
    description: 'Assigns a compliance framework to a project.',
    requiresAuth: true,
    parameters: [
      { name: 'frameworkId', in: 'query', type: 'integer', required: true, description: 'Framework ID' },
      { name: 'projectId', in: 'query', type: 'integer', required: true, description: 'Project ID' },
    ],
    responses: [{ status: 201, description: 'Framework assigned to project' }],
    tag: 'Frameworks',
  },
];

// AI Trust Centre endpoints
export const aiTrustCentreEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/aiTrustCentre/overview',
    summary: 'Get AI Trust Centre overview',
    description: 'Retrieves the AI Trust Centre overview configuration.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'AI Trust Centre overview' }],
    tag: 'AI Trust Centre',
  },
  {
    method: 'PUT',
    path: '/aiTrustCentre/overview',
    summary: 'Update AI Trust Centre overview',
    description: 'Updates the AI Trust Centre overview configuration.',
    requiresAuth: true,
    requestBody: {
      company_name: 'string (optional)',
      description: 'string (optional)',
      introduction: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Overview updated successfully' }],
    tag: 'AI Trust Centre',
  },
  {
    method: 'POST',
    path: '/aiTrustCentre/logo',
    summary: 'Upload AI Trust Centre logo',
    description: 'Uploads a logo for the AI Trust Centre.',
    requiresAuth: true,
    requestBody: {
      logo: 'file (required)',
    },
    responses: [{ status: 200, description: 'Logo uploaded successfully' }],
    tag: 'AI Trust Centre',
  },
  {
    method: 'DELETE',
    path: '/aiTrustCentre/logo',
    summary: 'Delete AI Trust Centre logo',
    description: 'Removes the AI Trust Centre logo.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Logo deleted successfully' }],
    tag: 'AI Trust Centre',
  },
  {
    method: 'GET',
    path: '/aiTrustCentre/resources',
    summary: 'Get AI Trust Centre resources',
    description: 'Retrieves all AI Trust Centre resources.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'List of resources' }],
    tag: 'AI Trust Centre',
  },
  {
    method: 'POST',
    path: '/aiTrustCentre/resources',
    summary: 'Create AI Trust Centre resource',
    description: 'Creates a new AI Trust Centre resource.',
    requiresAuth: true,
    requestBody: {
      file: 'file (optional)',
      title: 'string (required)',
      description: 'string (optional)',
    },
    responses: [{ status: 201, description: 'Resource created successfully' }],
    tag: 'AI Trust Centre',
  },
  {
    method: 'PUT',
    path: '/aiTrustCentre/resources/{resourceId}',
    summary: 'Update AI Trust Centre resource',
    description: 'Updates an existing AI Trust Centre resource.',
    requiresAuth: true,
    parameters: [
      { name: 'resourceId', in: 'path', type: 'integer', required: true, description: 'Resource ID' },
    ],
    requestBody: {
      file: 'file (optional)',
      title: 'string (optional)',
      description: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Resource updated successfully' }],
    tag: 'AI Trust Centre',
  },
  {
    method: 'DELETE',
    path: '/aiTrustCentre/resources/{resourceId}',
    summary: 'Delete AI Trust Centre resource',
    description: 'Deletes an AI Trust Centre resource.',
    requiresAuth: true,
    parameters: [
      { name: 'resourceId', in: 'path', type: 'integer', required: true, description: 'Resource ID' },
    ],
    responses: [{ status: 200, description: 'Resource deleted successfully' }],
    tag: 'AI Trust Centre',
  },
  {
    method: 'GET',
    path: '/aiTrustCentre/subprocessors',
    summary: 'Get AI Trust Centre subprocessors',
    description: 'Retrieves all subprocessors.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'List of subprocessors' }],
    tag: 'AI Trust Centre',
  },
  {
    method: 'POST',
    path: '/aiTrustCentre/subprocessors',
    summary: 'Create subprocessor',
    description: 'Creates a new subprocessor entry.',
    requiresAuth: true,
    requestBody: {
      name: 'string (required)',
      purpose: 'string (optional)',
      location: 'string (optional)',
      processing_activities: 'string (optional)',
    },
    responses: [{ status: 201, description: 'Subprocessor created successfully' }],
    tag: 'AI Trust Centre',
  },
  {
    method: 'PUT',
    path: '/aiTrustCentre/subprocessors/{subprocessorId}',
    summary: 'Update subprocessor',
    description: 'Updates an existing subprocessor.',
    requiresAuth: true,
    parameters: [
      { name: 'subprocessorId', in: 'path', type: 'integer', required: true, description: 'Subprocessor ID' },
    ],
    requestBody: {
      name: 'string (optional)',
      purpose: 'string (optional)',
      location: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Subprocessor updated successfully' }],
    tag: 'AI Trust Centre',
  },
  {
    method: 'DELETE',
    path: '/aiTrustCentre/subprocessors/{subprocessorId}',
    summary: 'Delete subprocessor',
    description: 'Deletes a subprocessor entry.',
    requiresAuth: true,
    parameters: [
      { name: 'subprocessorId', in: 'path', type: 'integer', required: true, description: 'Subprocessor ID' },
    ],
    responses: [{ status: 200, description: 'Subprocessor deleted successfully' }],
    tag: 'AI Trust Centre',
  },
];

// Files endpoints
export const fileEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/files',
    summary: 'Get user files metadata',
    description: 'Retrieves metadata for all files uploaded by the user.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'List of files' }],
    tag: 'Files',
  },
  {
    method: 'GET',
    path: '/files/{id}',
    summary: 'Get file by ID',
    description: 'Retrieves a specific file by its ID.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'File ID' },
    ],
    responses: [{ status: 200, description: 'File details' }],
    tag: 'Files',
  },
];

// Email Services endpoints
export const emailEndpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/mail/invite',
    summary: 'Send user invitation email',
    description: 'Sends an invitation email to a new user.',
    requiresAuth: true,
    requestBody: {
      email: 'string (required)',
      invitationMessage: 'string (optional)',
    },
    responses: [{ status: 200, description: 'Invitation email sent successfully' }],
    tag: 'Email Services',
  },
  {
    method: 'POST',
    path: '/mail/reset-password',
    summary: 'Send password reset email',
    description: 'Sends a password reset email to a user.',
    requiresAuth: false,
    requestBody: {
      email: 'string (required)',
    },
    responses: [{ status: 200, description: 'Password reset email sent' }],
    tag: 'Email Services',
  },
];

// Dashboard endpoints
export const dashboardEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/dashboard',
    summary: 'Get dashboard data',
    description: 'Retrieves dashboard statistics and summary data.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Dashboard data returned' }],
    tag: 'Dashboard',
  },
];

// Search endpoints
export const searchEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/search',
    summary: 'Global search',
    description: 'Searches across all resources in the system.',
    requiresAuth: true,
    parameters: [
      { name: 'q', in: 'query', type: 'string', required: true, description: 'Search query' },
    ],
    responses: [{ status: 200, description: 'Search results returned' }],
    tag: 'Search',
  },
];

// Logger endpoints
export const loggerEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/logger/events',
    summary: 'Get logged events',
    description: 'Retrieves system events log.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Events list returned' }],
    tag: 'Logger',
  },
  {
    method: 'GET',
    path: '/logger/logs',
    summary: 'Get system logs',
    description: 'Retrieves system activity logs.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Logs list returned' }],
    tag: 'Logger',
  },
];

// Tasks endpoints
export const taskEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/tasks',
    summary: 'Get all tasks',
    description: 'Retrieves all tasks.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Tasks list returned' }],
    tag: 'Tasks',
  },
  {
    method: 'POST',
    path: '/tasks',
    summary: 'Create task',
    description: 'Creates a new task.',
    requiresAuth: true,
    requestBody: {
      title: 'string (required)',
      description: 'string (optional)',
      priority: 'string (optional)',
      due_date: 'string (optional)',
    },
    responses: [{ status: 201, description: 'Task created' }],
    tag: 'Tasks',
  },
  {
    method: 'GET',
    path: '/tasks/{id}',
    summary: 'Get task by ID',
    description: 'Retrieves a specific task.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Task ID' },
    ],
    responses: [{ status: 200, description: 'Task details' }],
    tag: 'Tasks',
  },
  {
    method: 'PUT',
    path: '/tasks/{id}',
    summary: 'Update task',
    description: 'Updates an existing task.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Task ID' },
    ],
    responses: [{ status: 200, description: 'Task updated' }],
    tag: 'Tasks',
  },
  {
    method: 'DELETE',
    path: '/tasks/{id}',
    summary: 'Delete task',
    description: 'Soft deletes a task.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Task ID' },
    ],
    responses: [{ status: 200, description: 'Task deleted' }],
    tag: 'Tasks',
  },
  {
    method: 'PUT',
    path: '/tasks/{id}/restore',
    summary: 'Restore task',
    description: 'Restores a soft-deleted task.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Task ID' },
    ],
    responses: [{ status: 200, description: 'Task restored' }],
    tag: 'Tasks',
  },
  {
    method: 'DELETE',
    path: '/tasks/{id}/hard',
    summary: 'Permanently delete task',
    description: 'Permanently deletes a task.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Task ID' },
    ],
    responses: [{ status: 200, description: 'Task permanently deleted' }],
    tag: 'Tasks',
  },
];

// Tokens endpoints
export const tokenEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/tokens',
    summary: 'Get all API tokens',
    description: 'Retrieves all API tokens for the user.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Tokens list returned' }],
    tag: 'Tokens',
  },
  {
    method: 'POST',
    path: '/tokens',
    summary: 'Create API token',
    description: 'Creates a new API token.',
    requiresAuth: true,
    requestBody: {
      name: 'string (required)',
      expiration: 'string (optional)',
    },
    responses: [{ status: 201, description: 'Token created' }],
    tag: 'Tokens',
  },
  {
    method: 'DELETE',
    path: '/tokens/{id}',
    summary: 'Revoke API token',
    description: 'Revokes an API token.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Token ID' },
    ],
    responses: [{ status: 200, description: 'Token revoked' }],
    tag: 'Tokens',
  },
];

// User Preferences endpoints
export const userPreferenceEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/userPreferences/{userId}',
    summary: 'Get user preferences',
    description: 'Retrieves preferences for a user.',
    requiresAuth: true,
    parameters: [
      { name: 'userId', in: 'path', type: 'integer', required: true, description: 'User ID' },
    ],
    responses: [{ status: 200, description: 'User preferences returned' }],
    tag: 'User Preferences',
  },
  {
    method: 'POST',
    path: '/userPreferences',
    summary: 'Create user preferences',
    description: 'Creates preferences for a user.',
    requiresAuth: true,
    requestBody: {
      theme: 'string (optional)',
      language: 'string (optional)',
      notifications_enabled: 'boolean (optional)',
    },
    responses: [{ status: 201, description: 'Preferences created' }],
    tag: 'User Preferences',
  },
  {
    method: 'PATCH',
    path: '/userPreferences/{userId}',
    summary: 'Update user preferences',
    description: 'Updates preferences for a user.',
    requiresAuth: true,
    parameters: [
      { name: 'userId', in: 'path', type: 'integer', required: true, description: 'User ID' },
    ],
    responses: [{ status: 200, description: 'Preferences updated' }],
    tag: 'User Preferences',
  },
];

// Evidence Hub endpoints
export const evidenceHubEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/evidenceHub',
    summary: 'Get all evidence items',
    description: 'Retrieves all evidence items.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Evidence list returned' }],
    tag: 'Evidence Hub',
  },
  {
    method: 'POST',
    path: '/evidenceHub',
    summary: 'Create evidence item',
    description: 'Creates a new evidence item.',
    requiresAuth: true,
    requestBody: {
      title: 'string (required)',
      description: 'string (optional)',
      type: 'string (required)',
    },
    responses: [{ status: 201, description: 'Evidence created' }],
    tag: 'Evidence Hub',
  },
  {
    method: 'GET',
    path: '/evidenceHub/{id}',
    summary: 'Get evidence by ID',
    description: 'Retrieves a specific evidence item.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Evidence ID' },
    ],
    responses: [{ status: 200, description: 'Evidence details' }],
    tag: 'Evidence Hub',
  },
  {
    method: 'PATCH',
    path: '/evidenceHub/{id}',
    summary: 'Update evidence',
    description: 'Updates an evidence item.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Evidence ID' },
    ],
    responses: [{ status: 200, description: 'Evidence updated' }],
    tag: 'Evidence Hub',
  },
  {
    method: 'DELETE',
    path: '/evidenceHub/{id}',
    summary: 'Delete evidence',
    description: 'Deletes an evidence item.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Evidence ID' },
    ],
    responses: [{ status: 200, description: 'Evidence deleted' }],
    tag: 'Evidence Hub',
  },
];

// AI Incident Management endpoints
export const aiIncidentEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/aiIncidentManagement',
    summary: 'Get all AI incidents',
    description: 'Retrieves all AI incidents.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'AI incidents list returned' }],
    tag: 'AI Incident Management',
  },
  {
    method: 'POST',
    path: '/aiIncidentManagement',
    summary: 'Report AI incident',
    description: 'Reports a new AI incident.',
    requiresAuth: true,
    requestBody: {
      title: 'string (required)',
      description: 'string (required)',
      severity: 'string (required)',
    },
    responses: [{ status: 201, description: 'Incident reported' }],
    tag: 'AI Incident Management',
  },
  {
    method: 'GET',
    path: '/aiIncidentManagement/{id}',
    summary: 'Get AI incident by ID',
    description: 'Retrieves a specific AI incident.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Incident ID' },
    ],
    responses: [{ status: 200, description: 'Incident details' }],
    tag: 'AI Incident Management',
  },
  {
    method: 'PATCH',
    path: '/aiIncidentManagement/{id}',
    summary: 'Update AI incident',
    description: 'Updates an AI incident.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Incident ID' },
    ],
    responses: [{ status: 200, description: 'Incident updated' }],
    tag: 'AI Incident Management',
  },
  {
    method: 'PATCH',
    path: '/aiIncidentManagement/{id}/archive',
    summary: 'Archive AI incident',
    description: 'Archives an AI incident.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Incident ID' },
    ],
    responses: [{ status: 200, description: 'Incident archived' }],
    tag: 'AI Incident Management',
  },
  {
    method: 'DELETE',
    path: '/aiIncidentManagement/{id}',
    summary: 'Delete AI incident',
    description: 'Deletes an AI incident.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Incident ID' },
    ],
    responses: [{ status: 200, description: 'Incident deleted' }],
    tag: 'AI Incident Management',
  },
];

// CE Marking endpoints
export const ceMarkingEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/ceMarking/{projectId}',
    summary: 'Get CE marking status',
    description: 'Retrieves CE marking status for a project.',
    requiresAuth: true,
    parameters: [
      { name: 'projectId', in: 'path', type: 'integer', required: true, description: 'Project ID' },
    ],
    responses: [{ status: 200, description: 'CE marking status' }],
    tag: 'CE Marking',
  },
  {
    method: 'PUT',
    path: '/ceMarking/{projectId}',
    summary: 'Update CE marking status',
    description: 'Updates CE marking status for a project.',
    requiresAuth: true,
    parameters: [
      { name: 'projectId', in: 'path', type: 'integer', required: true, description: 'Project ID' },
    ],
    responses: [{ status: 200, description: 'CE marking updated' }],
    tag: 'CE Marking',
  },
];

// Automation endpoints
export const automationEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/automation',
    summary: 'Get all automation rules',
    description: 'Retrieves all automation rules.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Automation rules list' }],
    tag: 'Automation',
  },
  {
    method: 'POST',
    path: '/automation',
    summary: 'Create automation rule',
    description: 'Creates a new automation rule.',
    requiresAuth: true,
    requestBody: {
      name: 'string (required)',
      trigger_type: 'string (required)',
      action_type: 'string (required)',
    },
    responses: [{ status: 201, description: 'Automation rule created' }],
    tag: 'Automation',
  },
  {
    method: 'GET',
    path: '/automation/triggers',
    summary: 'Get automation triggers',
    description: 'Retrieves available automation triggers.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Triggers list' }],
    tag: 'Automation',
  },
  {
    method: 'GET',
    path: '/automation/actions/by-triggerId/{triggerId}',
    summary: 'Get actions for trigger',
    description: 'Retrieves actions for a specific trigger.',
    requiresAuth: true,
    parameters: [
      { name: 'triggerId', in: 'path', type: 'integer', required: true, description: 'Trigger ID' },
    ],
    responses: [{ status: 200, description: 'Actions list' }],
    tag: 'Automation',
  },
  {
    method: 'GET',
    path: '/automation/{id}',
    summary: 'Get automation rule by ID',
    description: 'Retrieves a specific automation rule.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Rule ID' },
    ],
    responses: [{ status: 200, description: 'Automation rule details' }],
    tag: 'Automation',
  },
  {
    method: 'PUT',
    path: '/automation/{id}',
    summary: 'Update automation rule',
    description: 'Updates an automation rule.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Rule ID' },
    ],
    responses: [{ status: 200, description: 'Automation rule updated' }],
    tag: 'Automation',
  },
  {
    method: 'DELETE',
    path: '/automation/{id}',
    summary: 'Delete automation rule',
    description: 'Deletes an automation rule.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Rule ID' },
    ],
    responses: [{ status: 200, description: 'Automation rule deleted' }],
    tag: 'Automation',
  },
  {
    method: 'GET',
    path: '/automation/{id}/history',
    summary: 'Get automation history',
    description: 'Retrieves execution history for an automation rule.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Rule ID' },
    ],
    responses: [{ status: 200, description: 'Execution history' }],
    tag: 'Automation',
  },
  {
    method: 'GET',
    path: '/automation/{id}/stats',
    summary: 'Get automation stats',
    description: 'Retrieves statistics for an automation rule.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Rule ID' },
    ],
    responses: [{ status: 200, description: 'Automation statistics' }],
    tag: 'Automation',
  },
];

// NIST AI RMF endpoints
export const nistAiRmfEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/nist-ai-rmf/functions',
    summary: 'Get NIST AI RMF functions',
    description: 'Retrieves all NIST AI RMF functions.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Functions list' }],
    tag: 'NIST AI RMF',
  },
  {
    method: 'GET',
    path: '/nist-ai-rmf/functions/{id}',
    summary: 'Get function by ID',
    description: 'Retrieves a specific NIST AI RMF function.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Function ID' },
    ],
    responses: [{ status: 200, description: 'Function details' }],
    tag: 'NIST AI RMF',
  },
  {
    method: 'GET',
    path: '/nist-ai-rmf/categories/{title}',
    summary: 'Get category by title',
    description: 'Retrieves a category by its title.',
    requiresAuth: true,
    parameters: [
      { name: 'title', in: 'path', type: 'string', required: true, description: 'Category title' },
    ],
    responses: [{ status: 200, description: 'Category details' }],
    tag: 'NIST AI RMF',
  },
  {
    method: 'GET',
    path: '/nist-ai-rmf/subcategories/byId/{id}',
    summary: 'Get subcategory by ID',
    description: 'Retrieves a specific subcategory.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Subcategory ID' },
    ],
    responses: [{ status: 200, description: 'Subcategory details' }],
    tag: 'NIST AI RMF',
  },
  {
    method: 'GET',
    path: '/nist-ai-rmf/subcategories/{id}/risks',
    summary: 'Get risks for subcategory',
    description: 'Retrieves risks associated with a subcategory.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Subcategory ID' },
    ],
    responses: [{ status: 200, description: 'Risks list' }],
    tag: 'NIST AI RMF',
  },
  {
    method: 'PATCH',
    path: '/nist-ai-rmf/subcategories/{id}',
    summary: 'Update subcategory',
    description: 'Updates a NIST AI RMF subcategory.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Subcategory ID' },
    ],
    responses: [{ status: 200, description: 'Subcategory updated' }],
    tag: 'NIST AI RMF',
  },
  {
    method: 'PATCH',
    path: '/nist-ai-rmf/subcategories/{id}/status',
    summary: 'Update subcategory status',
    description: 'Updates the status of a subcategory.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Subcategory ID' },
    ],
    responses: [{ status: 200, description: 'Status updated' }],
    tag: 'NIST AI RMF',
  },
  {
    method: 'GET',
    path: '/nist-ai-rmf/progress',
    summary: 'Get overall progress',
    description: 'Retrieves overall NIST AI RMF progress.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Progress data' }],
    tag: 'NIST AI RMF',
  },
  {
    method: 'GET',
    path: '/nist-ai-rmf/progress-by-function',
    summary: 'Get progress by function',
    description: 'Retrieves progress broken down by function.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Progress by function' }],
    tag: 'NIST AI RMF',
  },
  {
    method: 'GET',
    path: '/nist-ai-rmf/assignments',
    summary: 'Get assignments',
    description: 'Retrieves NIST AI RMF assignments.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Assignments data' }],
    tag: 'NIST AI RMF',
  },
  {
    method: 'GET',
    path: '/nist-ai-rmf/overview',
    summary: 'Get overview',
    description: 'Retrieves NIST AI RMF overview.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Overview data' }],
    tag: 'NIST AI RMF',
  },
];

// Integrations endpoints
export const integrationEndpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/integrations/test',
    summary: 'Test integration',
    description: 'Tests an integration connection.',
    requiresAuth: true,
    requestBody: {
      type: 'string (required)',
      config: 'object (required)',
    },
    responses: [{ status: 200, description: 'Integration test result' }],
    tag: 'Integrations',
  },
  {
    method: 'GET',
    path: '/integrations/config',
    summary: 'Get integration config',
    description: 'Retrieves integration configuration.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Integration configuration' }],
    tag: 'Integrations',
  },
  {
    method: 'POST',
    path: '/integrations/configure',
    summary: 'Configure integration',
    description: 'Configures an integration.',
    requiresAuth: true,
    requestBody: {
      type: 'string (required)',
      config: 'object (required)',
    },
    responses: [{ status: 200, description: 'Integration configured' }],
    tag: 'Integrations',
  },
  {
    method: 'GET',
    path: '/integrations/models',
    summary: 'Get integration models',
    description: 'Retrieves available integration models.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Integration models list' }],
    tag: 'Integrations',
  },
  {
    method: 'GET',
    path: '/integrations/sync-status',
    summary: 'Get sync status',
    description: 'Retrieves integration sync status.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Sync status' }],
    tag: 'Integrations',
  },
  {
    method: 'GET',
    path: '/integrations/health',
    summary: 'Check integration health',
    description: 'Checks health of integrations.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Integration health status' }],
    tag: 'Integrations',
  },
];

// Share Links endpoints
export const shareLinkEndpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/shareLinks',
    summary: 'Create share link',
    description: 'Creates a new share link.',
    requiresAuth: true,
    requestBody: {
      resource_type: 'string (required)',
      resource_id: 'integer (required)',
      expires_at: 'string (optional)',
    },
    responses: [{ status: 201, description: 'Share link created' }],
    tag: 'Share Links',
  },
  {
    method: 'GET',
    path: '/shareLinks/token/{token}',
    summary: 'Get share link by token',
    description: 'Retrieves a share link by its token.',
    requiresAuth: false,
    parameters: [
      { name: 'token', in: 'path', type: 'string', required: true, description: 'Share token' },
    ],
    responses: [{ status: 200, description: 'Share link details' }],
    tag: 'Share Links',
  },
  {
    method: 'GET',
    path: '/shareLinks/view/{token}',
    summary: 'View shared resource',
    description: 'Views the resource associated with a share link.',
    requiresAuth: false,
    parameters: [
      { name: 'token', in: 'path', type: 'string', required: true, description: 'Share token' },
    ],
    responses: [{ status: 200, description: 'Shared resource data' }],
    tag: 'Share Links',
  },
  {
    method: 'GET',
    path: '/shareLinks/{resourceType}/{resourceId}',
    summary: 'Get share links for resource',
    description: 'Retrieves all share links for a resource.',
    requiresAuth: true,
    parameters: [
      { name: 'resourceType', in: 'path', type: 'string', required: true, description: 'Resource type' },
      { name: 'resourceId', in: 'path', type: 'integer', required: true, description: 'Resource ID' },
    ],
    responses: [{ status: 200, description: 'Share links for resource' }],
    tag: 'Share Links',
  },
  {
    method: 'PATCH',
    path: '/shareLinks/{id}',
    summary: 'Update share link',
    description: 'Updates a share link.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Share link ID' },
    ],
    responses: [{ status: 200, description: 'Share link updated' }],
    tag: 'Share Links',
  },
  {
    method: 'DELETE',
    path: '/shareLinks/{id}',
    summary: 'Delete share link',
    description: 'Deletes a share link.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Share link ID' },
    ],
    responses: [{ status: 200, description: 'Share link deleted' }],
    tag: 'Share Links',
  },
];

// Reporting endpoints
export const reportingEndpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/reporting/generate-report',
    summary: 'Generate report',
    description: 'Generates a compliance report.',
    requiresAuth: true,
    requestBody: {
      reportType: 'string (required)',
      projectId: 'integer (required)',
      format: 'string (required) - pdf, xlsx, or docx',
    },
    responses: [{ status: 200, description: 'Report generated' }],
    tag: 'Reporting',
  },
  {
    method: 'GET',
    path: '/reporting/generate-report',
    summary: 'Get report templates',
    description: 'Retrieves available report templates.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Report templates list' }],
    tag: 'Reporting',
  },
  {
    method: 'DELETE',
    path: '/reporting/{id}',
    summary: 'Delete report',
    description: 'Deletes a generated report.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Report ID' },
    ],
    responses: [{ status: 200, description: 'Report deleted' }],
    tag: 'Reporting',
  },
];

// Slack Webhooks endpoints
export const slackWebhookEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/slackWebhooks',
    summary: 'Get all Slack webhooks',
    description: 'Retrieves all Slack webhooks.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Slack webhooks list' }],
    tag: 'Slack Webhooks',
  },
  {
    method: 'POST',
    path: '/slackWebhooks',
    summary: 'Create Slack webhook',
    description: 'Creates a new Slack webhook.',
    requiresAuth: true,
    requestBody: {
      name: 'string (required)',
      webhook_url: 'string (required)',
      channel: 'string (optional)',
    },
    responses: [{ status: 201, description: 'Webhook created' }],
    tag: 'Slack Webhooks',
  },
  {
    method: 'GET',
    path: '/slackWebhooks/{id}',
    summary: 'Get Slack webhook by ID',
    description: 'Retrieves a specific Slack webhook.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Webhook ID' },
    ],
    responses: [{ status: 200, description: 'Webhook details' }],
    tag: 'Slack Webhooks',
  },
  {
    method: 'PATCH',
    path: '/slackWebhooks/{id}',
    summary: 'Update Slack webhook',
    description: 'Updates a Slack webhook.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Webhook ID' },
    ],
    responses: [{ status: 200, description: 'Webhook updated' }],
    tag: 'Slack Webhooks',
  },
  {
    method: 'DELETE',
    path: '/slackWebhooks/{id}',
    summary: 'Delete Slack webhook',
    description: 'Deletes a Slack webhook.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Webhook ID' },
    ],
    responses: [{ status: 200, description: 'Webhook deleted' }],
    tag: 'Slack Webhooks',
  },
  {
    method: 'POST',
    path: '/slackWebhooks/{id}/send',
    summary: 'Send test message',
    description: 'Sends a test message to a Slack webhook.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Webhook ID' },
    ],
    requestBody: {
      message: 'string (required)',
    },
    responses: [{ status: 200, description: 'Message sent' }],
    tag: 'Slack Webhooks',
  },
];

// Subscription endpoints
export const subscriptionEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/subscription',
    summary: 'Get subscription status',
    description: 'Retrieves current subscription status.',
    requiresAuth: true,
    responses: [{ status: 200, description: 'Subscription status' }],
    tag: 'Subscription',
  },
  {
    method: 'POST',
    path: '/subscription',
    summary: 'Create subscription',
    description: 'Creates a new subscription.',
    requiresAuth: true,
    requestBody: {
      plan: 'string (required)',
      billingCycle: 'string (optional)',
    },
    responses: [{ status: 201, description: 'Subscription created' }],
    tag: 'Subscription',
  },
  {
    method: 'PUT',
    path: '/subscription/{id}',
    summary: 'Update subscription',
    description: 'Updates a subscription.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Subscription ID' },
    ],
    responses: [{ status: 200, description: 'Subscription updated' }],
    tag: 'Subscription',
  },
];

// Tiers endpoints
export const tierEndpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/tiers/features/{id}',
    summary: 'Get tier features',
    description: 'Retrieves features for a subscription tier.',
    requiresAuth: true,
    parameters: [
      { name: 'id', in: 'path', type: 'integer', required: true, description: 'Tier ID' },
    ],
    responses: [{ status: 200, description: 'Tier features' }],
    tag: 'Tiers',
  },
];

// Export all endpoints grouped
export const allEndpoints = {
  authentication: authenticationEndpoints,
  users: userEndpoints,
  organizations: organizationEndpoints,
  projects: projectEndpoints,
  projectRisks: projectRiskEndpoints,
  vendors: vendorEndpoints,
  vendorRisks: vendorRiskEndpoints,
  assessments: assessmentEndpoints,
  policies: policyEndpoints,
  modelInventory: modelInventoryEndpoints,
  modelRisks: modelRiskEndpoints,
  euAiAct: euAiActEndpoints,
  iso27001: iso27001Endpoints,
  iso42001: iso42001Endpoints,
  biasAndFairness: biasAndFairnessEndpoints,
  training: trainingEndpoints,
  roles: roleEndpoints,
  controls: controlEndpoints,
  controlCategories: controlCategoryEndpoints,
  frameworks: frameworkEndpoints,
  aiTrustCentre: aiTrustCentreEndpoints,
  files: fileEndpoints,
  email: emailEndpoints,
  dashboard: dashboardEndpoints,
  search: searchEndpoints,
  logger: loggerEndpoints,
  tasks: taskEndpoints,
  tokens: tokenEndpoints,
  userPreferences: userPreferenceEndpoints,
  evidenceHub: evidenceHubEndpoints,
  aiIncidents: aiIncidentEndpoints,
  ceMarking: ceMarkingEndpoints,
  automation: automationEndpoints,
  nistAiRmf: nistAiRmfEndpoints,
  integrations: integrationEndpoints,
  shareLinks: shareLinkEndpoints,
  reporting: reportingEndpoints,
  slackWebhooks: slackWebhookEndpoints,
  subscription: subscriptionEndpoints,
  tiers: tierEndpoints,
};
