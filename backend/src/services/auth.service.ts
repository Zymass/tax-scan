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
        phone: data.phone
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

  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
  }
}
