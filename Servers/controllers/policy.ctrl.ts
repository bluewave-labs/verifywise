import { Request, Response } from 'express';
import { IPolicy, POLICY_TAGS } from '../domain.layer/interfaces/i.policy';
import { STATUS_CODE } from '../utils/statusCode.utils';
import { createPolicyQuery, deletePolicyByIdQuery, getAllPoliciesQuery, getPolicyByIdQuery, updatePolicyByIdQuery } from '../utils/policyManager.utils';
import { sequelize } from '../database/db';
import {
  recordPolicyCreation,
  trackPolicyChanges,
  recordMultipleFieldChanges,
} from '../utils/policyChangeHistory.utils';
import { emitEvent, computeChanges } from "../plugins/core/emitEvent";
import { PluginEvent } from "../plugins/core/types";

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
    const transaction = await sequelize.transaction();
    try {
      const userId = req.userId!;
      const policyData = {
        ...req.body,
        author_id: userId,
        last_updated_by: userId
      } as IPolicy;

      const policy = await createPolicyQuery(policyData, req.tenantId!, userId, transaction);

      if (policy) {
        // Record creation in change history
        if (policy.id) {
          await recordPolicyCreation(
            policy.id,
            userId,
            req.tenantId!,
            policyData,
            transaction
          );
        }

        await transaction.commit();

        // Emit policy created event (fire-and-forget)
        emitEvent(
          PluginEvent.POLICY_CREATED,
          {
            policyId: policy.id!,
            projectId: 0,
            policy: policy as unknown as Record<string, unknown>,
          },
          {
            triggeredBy: { userId: userId },
            tenant: req.tenantId || "default",
          }
        );

        return res.status(201).json(STATUS_CODE[201](policy));
      }
      await transaction.rollback();
      return res.status(503).json(STATUS_CODE[503]({}));
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

  // Update policy
  static async updatePolicy(req: Request, res: Response) {
    const transaction = await sequelize.transaction();
    try {
      const policyId = parseInt(req.params.id);
      const userId = req.userId!;
      // Get existing policy for change tracking
      const existingPolicyResult = await getPolicyByIdQuery(req.tenantId!, policyId);

      if (!existingPolicyResult || existingPolicyResult.length === 0) {
        await transaction.rollback();
        return res.status(404).json(STATUS_CODE[404]({}));
      }

      const existingPolicy = existingPolicyResult[0];

      const policyData = {
        ...req.body,
        last_updated_by: userId
      } as Partial<IPolicy>;

      const policy = await updatePolicyByIdQuery(policyId, policyData, req.tenantId!, userId, transaction);

      if (policy) {
        // Track and record changes
        const changes = await trackPolicyChanges(existingPolicy as unknown as IPolicy, policyData);
        if (changes.length > 0) {
          await recordMultipleFieldChanges(
            policyId,
            userId,
            req.tenantId!,
            changes,
            transaction
          );
        }

        await transaction.commit();

        // Emit policy updated event (fire-and-forget)
        emitEvent(
          PluginEvent.POLICY_UPDATED,
          {
            policyId: policyId,
            projectId: 0,
            policy: policy as unknown as Record<string, unknown>,
            changes: computeChanges(
              existingPolicy as unknown as Record<string, unknown>,
              policy as unknown as Record<string, unknown>
            ),
          },
          {
            triggeredBy: { userId: userId },
            tenant: req.tenantId || "default",
          }
        );

        return res.status(202).json(STATUS_CODE[202](policy));
      }
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]({}));
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating policy:', error);
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
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
    const transaction = await sequelize.transaction();
    try {
      const policyId = parseInt(req.params.id);

      const deleted = await deletePolicyByIdQuery(req.tenantId!, policyId, transaction);

      if (deleted) {
        await transaction.commit();

        // Emit policy deleted event (fire-and-forget)
        emitEvent(
          PluginEvent.POLICY_DELETED,
          {
            policyId: policyId,
            projectId: 0,
            policy: deleted as unknown as Record<string, unknown>,
          },
          {
            triggeredBy: { userId: req.userId! },
            tenant: req.tenantId || "default",
          }
        );

        return res.status(202).json(STATUS_CODE[202](deleted));
      }

      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]({}));
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json(STATUS_CODE[500]((error as Error).message));
    }
  }

}