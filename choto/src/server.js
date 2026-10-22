import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { pool } from './db.js';
import { cache } from './cacheInstance.js';
import { rateLimit } from './middleware/rateLimit.js';
import { linksRouter } from './routes/links.js';
import { redirectRouter } from './routes/redirect.js';

const app = express();
app.set('trust proxy', config.trustProxy);
app.disable('x-powered-by');

// Security headers + one JSON log line per request. Never log the long URL.
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        method: req.method,
        route: req.route?.path ?? 'other',
        status: res.statusCode,
        ms: Number(process.hrtime.bigint() - start) / 1e6,
        cache: { hits: cache.hits, misses: cache.misses, size: cache.size },
      })
    );
  });
  next();
});

// Must come before the redirect route: "healthz" is 7 characters, like a code.
app.get('/healthz', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

app.use(
  '/api/v1/links',
  rateLimit({ windowMs: 60_000, max: 10 }),
  express.json({ limit: '4kb' }),
  linksRouter
);

app.use(redirectRouter); // before static: skips a filesystem lookup on the hot path

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '../web/dist');
app.use(express.static(dist, { maxAge: '1h' }));

app.use((req, res) => res.status(404).type('text/plain').send('Not found'));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status && err.status < 500 ? err.status : 500;
  if (status === 500) console.error(JSON.stringify({ level: 'error', msg: err.message }));
  res.status(status).json({
    error: {
      code: status === 500 ? 'INTERNAL' : 'BAD_REQUEST',
      message: status === 500 ? 'Something went wrong. Try again.' : 'Invalid request.',
    },
  });
});

const server = app.listen(config.port, () =>
  console.log(JSON.stringify({ level: 'info', msg: `choto listening on ${config.port}` }))
);

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
