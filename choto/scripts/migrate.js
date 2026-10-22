import fs from 'node:fs/promises';
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

// Try auto-creating target database if it doesn't exist yet
try {
  const parsed = new URL(process.env.DATABASE_URL);
  const dbName = parsed.pathname.replace(/^\//, '');
  if (dbName && dbName !== 'postgres') {
    const adminUrl = new URL(process.env.DATABASE_URL);
    adminUrl.pathname = '/postgres';
    const adminClient = new pg.Client({ connectionString: adminUrl.toString() });
    try {
      await adminClient.connect();
      const check = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
      if (check.rowCount === 0) {
        console.log(`Database "${dbName}" not found. Creating database "${dbName}"...`);
        await adminClient.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
        console.log(`Database "${dbName}" created.`);
      }
    } catch {
      // If admin check fails, fall through to direct target connection
    } finally {
      await adminClient.end().catch(() => {});
    }
  }
} catch {
  // If URL parsing fails, continue to direct client
}

let client;
try {
  client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
} catch (err) {
  if (err.message && err.message.includes('client password must be a string')) {
    console.error('\n❌ PostgreSQL Authentication Error:');
    console.error('Your local PostgreSQL server requires password authentication.');
    console.error('Please update DATABASE_URL in your .env file with your PostgreSQL username and password:');
    console.error('  DATABASE_URL=postgres://<username>:<password>@localhost:5432/choto\n');
  } else {
    console.error('\n❌ Could not connect to database:', err.message, '\n');
  }
  process.exit(1);
}

await client.query(
  `CREATE TABLE IF NOT EXISTS schema_migrations (
     name TEXT PRIMARY KEY,
     applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`
);

const dir = new URL('../migrations/', import.meta.url);
const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.sql')).sort();

for (const f of files) {
  const done = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [f]);
  if (done.rowCount) continue;
  const sql = await fs.readFile(new URL(f, dir), 'utf8');
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [f]);
    await client.query('COMMIT');
    console.log('applied', f);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}
await client.end();
