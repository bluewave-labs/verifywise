import { Router } from 'express';
import authenticateJWT from '../middleware/auth.middleware';
import { createLinkedObject, deleteLinkedObject, getLinkedObjects, updateLinkedObject } from '../controllers/policy-linked-objects.ctrl';

const router = Router();

// GET /policy-linked/:policyId/linked-objects - Get all linked objects for a policy
router.get('/:policyId/linked-objects', authenticateJWT, getLinkedObjects);

// POST /policy-linked/:policyId/linked-objects - Create a new linked object for a policy
router.post('/:policyId/linked-objects', authenticateJWT, createLinkedObject);

// PUT /policy-linked/:policyId/linked-objects - Update a linked object for a policy
router.put('/:policyId/linked-objects', authenticateJWT, updateLinkedObject);

// DELETE /policy-linked/:policyId/linked-objects - Delete a linked object for a policy
router.delete('/:policyId/linked-objects', authenticateJWT, deleteLinkedObject);

export default router;