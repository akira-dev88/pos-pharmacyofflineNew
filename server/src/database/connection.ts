import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const APP_DB_NAME =
  process.env.APP_DB_NAME ||
  (process.env.APP_TYPE === 'hardware'
    ? 'pos_hardware.db'
    : 'pos_billing.db');

const getDbPath = (): string => {
  // Manual override
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }

  // =========================
  // PRODUCTION (installed app)
  // =========================
  if (process.env.NODE_ENV === 'production') {
    const userDataPath =
      process.env.USER_DATA_PATH || process.cwd();

    return path.join(
      userDataPath,
      'database',
      APP_DB_NAME
    );
  }

  // =========================
  // DEVELOPMENT
  // =========================
  return path.join(
    process.cwd(),
    'server',
    'database',
    APP_DB_NAME
  );
};

const dbPath = getDbPath();
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log('🗄️ DATABASE:', dbPath);

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;