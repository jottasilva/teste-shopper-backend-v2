import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve(__dirname, '../../data');
const dbPath = path.join(dbDir, 'database.sqlite');

let db: Database;

export async function getDatabase() {
  if (!db) {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
  }
  
  return db;
}

export async function initializeDatabase() {
  const db = await getDatabase();
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS measures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      measure_uuid TEXT NOT NULL UNIQUE,
      customer_code TEXT NOT NULL,
      measure_datetime TEXT NOT NULL,
      measure_type TEXT NOT NULL,
      measure_value INTEGER,
      confirmed_value INTEGER,
      image_path TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  return db;
}