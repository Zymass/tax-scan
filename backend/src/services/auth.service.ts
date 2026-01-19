import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  async register(data: RegisterData) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password_hash: passwordHash,
        name: data.name,
        phone: data.phone,
        auth_provider: 'email',
        calculations_limit: 5 // Начальный лимит расчетов
      }
    });

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone
      },
      token
    };
  }

  async login(data: LoginData) {
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is OAuth-only user
    if (user.auth_provider === 'google' && !user.password_hash) {
      throw new Error('This account uses Google sign-in. Please use Google to sign in.');
    }

    if (!user.password_hash) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.password_hash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone
      },
      token
    };
  }

  async findOrCreateGoogleUser(profile: {
    id: string;
    emails: Array<{ value: string; verified?: boolean }>;
    displayName: string;
    photos?: Array<{ value: string }>;
  }) {
    const email = profile.emails[0]?.value;
    if (!email) {
      throw new Error('No email provided by Google');
    }

    // Check if user exists by Google ID
    let user = await prisma.user.findUnique({
      where: { google_id: profile.id }
    });

    if (user) {
      // Update email verification if needed
      if (!user.email_verified && profile.emails[0]?.verified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            email_verified: true,
            email_verified_at: new Date()
          }
        });
      }
    } else {
      // Check if user exists by email
      user = await prisma.user.findUnique({
        where: { email }
      });

      if (user) {
        // Link Google account to existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            google_id: profile.id,
            auth_provider: 'google',
            email_verified: profile.emails[0]?.verified || true,
            email_verified_at: profile.emails[0]?.verified ? new Date() : undefined
          }
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email,
            name: profile.displayName,
            google_id: profile.id,
            auth_provider: 'google',
            email_verified: profile.emails[0]?.verified || true,
            email_verified_at: profile.emails[0]?.verified ? new Date() : undefined,
            calculations_limit: 5 // Начальный лимит расчетов
          }
        });
      }
    }

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone
      },
      token
    };
  }

  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        calculations: {
          where: { deleted_at: null }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Устанавливаем лимит по умолчанию для существующих пользователей
    let calculationsLimit = user.calculations_limit;
    if (!calculationsLimit || calculationsLimit === 0) {
      calculationsLimit = 5;
      // Обновляем в БД для будущих запросов
      await prisma.user.update({
        where: { id: userId },
        data: { calculations_limit: 5 }
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      calculations_limit: calculationsLimit,
      calculations_count: user.calculations.length,
      available_calculations: Math.max(0, calculationsLimit - user.calculations.length)
    };
  }

  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
  }
}
