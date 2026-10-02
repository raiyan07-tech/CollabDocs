import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { RoleType } from '../middleware/role.middleware';

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1).default('Untitled Document').optional(),
  content: z.string().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').optional(),
  isPublic: z.boolean().optional(),
});

export const listDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { permissions: { some: { userId } } },
        ],
      },
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
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const result = documents.map((doc) => {
      let role: RoleType = 'VIEWER';
      if (doc.ownerId === userId) {
        role = 'OWNER';
      } else if (doc.permissions.length > 0) {
        role = doc.permissions[0].role as RoleType;
      }

      return {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        ownerId: doc.ownerId,
        owner: doc.owner,
        isPublic: doc.isPublic,
        role,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const createDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { title = 'Untitled Document', content = '' } = req.body;

    const document = await prisma.document.create({
      data: {
        title,
        content,
        ownerId: userId,
        versions: {
          create: {
            versionNumber: 1,
            title,
            content,
            createdById: userId,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarColor: true,
          },
        },
      },
    });

    res.status(201).json({
      ...document,
      role: 'OWNER',
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const doc = req.document!;
    const userRole = req.userRole!;

    const documentWithDetails = await prisma.document.findUnique({
      where: { id: doc.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarColor: true,
          },
        },
      },
    });

    if (!documentWithDetails) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.status(200).json({
      ...documentWithDetails,
      role: userRole,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const docId = req.params.id;
    const { title, isPublic } = req.body;

    const updated = await prisma.document.update({
      where: { id: docId },
      data: {
        ...(title !== undefined && { title }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        owner: {
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
      ...updated,
      role: req.userRole,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const docId = req.params.id;
    const userId = req.user!.userId;
    const doc = req.document!;

    if (doc.ownerId !== userId) {
      res.status(403).json({ error: 'Only the document owner can delete this document' });
      return;
    }

    await prisma.document.delete({
      where: { id: docId },
    });

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};
