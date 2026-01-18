import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.reduce((acc, detail) => {
        acc[detail.path.join('.')] = detail.message;
        return acc;
      }, {} as Record<string, string>);

      return res.status(400).json({ errors });
    }

    req.body = value;
    next();
  };
};
