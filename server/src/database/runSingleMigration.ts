// server/src/database/runSingleMigration.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Force the correct database path to match your connection.ts
// This should be the SAME path your server uses
const dbPath = path.join(process.cwd(), '..', '..', 'database', 'pharmacy.db');

console.log(`Target database: ${dbPath}`);

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function runUnitUuidMigration() {
  console.log('Adding columns to cart_items...');
  
  try {
    // Check if cart_items table exists
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cart_items'").get();
    
    if (!tables) {
      console.log('❌ cart_items table does not exist!');
      console.log('The database exists but tables are not created yet.');
      console.log('Please start the server normally first to create tables,');
      console.log('then stop it and run this script again.');
      return;
    }
    
    // Get current columns
    const columns = db.prepare("PRAGMA table_info(cart_items)").all() as any[];
    console.log('Current columns:', columns.map(c => c.name));
    
    const hasUnitUuid = columns.some(col => col.name === 'unit_uuid');
    
    if (!hasUnitUuid) {
      db.exec(`ALTER TABLE cart_items ADD COLUMN unit_uuid TEXT;`);
      console.log('✅ Added unit_uuid column to cart_items');
    } else {
      console.log('ℹ️ unit_uuid column already exists');
    }
    
    const hasBatchUuid = columns.some(col => col.name === 'batch_uuid');
    if (!hasBatchUuid) {
      db.exec(`ALTER TABLE cart_items ADD COLUMN batch_uuid TEXT;`);
      console.log('✅ Added batch_uuid column to cart_items');
    } else {
      console.log('ℹ️ batch_uuid column already exists');
    }
    
    // Add indexes
    db.exec(`CREATE INDEX IF NOT EXISTS idx_cart_items_unit ON cart_items(unit_uuid);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_cart_items_batch ON cart_items(batch_uuid);`);
    
    console.log('✅ Migration completed!');
    
    // Verify
    const updatedColumns = db.prepare("PRAGMA table_info(cart_items)").all() as any[];
    console.log('Updated columns:', updatedColumns.map(c => c.name));
    
  } catch (error) {
    console.error('Migration error:', error);
  }
}

runUnitUuidMigration();