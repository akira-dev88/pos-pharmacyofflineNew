import db from '../connection';

export function up() {
  const cols = db.prepare("PRAGMA table_info(cart_items)").all() as any[];
  const hasColumn = cols.some((c) => c.name === 'unit_uuid');
  if (hasColumn) {
    console.log('Column unit_uuid already exists in cart_items, skipping');
    return;
  }

  db.exec(`
    ALTER TABLE cart_items
    ADD COLUMN unit_uuid TEXT;
  `);

  console.log('Added unit_uuid column to cart_items');
}