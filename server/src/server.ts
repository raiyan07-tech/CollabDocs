import http from 'http';
import { app } from './app';
import { config } from './config/env';
import { setupWebSocketServer } from './websocket/wsServer';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

const server = http.createServer(app);

// Initialize real-time Yjs collaboration WebSocket engine
setupWebSocketServer(server);

server.listen(config.port, () => {
  logger.info(`CollabDocs Server listening on port ${config.port} (${config.nodeEnv})`);
  logger.info(`Swagger API Docs available at http://localhost:${config.port}/api/docs`);
  logger.info(`Health check available at http://localhost:${config.port}/health`);
  logger.info(`WebSocket server active on ws://localhost:${config.port}/ws`);
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP and WebSocket servers closed.');
    await prisma.$disconnect();
    logger.info('Database disconnected. Exiting process.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forcefully terminating process after 10s timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
