const num = (v, d) => (v === undefined || v === '' ? d : Number(v));

const port = num(process.env.PORT, 3000);
// Render provides RENDER_EXTERNAL_URL automatically.
const baseUrl = (process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`).replace(/\/$/, '');

export const config = {
  port,
  baseUrl,
  ownHost: new URL(baseUrl).hostname,
  databaseUrl: process.env.DATABASE_URL,
  trustProxy: num(process.env.TRUST_PROXY, 1),
  cacheMax: num(process.env.CACHE_MAX, 50000),
  cacheTtlMs: num(process.env.CACHE_TTL_MS, 300000),
};

if (!config.databaseUrl) throw new Error('DATABASE_URL is required');
