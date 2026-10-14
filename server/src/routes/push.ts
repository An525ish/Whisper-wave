import { Router } from 'express';
import { deleteDevice, getPushConfig, putDevice } from '../controllers/push.js';
import { auth, validate } from '../middlewares/index.js';
import { pushDeviceSchema, pushTokenSchema } from '../validators/push.js';

export const pushRouter = Router();

pushRouter.get('/config', getPushConfig);
pushRouter.put('/devices', auth, validate(pushDeviceSchema), putDevice);
pushRouter.delete('/devices', auth, validate(pushTokenSchema), deleteDevice);
