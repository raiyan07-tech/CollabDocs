import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { getYjsDocManager } from '../websocket/yjsDocManager';

export const createVersionSchema = z.object({
  title: z.string().trim().optional(),
});

export const listVersions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const documentId = req.params.id;

    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarColor: true,
          },
        },
      },
      orderBy: { versionNumber: 'desc' },
    });

    res.status(200).json(versions);
  } catch (error) {
    next(error);
  }
};

export const createVersion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const documentId = req.params.id;
    const userId = req.user!.userId;
    const { title } = req.body;

    const doc = req.document!;

    // Get current Yjs state in memory if active, or use DB doc
    const manager = getYjsDocManager();
    const activeDoc = manager.getActiveDoc(documentId);

    let currentContent = doc.content;
    let currentYjsState = doc.yjsState;

    if (activeDoc) {
      const state = activeDoc.getYjsState();
      if (state) currentYjsState = Buffer.from(state);
      const text = activeDoc.getTextContent();
      if (text) currentContent = text;
    }

    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;
    const versionTitle = title || `Version ${nextVersionNumber}`;

    const version = await prisma.documentVersion.create({
      data: {
        documentId,
        versionNumber: nextVersionNumber,
        title: versionTitle,
        content: currentContent,
        yjsState: currentYjsState,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarColor: true,
          },
        },
      },
    });

    res.status(201).json(version);
  } catch (error) {
    next(error);
  }
};

export const restoreVersion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const documentId = req.params.id;
    const versionId = req.params.versionId;
    const userId = req.user!.userId;

    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.documentId !== documentId) {
      res.status(404).json({ error: 'Version not found for this document' });
      return;
    }

    // Update document in database
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        content: version.content,
        yjsState: version.yjsState,
      },
    });

    // Notify active Yjs doc manager to load restored state
    const manager = getYjsDocManager();
    if (version.yjsState) {
      manager.applyRestoredState(documentId, new Uint8Array(version.yjsState));
    }

    // Create an automatic checkpoint documenting the restoration
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;
    await prisma.documentVersion.create({
      data: {
        documentId,
        versionNumber: nextVersionNumber,
        title: `Restored to: ${version.title} (v${version.versionNumber})`,
        content: version.content,
        yjsState: version.yjsState,
        createdById: userId,
      },
    });

    res.status(200).json({
      message: 'Document restored successfully',
      document: updatedDocument,
    });
  } catch (error) {
    next(error);
  }
};
