import fs from 'node:fs';
import path from 'node:path';
import { buildApp } from './app.js';

// Auto-load .env if present
const envFiles = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
];
for (const envFile of envFiles) {
  if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(envFile);
      break;
    } catch {
      // ignore
    }
  }
}

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DB_PATH = process.env.DATABASE_PATH || './data/smartflow.db';
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.DEBUG === 'true' ? 'debug' : 'info');

async function start() {
  const app = await buildApp({
    logger: { level: LOG_LEVEL },
    dbPath: DB_PATH,
  });

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`SmartFlow Backend running on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const signals = ['SIGINT', 'SIGTERM'] as const;
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, closing server gracefully...`);
      await app.close();
      process.exit(0);
    });
  }
}

start();
