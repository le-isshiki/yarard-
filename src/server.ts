import http from 'node:http';
import { logger } from './logger.js';
import { getConfig } from './config.js';

export function startHealthServer(): http.Server {
  const cfg = getConfig();
  const server = http.createServer((req, res) => {
    if (req.url === '/healthz' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, service: 'theseus-yarard', ts: Date.now() }));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  server.listen(cfg.PORT, () => {
    logger.info({ port: cfg.PORT }, 'health server listening');
  });
  return server;
}
