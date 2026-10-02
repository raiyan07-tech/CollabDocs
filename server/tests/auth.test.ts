import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { signAccessToken } from '../src/lib/jwt';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('1. should register a new user successfully with valid inputs', async () => {
      const mockUser = {
        id: 'u-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarColor: '#4F46E5',
        createdAt: new Date().toISOString(),
      };

      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockResolvedValue(mockUser);
      (prisma.refreshToken.create as any).mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('2. should reject signup if email is already in use', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'existing-id',
        email: 'duplicate@example.com',
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'Password123!',
          name: 'Duplicate User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already exists');
    });

    it('3. should reject signup with invalid email or short password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'not-an-email',
          password: '123', // less than 6 chars
          name: 'U', // less than 2 chars
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('4. should login successfully with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('Secret123', 10);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'u-456',
        email: 'login@example.com',
        passwordHash: hashedPassword,
        name: 'Login User',
        avatarColor: '#10B981',
        createdAt: new Date(),
      });
      (prisma.refreshToken.create as any).mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Secret123',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('login@example.com');
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('5. should reject login with incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('RealPassword', 10);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'u-456',
        email: 'login@example.com',
        passwordHash: hashedPassword,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid email or password');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('6. should issue a new token pair when provided a valid refresh token', async () => {
      const { signRefreshToken } = await import('../src/lib/jwt');
      const validRefreshToken = signRefreshToken({ userId: 'u-789' });

      (prisma.refreshToken.findUnique as any).mockResolvedValue({
        id: 'rt-1',
        token: validRefreshToken,
        userId: 'u-789',
        expiresAt: new Date(Date.now() + 1000000),
        revokedAt: null,
        user: { id: 'u-789', email: 'refresh@example.com' },
      });
      (prisma.refreshToken.update as any).mockResolvedValue({});
      (prisma.refreshToken.create as any).mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('7. should reject an invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'completely.invalid.token' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('8. should return user profile when authenticated with valid token', async () => {
      const token = signAccessToken({ userId: 'u-me', email: 'me@example.com' });
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'u-me',
        email: 'me@example.com',
        name: 'Me User',
        avatarColor: '#3B82F6',
        createdAt: new Date(),
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('u-me');
      expect(response.body.email).toBe('me@example.com');
    });

    it('9. should return 401 when Authorization header is missing', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Missing Bearer token');
    });
  });
});
