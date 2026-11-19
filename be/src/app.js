import express from 'express';
import cors from 'cors';
import { shopRouter } from './routes/shopRoutes.js';

/** Builds the Express application with JSON parsing, CORS, and MongoDB-backed routes. */
export function createApp() {
  const app = express();
  const originEnv = process.env.CORS_ORIGIN || 'http://localhost:4200';
  const allowedOrigins = originEnv.split(',').map((s) => s.trim()).filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, true);
      },
    })
  );

  app.use(express.json());
  app.get('/', (_req, res) => {
    res.json({
      service: 'FLEURÉ Flower Boutique API',
      status: 'ok',
      health: '/api/health',
      endpoints: ['/api/home', '/api/categories', '/api/products', '/api/posts', '/api/experiences', '/api/orders'],
    });
  });
  app.use('/api', shopRouter);

  app.use((err, _req, res, _next) => {
    console.error('API Error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi xử lý dữ liệu MongoDB.' });
  });

  return app;
}
