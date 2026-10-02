import { IncomingMessage } from 'http';
import { URL } from 'url';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { RoleType } from '../middleware/role.middleware';

export interface WsAuthContext {
  userId: string;
  email: string;
  name: string;
  avatarColor: string;
  role: RoleType;
  documentId: string;
}

export const authenticateWebSocket = async (
  req: IncomingMessage
): Promise<WsAuthContext | null> => {
  try {
    const host = req.headers.host || 'localhost';
    const parsedUrl = new URL(req.url || '', `http://${host}`);
    
    // Support token in query string (?token=...&doc=...) or Authorization header
    const token =
      parsedUrl.searchParams.get('token') ||
      req.headers.authorization?.replace('Bearer ', '');
    const documentId =
      parsedUrl.searchParams.get('doc') ||
      parsedUrl.pathname.split('/').filter(Boolean).pop();

    if (!token || !documentId) {
      return null;
    }

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarColor: true,
      },
    });

    if (!user) return null;

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        permissions: {
          where: { userId: user.id },
        },
      },
    });

    if (!doc) return null;

    let role: RoleType | null = null;
    if (doc.ownerId === user.id) {
      role = 'OWNER';
    } else if (doc.permissions.length > 0) {
      role = doc.permissions[0].role as RoleType;
    } else if (doc.isPublic) {
      role = 'VIEWER';
    }

    if (!role) return null;

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      avatarColor: user.avatarColor,
      role,
      documentId,
    };
  } catch {
    return null;
  }
};
