import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

export const shareDocumentSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase().trim(),
  role: z.enum(['EDITOR', 'VIEWER']),
});

export const revokeShareSchema = z.object({
  userId: z.string().uuid('Valid user ID is required'),
});

export const listShares = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const documentId = req.params.id;

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarColor: true,
          },
        },
        permissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarColor: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const collaborators = [
      {
        id: `owner-${doc.owner.id}`,
        userId: doc.owner.id,
        user: doc.owner,
        role: 'OWNER',
        isOwner: true,
      },
      ...doc.permissions.map((p) => ({
        id: p.id,
        userId: p.userId,
        user: p.user,
        role: p.role,
        isOwner: false,
      })),
    ];

    res.status(200).json(collaborators);
  } catch (error) {
    next(error);
  }
};

export const shareDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const documentId = req.params.id;
    const currentUserId = req.user!.userId;
    const { email, role } = req.body;

    const doc = req.document!;
    if (doc.ownerId !== currentUserId) {
      res.status(403).json({ error: 'Only the document owner can manage collaborators' });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      res.status(404).json({ error: 'No user registered with this email address' });
      return;
    }

    if (targetUser.id === currentUserId) {
      res.status(400).json({ error: 'You cannot share a document with yourself (you are the owner)' });
      return;
    }

    const permission = await prisma.documentPermission.upsert({
      where: {
        documentId_userId: {
          documentId,
          userId: targetUser.id,
        },
      },
      update: {
        role: role as Role,
      },
      create: {
        documentId,
        userId: targetUser.id,
        role: role as Role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarColor: true,
          },
        },
      },
    });

    res.status(200).json({
      message: `Document shared with ${targetUser.email} as ${role}`,
      permission,
    });
  } catch (error) {
    next(error);
  }
};

export const revokeShare = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const documentId = req.params.id;
    const currentUserId = req.user!.userId;
    const { userId } = req.body;

    const doc = req.document!;
    if (doc.ownerId !== currentUserId) {
      res.status(403).json({ error: 'Only the document owner can revoke access' });
      return;
    }

    await prisma.documentPermission.deleteMany({
      where: {
        documentId,
        userId,
      },
    });

    res.status(200).json({ message: 'Access revoked successfully' });
  } catch (error) {
    next(error);
  }
};
