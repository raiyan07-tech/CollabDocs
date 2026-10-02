import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import fs from 'fs';

async function main() {
  const dataDir = path.resolve(__dirname, '../.postgres_data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const pg = new EmbeddedPostgres({
    port: 5432,
    user: 'postgres',
    password: 'postgrespassword',
    databaseDir: dataDir,
    persistent: true,
    onLog: (msg) => console.log('[Postgres]', msg),
    onError: (err) => console.error('[Postgres Error]', err),
  });

  console.log('Initializing local PostgreSQL instance...');
  try {
    await pg.initialise();
  } catch (err: any) {
    // If already initialized, proceed to start
    console.log('Cluster already initialized or ready.');
  }

  console.log('Starting PostgreSQL server on port 5432...');
  await pg.start();

  try {
    await pg.createDatabase('collabdocs');
    console.log('Database "collabdocs" created.');
  } catch {
    console.log('Database "collabdocs" already exists or ready.');
  }

  console.log('PostgreSQL running on localhost:5432 (database: collabdocs, user: postgres)');

  const shutdown = async () => {
    console.log('Stopping PostgreSQL...');
    await pg.stop();
    console.log('PostgreSQL stopped.');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start local PostgreSQL:', err);
  process.exit(1);
});
