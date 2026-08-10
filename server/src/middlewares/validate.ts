import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from '../utils/AppError.js';

type RequestPart = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodTypeAny, part: RequestPart = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(', ');
      next(new AppError(400, message));
      return;
    }

    (req as Request & Record<RequestPart, unknown>)[part] = result.data;
    next();
  };
