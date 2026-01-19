import { AuthService } from '../auth.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db';

jest.mock('../../db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        name: 'Test User',
        phone: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await service.register(registerData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password_hash: 'hashed-password',
          name: 'Test User',
          phone: undefined,
          auth_provider: 'email',
          calculations_limit: 5,
        },
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123' },
        'test-secret',
        { expiresIn: '7d' }
      );
      expect(result).toEqual({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          phone: null,
        },
        token: 'mock-token',
      });
    });

    it('should throw error if user already exists', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const existingUser = {
        id: 'user-123',
        email: 'existing@example.com',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      await expect(service.register(registerData)).rejects.toThrow('User already exists');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should include phone if provided', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '+79991234567',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        name: 'Test User',
        phone: '+79991234567',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      await service.register(registerData);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password_hash: 'hashed-password',
          name: 'Test User',
          phone: '+79991234567',
          auth_provider: 'email',
          calculations_limit: 5,
        },
      });
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        name: 'Test User',
        phone: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await service.login(loginData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123' },
        'test-secret',
        { expiresIn: '7d' }
      );
      expect(result).toEqual({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          phone: null,
        },
        token: 'mock-token',
      });
    });

    it('should throw error if user not found', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginData)).rejects.toThrow('Invalid credentials');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error if password is incorrect', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        name: 'Test User',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginData)).rejects.toThrow('Invalid credentials');
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
});
