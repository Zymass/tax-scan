import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../error.middleware';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockRequest = {
      method: 'GET',
      path: '/api/test',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should handle error with default status code 500', () => {
    const error = new Error('Test error');
    delete process.env.NODE_ENV;

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Test error',
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should handle error with custom status code', () => {
    const error = new Error('Not found') as any;
    error.statusCode = 404;

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Not found',
    });
  });

  it('should include stack trace in development mode', () => {
    const error = new Error('Test error');
    process.env.NODE_ENV = 'development';

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Test error',
        stack: expect.any(String),
      })
    );
  });

  it('should not include stack trace in production mode', () => {
    const error = new Error('Test error');
    process.env.NODE_ENV = 'production';

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Test error',
    });
    expect(mockResponse.json).not.toHaveBeenCalledWith(
      expect.objectContaining({
        stack: expect.any(String),
      })
    );
  });

  it('should use default message if error has no message', () => {
    const error = new Error();
    error.message = '';

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
    });
  });

    it('should log error details', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      // Check that console.error was called with error message
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error 500:'),
        'Test error'
      );
      // Check that console.error was called with path (template string with method and path)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('📍 Path: GET /api/test')
      );
      // Check that console.error was called with stack
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('📚 Stack:'),
        'Error stack trace'
      );
      // Verify it was called at least 3 times
      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
    });
});
