import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function migrate() {
  const dbPath = path.resolve(process.cwd(), 'ptcgp_tracker.sqlite');
  console.log('Opening database at', dbPath);
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  console.log('Creating decks table if not exists...');
  await db.exec(`
    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      strategy TEXT,
      cards_json TEXT NOT NULL,
      is_saved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Migration successful!');
  await db.close();
}

migrate().catch(console.error);
