import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, optionalAuthMiddleware } from '../auth.middleware';

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  describe('authMiddleware', () => {
    it('should call next() with valid token', () => {
      const token = 'valid-token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-123' });

      authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
      expect(mockRequest.userId).toBe('user-123');
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no token provided', () => {
      mockRequest.headers = {};

      authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      const token = 'invalid-token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle token without Bearer prefix', () => {
      const token = 'valid-token';
      mockRequest.headers = {
        authorization: token,
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-123' });

      authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
      expect(mockRequest.userId).toBe('user-123');
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should set userId if valid token provided', () => {
      const token = 'valid-token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-123' });

      optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
      expect(mockRequest.userId).toBe('user-123');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next() even if no token provided', () => {
      mockRequest.headers = {};

      optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockRequest.userId).toBeUndefined();
    });

    it('should call next() even if token is invalid', () => {
      const token = 'invalid-token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockRequest.userId).toBeUndefined();
    });
  });
});
