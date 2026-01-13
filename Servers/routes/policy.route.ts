
import { Router } from 'express';
import { PolicyController } from '../controllers/policy.ctrl';
import authenticateJWT from '../middleware/auth.middleware';

const router = Router();


// GET /policies - Get all policies
router.get('/', authenticateJWT, PolicyController.getAllPolicies);

// GET /policies/tags - Get available policy tags
router.get('/tags', authenticateJWT, PolicyController.getPolicyTags);

// GET /policies/:id/export/pdf - Export policy as PDF
router.get('/:id/export/pdf', authenticateJWT, PolicyController.exportPolicyPDF);

// GET /policies/:id/export/docx - Export policy as DOCX
router.get('/:id/export/docx', authenticateJWT, PolicyController.exportPolicyDOCX);

// GET /policies/:id - Get policy by ID
router.get('/:id', authenticateJWT, PolicyController.getPolicyById);

// POST /policies - Create new policy
router.post('/', authenticateJWT, PolicyController.createPolicy);

// PUT /policies/:id - Update policy
router.put('/:id', authenticateJWT, PolicyController.updatePolicy);

// DELETE /policies/:id - Delete policy by ID
router.delete('/:id', authenticateJWT, PolicyController.deletePolicyById);


export default router;
