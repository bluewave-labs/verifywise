import { Request, Response } from 'express';
import { IPolicy, POLICY_TAGS } from '../domain.layer/interfaces/i.policy';
import { STATUS_CODE } from '../utils/statusCode.utils';
import { createPolicyQuery, deletePolicyByIdQuery, getAllPoliciesQuery, getPolicyByIdQuery, updatePolicyByIdQuery } from '../utils/policyManager.utils';

export class PolicyController {
  // Get all policies
  static async getAllPolicies(req: Request, res: Response) {
    try {
      const policies = await getAllPoliciesQuery(req.tenantId!);

      return res.status(200).json(STATUS_CODE[200](policies));
    } catch (error) {
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

  // Get policy by ID
  static async getPolicyById(req: Request, res: Response) {
    try {
      const policyId = parseInt(req.params.id);
      const policy = await getPolicyByIdQuery(req.tenantId!, policyId);

      if (policy) {
        return res.status(200).json(STATUS_CODE[200](policy));
      }

      return res.status(404).json(STATUS_CODE[404](null));
    } catch (error) {
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

  // Create new policy
  static async createPolicy(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const policyData = {
        ...req.body,
        author_id: userId,
        last_updated_by: userId
      } as IPolicy;

      const policy = await createPolicyQuery(policyData, req.tenantId!, userId);

      if (policy) {
        return res.status(201).json(STATUS_CODE[201](policy));
      }
      return res.status(503).json(STATUS_CODE[503]({}));
    } catch (error) {
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

  // Update policy
  static async updatePolicy(req: Request, res: Response) {
    try {
      const policyId = parseInt(req.params.id);
      const userId = req.userId!;
      // Get existing policy for business rule validation
      let existingPolicy = null;
      try {
        existingPolicy = await getPolicyByIdQuery(req.tenantId!, policyId);
      } catch (error) {
        // Continue without existing data if query fails
      }

      const policyData = {
        ...req.body,
        last_updated_by: userId
      } as Partial<IPolicy>;

      const policy = await updatePolicyByIdQuery(policyId, policyData, req.tenantId!, userId);

      if (policy) {
        return res.status(202).json(STATUS_CODE[202](policy));
      }
      return res.status(404).json(STATUS_CODE[404]({}));
    } catch (error) {
      console.error('Error updating policy:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get available policy tags
  static async getPolicyTags(req: Request, res: Response) {
    try {
      return res.status(200).json(STATUS_CODE[200](POLICY_TAGS));
    } catch (error) {
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

  // In PolicyController
  static async deletePolicyById(req: Request, res: Response) {
    try {
      const policyId = parseInt(req.params.id);

      const deleted = await deletePolicyByIdQuery(req.tenantId!, policyId);

      if (deleted) {
        return res.status(202).json(STATUS_CODE[202](deleted));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } catch (error) {
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

}