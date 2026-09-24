import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase, Collections } from './src/server/db.js';
import authRoutes from './src/server/routes/authRoutes.js';
import weatherRoutes from './src/server/routes/weatherRoutes.js';
import aiRoutes from './src/server/routes/aiRoutes.js';
import userRoutes from './src/server/routes/userRoutes.js';
import adminRoutes from './src/server/routes/adminRoutes.js';
import testRoutes from './src/server/routes/testRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await initDatabase();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Security & standard middlewares
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Basic security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // API Telemetry Logger & Rate Limiter tracker
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      if (req.path.startsWith('/api/')) {
        const responseTimeMs = Date.now() - start;
        const isFallback =
          req.query.fallback === 'true' ||
          Collections.Settings.get().fallbackModeForceEnabled;

        Collections.APIUsageLogs.log({
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          responseTimeMs,
          userId: (req as any).user?.id,
          ip: req.ip || req.socket.remoteAddress || '127.0.0.1',
          isFallback,
        });
      }
    });
    next();
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/weather', weatherRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/test', testRoutes);

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'AI WeatherWise API',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    });
  });

  // Frontend integration: Vite middleware in development, static files in production
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('⚡ Vite development middleware mounted');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      console.log('📦 Serving production build from /dist');
    } else {
      console.warn('⚠️ /dist folder not found. Please run "npm run build" first.');
    }
  }

  // Centralized Error Handling Middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌤️ AI WeatherWise API Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
