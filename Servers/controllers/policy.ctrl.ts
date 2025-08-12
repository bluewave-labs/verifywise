import { Request, Response } from 'express';
import { PolicyModel } from '../domain.layer/models/policy/policy.model';
import { UserModel } from '../domain.layer/models/user/user.model';
import { POLICY_TAGS } from '../domain.layer/interfaces/i.policy';

export class PolicyController {
  // Get all policies
  static async getAllPolicies(req: Request, res: Response) {
    try {
      const policies = await PolicyModel.findAll({
        include: [
          {
            model: UserModel,
            as: 'author',
            attributes: ['id', 'name', 'surname', 'email'],
          },
          {
            model: UserModel,
            as: 'lastUpdatedByUser',
            attributes: ['id', 'name', 'surname', 'email'],
          },
        ],
        order: [['created_at', 'DESC']],
      });

      res.json(policies);
    } catch (error) {
      console.error('Error fetching policies:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get policy by ID
  static async getPolicyById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const policy = await PolicyModel.findByPk(id, {
        include: [
          {
            model: UserModel,
            as: 'author',
            attributes: ['id', 'name', 'surname', 'email'],
          },
          {
            model: UserModel,
            as: 'lastUpdatedByUser',
            attributes: ['id', 'name', 'surname', 'email'],
          },
        ],
      });
      
      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      res.json(policy);
    } catch (error) {
      console.error('Error fetching policy:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create new policy
  static async createPolicy(req: Request, res: Response) {
    try {
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const policyData = req.body;
      
      if (!policyData.title) {
        return res.status(400).json({ error: 'Policy title is required' });
      }

      const policy = await PolicyModel.create({
        ...policyData,
        author_id: userId,
        last_updated_by: userId,
        status: 'Draft',
        content_html: policyData.content_html || '',
      });

      res.status(201).json(policy);
    } catch (error) {
      console.error('Error creating policy:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update policy
  static async updatePolicy(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const policy = await PolicyModel.findByPk(id);
      
      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      const updateData = req.body;

      await policy.update({
        ...updateData,
        last_updated_by: userId,
      });

      res.json(policy);
    } catch (error) {
      console.error('Error updating policy:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get available policy tags
  static async getPolicyTags(req: Request, res: Response) {
    try {
      res.json({ tags: POLICY_TAGS });
    } catch (error) {
      console.error('Error fetching policy tags:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // In PolicyController
static async deletePolicy(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const policy = await PolicyModel.findByPk(id);

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    await policy.destroy();

    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

}