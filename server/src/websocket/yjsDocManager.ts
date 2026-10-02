import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export interface ActiveDocSession {
  ydoc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  saveTimer: NodeJS.Timeout | null;
  conns: Set<unknown>;
  getYjsState: () => Uint8Array;
  getTextContent: () => string;
}

export class YjsDocManager {
  private static instance: YjsDocManager;
  private docs: Map<string, ActiveDocSession> = new Map();

  private constructor() {}

  public static getInstance(): YjsDocManager {
    if (!YjsDocManager.instance) {
      YjsDocManager.instance = new YjsDocManager();
    }
    return YjsDocManager.instance;
  }

  public async getOrCreateDoc(documentId: string): Promise<ActiveDocSession> {
    const existing = this.docs.get(documentId);
    if (existing) {
      return existing;
    }

    const ydoc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(ydoc);

    // Load initial content from PostgreSQL
    try {
      const docRecord = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (docRecord) {
        if (docRecord.yjsState && docRecord.yjsState.length > 0) {
          Y.applyUpdate(ydoc, new Uint8Array(docRecord.yjsState));
        } else if (docRecord.content) {
          const fragment = ydoc.getXmlFragment('prosemirror');
          if (fragment.length === 0) {
            const p = new Y.XmlElement('paragraph');
            p.insert(0, [new Y.XmlText(docRecord.content)]);
            fragment.insert(0, [p]);
          }
        }
      }
    } catch (err) {
      logger.error(`Error loading initial state for document ${documentId}:`, err);
    }

    const session: ActiveDocSession = {
      ydoc,
      awareness,
      saveTimer: null,
      conns: new Set(),
      getYjsState: () => Y.encodeStateAsUpdate(ydoc),
      getTextContent: () => {
        try {
          const fragment = ydoc.getXmlFragment('prosemirror');
          return fragment.toString();
        } catch {
          return '';
        }
      },
    };

    // Autosave listener: debounce persistence to database
    ydoc.on('update', () => {
      this.scheduleAutosave(documentId);
    });

    this.docs.set(documentId, session);
    return session;
  }

  public getActiveDoc(documentId: string): ActiveDocSession | undefined {
    return this.docs.get(documentId);
  }

  public scheduleAutosave(documentId: string): void {
    const session = this.docs.get(documentId);
    if (!session) return;

    if (session.saveTimer) {
      clearTimeout(session.saveTimer);
    }

    session.saveTimer = setTimeout(async () => {
      await this.saveDocumentToDb(documentId);
    }, 2000); // 2-second debounce
  }

  public async saveDocumentToDb(documentId: string): Promise<void> {
    const session = this.docs.get(documentId);
    if (!session) return;

    try {
      const state = Y.encodeStateAsUpdate(session.ydoc);
      const content = session.getTextContent();

      await prisma.document.update({
        where: { id: documentId },
        data: {
          yjsState: Buffer.from(state),
          content: content || 'Document content',
        },
      });

      logger.info(`Persisted document ${documentId} state to database (${state.length} bytes)`);
    } catch (error) {
      logger.error(`Failed to persist document ${documentId} to database:`, error);
    }
  }

  public applyRestoredState(documentId: string, state: Uint8Array): void {
    const session = this.docs.get(documentId);
    if (session) {
      Y.applyUpdate(session.ydoc, state);
    }
  }

  public async removeConnection(documentId: string, conn: unknown): Promise<void> {
    const session = this.docs.get(documentId);
    if (!session) return;

    session.conns.delete(conn);

    if (session.conns.size === 0) {
      // Flush any pending save immediately
      if (session.saveTimer) {
        clearTimeout(session.saveTimer);
        session.saveTimer = null;
      }
      await this.saveDocumentToDb(documentId);
      session.ydoc.destroy();
      session.awareness.destroy();
      this.docs.delete(documentId);
      logger.info(`Cleaned up inactive Yjs session for document ${documentId}`);
    }
  }
}

export const getYjsDocManager = (): YjsDocManager => YjsDocManager.getInstance();
