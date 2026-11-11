import type { RequestHandler } from 'express';
import { adminGrant, adminRevoke } from '../../services/payments/index.js';
import { getEntitlements } from '../../services/user/entitlements.js';
import type { PlanId } from '../../types/subscription.js';
import { catchAsync } from '../../utils/catchAsync.js';

/** GET /api/admin/users/:id/pass: one account's pass. Admin only. */
export const getUserPassController: RequestHandler = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: await getEntitlements(String(req.params.id)) });
});

/** POST /api/admin/users/:id/pass: grant (or extend) a pass without a payment. Admin only. */
export const grantUserPassController: RequestHandler = catchAsync(async (req, res) => {
  const { planId } = req.body as { planId: PlanId };
  res.status(200).json({ success: true, data: await adminGrant(String(req.params.id), planId) });
});

/** DELETE /api/admin/users/:id/pass: end a pass now. Admin only. */
export const revokeUserPassController: RequestHandler = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: await adminRevoke(String(req.params.id)) });
});
