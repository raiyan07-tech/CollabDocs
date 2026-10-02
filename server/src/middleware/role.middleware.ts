import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { Role, Document } from '@prisma/client';

export type RoleType = 'OWNER' | 'EDITOR' | 'VIEWER';

declare global {
  namespace Express {
    interface Request {
      document?: Document;
      userRole?: RoleType;
    }
  }
}

const roleHierarchy: Record<RoleType, number> = {
  VIEWER: 1,
  EDITOR: 2,
  OWNER: 3,
};

export const requireDocumentRole = (minRole: RoleType) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const documentId = req.params.id;
      if (!documentId) {
        res.status(400).json({ error: 'Document ID parameter is required' });
        return;
      }

      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          permissions: {
            where: { userId },
          },
        },
      });

      if (!doc) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      let userRole: RoleType | null = null;

      if (doc.ownerId === userId) {
        userRole = 'OWNER';
      } else if (doc.permissions.length > 0) {
        userRole = doc.permissions[0].role as RoleType;
      } else if (doc.isPublic) {
        userRole = 'VIEWER';
      }

      if (!userRole) {
        res.status(403).json({ error: 'You do not have permission to access this document' });
        return;
      }

      if (roleHierarchy[userRole] < roleHierarchy[minRole]) {
        res.status(403).json({
          error: `Insufficient permissions. Required: ${minRole}, current role: ${userRole}`,
        });
        return;
      }

      req.document = doc;
      req.userRole = userRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};
