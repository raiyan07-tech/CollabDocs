import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { authenticateWebSocket, WsAuthContext } from './wsAuth';
import { getYjsDocManager } from './yjsDocManager';
import { logger } from '../lib/logger';

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

export interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
  authContext?: WsAuthContext;
}

export const setupWebSocketServer = (httpServer: HttpServer): WebSocketServer => {
  const wss = new WebSocketServer({ noServer: true });
  const docManager = getYjsDocManager();

  httpServer.on('upgrade', async (request, socket, head) => {
    // Only handle WebSocket requests on path starting with /ws or root ws
    const pathname = request.url ? new URL(request.url, 'http://localhost').pathname : '';
    if (!pathname.startsWith('/ws')) {
      socket.destroy();
      return;
    }

    try {
      const auth = await authenticateWebSocket(request);
      if (!auth) {
        logger.warn('WebSocket upgrade rejected: unauthorized or invalid document access');
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        const extWs = ws as ExtWebSocket;
        extWs.authContext = auth;
        extWs.isAlive = true;
        wss.emit('connection', extWs, request);
      });
    } catch (err) {
      logger.error('Error handling WebSocket upgrade:', err);
      socket.destroy();
    }
  });

  // Heartbeat to purge dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      const extWs = client as ExtWebSocket;
      if (!extWs.isAlive) {
        extWs.terminate();
        return;
      }
      extWs.isAlive = false;
      extWs.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  wss.on('connection', async (ws: ExtWebSocket) => {
    const auth = ws.authContext;
    if (!auth) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    const { documentId, role, name, avatarColor, userId } = auth;
    logger.info(`User ${name} (${role}) connected to document ${documentId}`);

    const session = await docManager.getOrCreateDoc(documentId);
    session.conns.add(ws);

    // Set initial awareness state for this user
    session.awareness.setLocalStateField('user', {
      name,
      color: avatarColor,
      id: userId,
      role,
    });

    // Helper to send encoded message
    const send = (message: Uint8Array) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message, { binary: true });
      }
    };

    // Broadcast message to other connections in the same document room
    const broadcastToRoom = (message: Uint8Array, excludeSender = true) => {
      session.conns.forEach((conn) => {
        const otherWs = conn as WebSocket;
        if (otherWs.readyState === WebSocket.OPEN && (!excludeSender || otherWs !== ws)) {
          otherWs.send(message, { binary: true });
        }
      });
    };

    // 1. Send sync step 1: server asks client what state it has, and provides server state
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(encoder, session.ydoc);
    send(encoding.toUint8Array(encoder));

    // 2. Send current awareness states to client
    const awarenessStates = session.awareness.getStates();
    if (awarenessStates.size > 0) {
      const awarenessEncoder = encoding.createEncoder();
      encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        awarenessEncoder,
        awarenessProtocol.encodeAwarenessUpdate(
          session.awareness,
          Array.from(awarenessStates.keys())
        )
      );
      send(encoding.toUint8Array(awarenessEncoder));
    }

    // Handle document updates from other sources (e.g. concurrent edits or restores)
    const docUpdateHandler = (update: Uint8Array, origin: unknown) => {
      if (origin !== ws) {
        const updateEncoder = encoding.createEncoder();
        encoding.writeVarUint(updateEncoder, MESSAGE_SYNC);
        syncProtocol.writeUpdate(updateEncoder, update);
        send(encoding.toUint8Array(updateEncoder));
      }
    };
    session.ydoc.on('update', docUpdateHandler);

    // Handle awareness updates
    const awarenessChangeHandler = ({
      added,
      updated,
      removed,
    }: {
      added: number[];
      updated: number[];
      removed: number[];
    }) => {
      const changedClients = added.concat(updated, removed);
      const updateEncoder = encoding.createEncoder();
      encoding.writeVarUint(updateEncoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        updateEncoder,
        awarenessProtocol.encodeAwarenessUpdate(session.awareness, changedClients)
      );
      broadcastToRoom(encoding.toUint8Array(updateEncoder), false);
    };
    session.awareness.on('update', awarenessChangeHandler);

    // Handle incoming client messages
    ws.on('message', (message: ArrayBuffer | Buffer) => {
      try {
        const uint8Msg = new Uint8Array(message);
        const decoder = decoding.createDecoder(uint8Msg);
        const messageType = decoding.readVarUint(decoder);

        switch (messageType) {
          case MESSAGE_SYNC: {
            const syncMessageType = decoding.readVarUint(decoder);

            if (syncMessageType === syncProtocol.messageYjsSyncStep1) {
              // Client sent syncStep1, respond with syncStep2
              const replyEncoder = encoding.createEncoder();
              encoding.writeVarUint(replyEncoder, MESSAGE_SYNC);
              syncProtocol.writeSyncStep2(replyEncoder, session.ydoc, uint8Msg);
              send(encoding.toUint8Array(replyEncoder));
            } else if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
              // Initial sync payload from client: only accept if user is authorized to edit
              if (role === 'VIEWER') {
                logger.warn(`Rejected syncStep2 edit update from VIEWER user ${userId}`);
                return;
              }
              syncProtocol.readSyncStep2(decoder, session.ydoc, ws);
            } else if (syncMessageType === syncProtocol.messageYjsUpdate) {
              // Real-time update message
              if (role === 'VIEWER') {
                logger.warn(`Rejected real-time edit update from VIEWER user ${userId}`);
                return;
              }
              const update = decoding.readVarUint8Array(decoder);
              Y.applyUpdate(session.ydoc, update, ws);
              // Broadcast update to other peers
              broadcastToRoom(uint8Msg, true);
            }
            break;
          }

          case MESSAGE_AWARENESS: {
            const update = decoding.readVarUint8Array(decoder);
            awarenessProtocol.applyAwarenessUpdate(session.awareness, update, ws);
            break;
          }

          default:
            logger.warn(`Unknown WebSocket message type: ${messageType}`);
        }
      } catch (err) {
        logger.error('Error processing WebSocket message:', err);
      }
    });

    ws.on('close', async () => {
      logger.info(`User ${name} disconnected from document ${documentId}`);
      session.ydoc.off('update', docUpdateHandler);
      session.awareness.off('update', awarenessChangeHandler);
      await docManager.removeConnection(documentId, ws);
    });

    ws.on('error', (err) => {
      logger.error(`WebSocket error for user ${name}:`, err);
    });
  });

  return wss;
};
