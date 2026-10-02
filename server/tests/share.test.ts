import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { signAccessToken } from '../src/lib/jwt';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    document: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    documentPermission: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe('Document Sharing API Endpoints', () => {
  const ownerId = 'u-owner';
  const ownerToken = signAccessToken({ userId: ownerId, email: 'owner@example.com' });
  const docId = 'doc-share-test';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/documents/:id/share', () => {
    it('17. should list all collaborators including owner', async () => {
      const mockDoc = {
        id: docId,
        ownerId,
        permissions: [],
        owner: { id: ownerId, name: 'Owner', email: 'owner@example.com', avatarColor: '#4F46E5' },
      };

      (prisma.document.findUnique as any).mockResolvedValue(mockDoc);

      const response = await request(app)
        .get(`/api/documents/${docId}/share`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].isOwner).toBe(true);
    });
  });

  describe('POST /api/documents/:id/share', () => {
    it('18. should share document with another user by email as EDITOR', async () => {
      const mockDoc = {
        id: docId,
        ownerId,
        permissions: [],
      };

      const targetUser = {
        id: 'u-collab',
        email: 'collab@example.com',
        name: 'Collaborator',
        avatarColor: '#10B981',
      };

      (prisma.document.findUnique as any).mockResolvedValue(mockDoc);
      (prisma.user.findUnique as any).mockResolvedValue(targetUser);
      (prisma.documentPermission.upsert as any).mockResolvedValue({
        id: 'perm-1',
        documentId: docId,
        userId: targetUser.id,
        role: 'EDITOR',
        user: targetUser,
      });

      const response = await request(app)
        .post(`/api/documents/${docId}/share`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: 'collab@example.com', role: 'EDITOR' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Document shared with collab@example.com');
      expect(response.body.permission.role).toBe('EDITOR');
    });

    it('19. should return 404 when target user email does not exist', async () => {
      const mockDoc = {
        id: docId,
        ownerId,
        permissions: [],
      };

      (prisma.document.findUnique as any).mockResolvedValue(mockDoc);
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/documents/${docId}/share`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: 'nonexistent@example.com', role: 'VIEWER' });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('No user registered');
    });
  });

  describe('DELETE /api/documents/:id/share', () => {
    it('20. should allow owner to revoke collaborator permission', async () => {
      const mockDoc = {
        id: docId,
        ownerId,
        permissions: [],
      };

      (prisma.document.findUnique as any).mockResolvedValue(mockDoc);
      (prisma.documentPermission.deleteMany as any).mockResolvedValue({ count: 1 });

      const response = await request(app)
        .delete(`/api/documents/${docId}/share`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: '00000000-0000-0000-0000-000000000001' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('revoked successfully');
    });
  });
});
