import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';

export const validate =
  (schema: Joi.ObjectSchema, target: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors: Record<string, string> = {};
      error.details.forEach((detail) => {
        const key = detail.path.join('.');
        errors[key] = detail.message.replace(/['"]/g, '');
      });
      return next(new ValidationError('Validation failed', errors));
    }

    if (target === 'query') {
      Object.assign(req.query, value);
    } else {
      req[target] = value;
    }
    next();
  };
