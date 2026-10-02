import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';
import fs from 'fs';

export const setupSwagger = (app: Express): void => {
  try {
    const swaggerPath = path.resolve(__dirname, '../../../docs/swagger.json');
    if (fs.existsSync(swaggerPath)) {
      const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf-8'));
      app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        customSiteTitle: 'CollabDocs API Documentation',
        customCss: '.swagger-ui .topbar { display: none }',
      }));
    } else {
      console.warn('Swagger documentation file not found at:', swaggerPath);
    }
  } catch (error) {
    console.error('Error setting up Swagger documentation:', error);
  }
};
