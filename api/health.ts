import type { IncomingMessage, ServerResponse } from 'http';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = 200;
  res.end(JSON.stringify({
    success: true,
    environment: "production",
    status: "ok",
    service: "MediVerse API",
    timestamp: new Date().toISOString()
  }));
}
