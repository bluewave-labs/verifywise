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
      const id = parseInt(req.params.id);

      const policy = await getPolicyByIdQuery(req.tenantId!, id);

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
      const policyData = req.body as IPolicy;

      if (!policyData.title) {
        return res.status(400).json(STATUS_CODE[400]({ error: 'Policy title is required' }));
      }

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
      const id = parseInt(req.params.id);
      const userId = req.userId!;
      const policyData = req.body as Partial<IPolicy>;

      const policy = await updatePolicyByIdQuery(id, policyData, req.tenantId!, userId);

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
      const id = parseInt(req.params.id);
      const deleted = await deletePolicyByIdQuery(req.tenantId!, id);

      if (deleted) {
        return res.status(202).json(STATUS_CODE[202](deleted));
      }

      return res.status(404).json(STATUS_CODE[404]({}));
    } catch (error) {
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

}