import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/collabdocs?schema=public',
  directUrl: process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/collabdocs?schema=public',
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_development_secret_collabdocs_access_key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_development_secret_collabdocs_refresh_key',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
