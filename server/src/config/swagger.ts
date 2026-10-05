import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';
import fs from 'fs';

export const setupSwagger = (app: Express): void => {
  try {
    const candidatePaths = [
      path.resolve(__dirname, '../swagger.json'),
      path.resolve(__dirname, '../../swagger.json'),
      path.resolve(process.cwd(), 'swagger.json'),
      path.resolve(process.cwd(), 'src/swagger.json'),
      path.resolve(__dirname, '../../../docs/swagger.json'),
    ];
    const swaggerPath = candidatePaths.find((p) => fs.existsSync(p));
    if (swaggerPath) {
      const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf-8'));
      app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        customSiteTitle: 'CollabDocs API Documentation',
        customCss: '.swagger-ui .topbar { display: none }',
      }));
    } else {
      console.warn('Swagger documentation file not found in candidates:', candidatePaths);
    }
  } catch (error) {
    console.error('Error setting up Swagger documentation:', error);
  }
};
