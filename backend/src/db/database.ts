import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export interface DatabaseContext {
  db: DatabaseSync;
  close: () => void;
}

export function initializeDatabase(dbPath = process.env.DATABASE_PATH || ':memory:'): DatabaseSync {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);

  if (dbPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      category TEXT NOT NULL,
      urgency TEXT NOT NULL,
      priority TEXT,
      ai_analysis TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
    CREATE INDEX IF NOT EXISTS idx_issues_urgency ON issues(urgency);
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);
  `);

  // Ensure priority column exists if database was created prior to this schema change
  try {
    const tableInfo = db.prepare("PRAGMA table_info(issues)").all() as { name: string }[];
    const hasPriority = tableInfo.some((col) => col.name === 'priority');
    if (!hasPriority && tableInfo.length > 0) {
      db.exec('ALTER TABLE issues ADD COLUMN priority TEXT;');
    }
    db.exec('CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);');
  } catch {
    // Column already exists or error checking pragma
  }

  return db;
}
