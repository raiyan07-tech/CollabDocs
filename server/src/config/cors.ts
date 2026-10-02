import { CorsOptions } from 'cors';
import { config } from './env';

const allowedOrigins: (string | RegExp)[] = [
  config.clientUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  // Allow Vercel preview deployments if relevant
  /\.vercel\.app$/,
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests or matching origins
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((allowed) => {
      if (typeof allowed === 'string') return allowed === origin;
      if (allowed instanceof RegExp) return allowed.test(origin);
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS error: Origin ${origin} not permitted`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
};
