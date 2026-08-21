import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app.js';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = createApp();

  // Vite middleware for development vs Static files in Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    // Aggressively cache immutable hashed assets (JS/CSS in /assets/) for 1 year
    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      maxAge: '1y',
      immutable: true,
      index: false,
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }));

    // Serve other static assets with tailored caching
    app.use(express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else if (filePath.endsWith('.xml') || filePath.endsWith('.txt')) {
          res.setHeader('Cache-Control', 'public, max-age=86400');
        } else if (filePath.endsWith('.mp4')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));

    app.get('*', (req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MediVerse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server start error:', err);
  process.exit(1);
});
