import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { signAccessToken } from '../src/lib/jwt';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    document: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    documentVersion: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('../src/websocket/yjsDocManager', () => ({
  getYjsDocManager: () => ({
    getActiveDoc: () => undefined,
    applyRestoredState: vi.fn(),
  }),
}));

describe('Document Version History API Endpoints', () => {
  const ownerId = 'u-owner-v';
  const ownerToken = signAccessToken({ userId: ownerId, email: 'owner@example.com' });
  const docId = 'doc-version-test';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/documents/:id/versions', () => {
    it('21. should list document versions ordered by version number', async () => {
      const mockDoc = { id: docId, ownerId, permissions: [] };
      const mockVersions = [
        {
          id: 'v-2',
          documentId: docId,
          versionNumber: 2,
          title: 'Final Draft',
          content: 'Updated content',
          createdAt: new Date(),
          createdBy: { id: ownerId, name: 'Owner', email: 'owner@example.com', avatarColor: '#4F46E5' },
        },
        {
          id: 'v-1',
          documentId: docId,
          versionNumber: 1,
          title: 'Initial Draft',
          content: 'First content',
          createdAt: new Date(),
          createdBy: { id: ownerId, name: 'Owner', email: 'owner@example.com', avatarColor: '#4F46E5' },
        },
      ];

      (prisma.document.findUnique as any).mockResolvedValue(mockDoc);
      (prisma.documentVersion.findMany as any).mockResolvedValue(mockVersions);

      const response = await request(app)
        .get(`/api/documents/${docId}/versions`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body[0].versionNumber).toBe(2);
    });
  });

  describe('POST /api/documents/:id/versions', () => {
    it('22. should create a manual version snapshot checkpoint', async () => {
      const mockDoc = { id: docId, ownerId, permissions: [], content: 'Snapshot text', yjsState: null };

      (prisma.document.findUnique as any).mockResolvedValue(mockDoc);
      (prisma.documentVersion.findFirst as any).mockResolvedValue({ versionNumber: 2 });
      (prisma.documentVersion.create as any).mockResolvedValue({
        id: 'v-3',
        documentId: docId,
        versionNumber: 3,
        title: 'Release Checkpoint',
        content: 'Snapshot text',
        createdById: ownerId,
        createdBy: { id: ownerId, name: 'Owner', email: 'owner@example.com', avatarColor: '#4F46E5' },
      });

      const response = await request(app)
        .post(`/api/documents/${docId}/versions`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ title: 'Release Checkpoint' });

      expect(response.status).toBe(201);
      expect(response.body.versionNumber).toBe(3);
      expect(response.body.title).toBe('Release Checkpoint');
    });
  });

  describe('POST /api/documents/:id/versions/:versionId/restore', () => {
    it('23. should restore document to prior version checkpoint', async () => {
      const mockDoc = { id: docId, ownerId, permissions: [] };
      const targetVersion = {
        id: 'v-1',
        documentId: docId,
        versionNumber: 1,
        title: 'Initial Draft',
        content: 'Original Content to Restore',
        yjsState: null,
      };

      (prisma.document.findUnique as any).mockResolvedValue(mockDoc);
      (prisma.documentVersion.findUnique as any).mockResolvedValue(targetVersion);
      (prisma.document.update as any).mockResolvedValue({
        ...mockDoc,
        content: targetVersion.content,
      });
      (prisma.documentVersion.findFirst as any).mockResolvedValue({ versionNumber: 3 });
      (prisma.documentVersion.create as any).mockResolvedValue({});

      const response = await request(app)
        .post(`/api/documents/${docId}/versions/v-1/restore`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('restored successfully');
      expect(response.body.document.content).toBe('Original Content to Restore');
    });
  });
});
