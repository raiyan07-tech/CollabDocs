import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateWebSocket } from '../src/websocket/wsAuth';
import { prisma } from '../src/lib/prisma';
import { signAccessToken } from '../src/lib/jwt';
import { IncomingMessage } from 'http';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    document: {
      findUnique: vi.fn(),
    },
  },
}));

describe('WebSocket Authentication & Authorization', () => {
  const userId = 'u-ws-user';
  const email = 'ws@example.com';
  const validToken = signAccessToken({ userId, email });
  const docId = 'doc-ws-test';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('24. should reject connection when token or document ID is missing', async () => {
    const mockReq = {
      url: '/ws',
      headers: { host: 'localhost:5000' },
    } as IncomingMessage;

    const result = await authenticateWebSocket(mockReq);
    expect(result).toBeNull();
  });

  it('25. should reject connection when token is invalid or malformed', async () => {
    const mockReq = {
      url: `/ws?token=invalid.jwt.token&doc=${docId}`,
      headers: { host: 'localhost:5000' },
    } as IncomingMessage;

    const result = await authenticateWebSocket(mockReq);
    expect(result).toBeNull();
  });

  it('26. should reject connection when user does not have permission on document', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: userId,
      email,
      name: 'WS User',
      avatarColor: '#4F46E5',
    });

    (prisma.document.findUnique as any).mockResolvedValue({
      id: docId,
      ownerId: 'someone-else',
      isPublic: false,
      permissions: [],
    });

    const mockReq = {
      url: `/ws?token=${validToken}&doc=${docId}`,
      headers: { host: 'localhost:5000' },
    } as IncomingMessage;

    const result = await authenticateWebSocket(mockReq);
    expect(result).toBeNull();
  });

  it('27. should authorize connection and return context for document owner', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: userId,
      email,
      name: 'WS User',
      avatarColor: '#4F46E5',
    });

    (prisma.document.findUnique as any).mockResolvedValue({
      id: docId,
      ownerId: userId,
      isPublic: false,
      permissions: [],
    });

    const mockReq = {
      url: `/ws?token=${validToken}&doc=${docId}`,
      headers: { host: 'localhost:5000' },
    } as IncomingMessage;

    const result = await authenticateWebSocket(mockReq);
    expect(result).not.toBeNull();
    expect(result?.userId).toBe(userId);
    expect(result?.role).toBe('OWNER');
    expect(result?.documentId).toBe(docId);
  });
});
