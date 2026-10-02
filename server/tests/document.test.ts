import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { signAccessToken } from '../src/lib/jwt';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    document: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    documentPermission: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Document API Endpoints', () => {
  const userId = 'u-owner-123';
  const token = signAccessToken({ userId, email: 'owner@example.com' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/documents', () => {
    it('10. should create a new document with owner assignment', async () => {
      const mockCreated = {
        id: 'doc-123',
        title: 'Project Roadmap',
        content: '',
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: {
          id: userId,
          name: 'Owner Name',
          email: 'owner@example.com',
          avatarColor: '#4F46E5',
        },
      };

      (prisma.document.create as any).mockResolvedValue(mockCreated);

      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Project Roadmap' });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('doc-123');
      expect(response.body.title).toBe('Project Roadmap');
      expect(response.body.role).toBe('OWNER');
    });
  });

  describe('GET /api/documents', () => {
    it('11. should list all documents accessible to the user', async () => {
      const mockDocs = [
        {
          id: 'doc-1',
          title: 'Doc One',
          content: 'Hello',
          ownerId: userId,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: { id: userId, name: 'Owner', email: 'owner@example.com', avatarColor: '#4F46E5' },
          permissions: [],
        },
      ];

      (prisma.document.findMany as any).mockResolvedValue(mockDocs);

      const response = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].role).toBe('OWNER');
    });
  });

  describe('GET /api/documents/:id', () => {
    it('12. should retrieve document by ID when user has access', async () => {
      const mockDoc = {
        id: 'doc-123',
        title: 'Doc Title',
        content: 'Content',
        ownerId: userId,
        isPublic: false,
        permissions: [],
        owner: { id: userId, name: 'Owner', email: 'owner@example.com', avatarColor: '#4F46E5' },
      };

      (prisma.document.findUnique as any).mockResolvedValue(mockDoc);

      const response = await request(app)
        .get('/api/documents/doc-123')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('doc-123');
      expect(response.body.role).toBe('OWNER');
    });

    it('13. should return 404 for non-existent document', async () => {
      (prisma.document.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/documents/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('PATCH /api/documents/:id', () => {
    it('14. should update document title by editor or owner', async () => {
      const existingDoc = {
        id: 'doc-123',
        title: 'Old Title',
        ownerId: userId,
        permissions: [],
      };

      const updatedDoc = {
        ...existingDoc,
        title: 'New Title',
        owner: { id: userId, name: 'Owner', email: 'owner@example.com', avatarColor: '#4F46E5' },
      };

      (prisma.document.findUnique as any).mockResolvedValue(existingDoc);
      (prisma.document.update as any).mockResolvedValue(updatedDoc);

      const response = await request(app)
        .patch('/api/documents/doc-123')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'New Title' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('New Title');
    });
  });

  describe('DELETE /api/documents/:id', () => {
    it('15. should allow owner to delete document', async () => {
      const existingDoc = {
        id: 'doc-123',
        ownerId: userId,
        permissions: [],
      };

      (prisma.document.findUnique as any).mockResolvedValue(existingDoc);
      (prisma.document.delete as any).mockResolvedValue(existingDoc);

      const response = await request(app)
        .delete('/api/documents/doc-123')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('16. should forbid document deletion by non-owner', async () => {
      const otherUserToken = signAccessToken({ userId: 'other-user', email: 'other@example.com' });
      const existingDoc = {
        id: 'doc-123',
        ownerId: userId, // owned by userId, not other-user
        permissions: [{ role: 'EDITOR' }],
      };

      (prisma.document.findUnique as any).mockResolvedValue(existingDoc);

      const response = await request(app)
        .delete('/api/documents/doc-123')
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
    });
  });
});
