import { Request, Response, NextFunction } from 'express';
import { getShippingRules } from '../utils/shipping';
import { AuthRequest } from '../middleware/auth';

/**
 * GET /api/shipping/rules
 * Public endpoint — returns current shipping configuration
 */
export const getShippingConfig = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rules = await getShippingRules();
    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};
