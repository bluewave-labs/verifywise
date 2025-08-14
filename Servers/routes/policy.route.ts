
import { Router } from 'express';
import { PolicyController } from '../controllers/policy.ctrl';
import authenticateJWT from '../middleware/auth.middleware';

const router = Router();


// GET /policies - Get all policies
router.get('/', authenticateJWT, PolicyController.getAllPolicies);

// GET /policies/tags - Get available policy tags
router.get('/tags', authenticateJWT, PolicyController.getPolicyTags);

// GET /policies/:id - Get policy by ID
router.get('/:id', authenticateJWT, PolicyController.getPolicyById);

// POST /policies - Create new policy
router.post('/', authenticateJWT, PolicyController.createPolicy);

// PUT /policies/:id - Update policy
router.put('/:id', authenticateJWT, PolicyController.updatePolicy);

// In routes file
router.delete('/:id', authenticateJWT, PolicyController.deletePolicyById);


export default router;