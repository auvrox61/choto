import pg from 'pg';
import { config } from './config.js';
import { newCode } from './code.js';

// Managed Postgres usually needs SSL: put ?sslmode=require in DATABASE_URL.
export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 10,
  connectionTimeoutMillis: 2000, // fail fast when the pool is exhausted
  statement_timeout: 3000,
});

pool.on('error', (err) =>
  console.error(JSON.stringify({ level: 'error', msg: 'pg pool error', err: err.message }))
);

export async function createLink(longUrl) {
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    const { rowCount } = await pool.query(
      'INSERT INTO links (code, long_url) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING',
      [code, longUrl]
    );
    if (rowCount === 1) return code;
  }
  throw new Error('could not generate a unique code');
}

export async function findLongUrl(code) {
  const { rows } = await pool.query('SELECT long_url FROM links WHERE code = $1', [code]);
  return rows[0]?.long_url ?? null;
}
