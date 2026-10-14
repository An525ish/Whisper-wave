import type { RequestHandler } from 'express';
import { pushService } from '../services/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import type { RegisterPushDeviceInput } from '../types/push.js';

export const getPushConfig: RequestHandler = (_req, res) => {
  res.json(pushService.getPublicConfig());
};

export const putDevice: RequestHandler = catchAsync(async (req, res) => {
  const { token, platform } = req.body as Pick<RegisterPushDeviceInput, 'token' | 'platform'>;
  await pushService.registerDevice({
    userId: req.userId!,
    token,
    platform,
    userAgent: req.get('user-agent'),
  });
  res.status(204).end();
});

export const deleteDevice: RequestHandler = catchAsync(async (req, res) => {
  await pushService.removeDevice(req.userId!, (req.body as { token: string }).token);
  res.status(204).end();
});
