import db from '../connection';

export function up() {
  const cols = db.prepare("PRAGMA table_info(purchase_items)").all() as any[];
  const hasColumn = cols.some((c) => c.name === 'unit_uuid');
  if (hasColumn) {
    console.log('Column unit_uuid already exists in purchase_items, skipping');
    return;
  }

  db.exec(`
    ALTER TABLE purchase_items
    ADD COLUMN unit_uuid TEXT;
  `);

  console.log('Added unit_uuid column to purchase_items');
}