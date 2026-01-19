import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validate } from '../validation.middleware';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  it('should call next() if validation passes', () => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      name: Joi.string().required(),
    });

    mockRequest.body = {
      email: 'test@example.com',
      name: 'Test User',
    };

    const middleware = validate(schema);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockRequest.body).toEqual({
      email: 'test@example.com',
      name: 'Test User',
    });
  });

  it('should return 400 if validation fails', () => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      name: Joi.string().required(),
    });

    mockRequest.body = {
      email: 'invalid-email',
      name: '',
    };

    const middleware = validate(schema);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      errors: expect.objectContaining({
        email: expect.any(String),
        name: expect.any(String),
      }),
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should strip unknown fields', () => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
    });

    mockRequest.body = {
      email: 'test@example.com',
      unknownField: 'should be removed',
      anotherUnknown: 123,
    };

    const middleware = validate(schema);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.body).toEqual({
      email: 'test@example.com',
    });
    expect(mockRequest.body).not.toHaveProperty('unknownField');
    expect(mockRequest.body).not.toHaveProperty('anotherUnknown');
  });

  it('should handle multiple validation errors', () => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      name: Joi.string().min(2).required(),
    });

    mockRequest.body = {
      email: 'invalid',
      password: 'short',
      name: 'A',
    };

    const middleware = validate(schema);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.json).toHaveBeenCalledWith({
      errors: expect.objectContaining({
        email: expect.any(String),
        password: expect.any(String),
        name: expect.any(String),
      }),
    });
  });

  it('should handle nested validation errors', () => {
    const schema = Joi.object({
      user: Joi.object({
        email: Joi.string().email().required(),
        name: Joi.string().required(),
      }).required(),
    });

    mockRequest.body = {
      user: {
        email: 'invalid',
        name: '',
      },
    };

    const middleware = validate(schema);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      errors: expect.objectContaining({
        'user.email': expect.any(String),
        'user.name': expect.any(String),
      }),
    });
  });
});
