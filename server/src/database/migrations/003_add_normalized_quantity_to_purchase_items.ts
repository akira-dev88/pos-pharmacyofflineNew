import db from '../connection';

export function up() {
  const cols = db.prepare("PRAGMA table_info(purchase_items)").all() as any[];
  const hasColumn = cols.some((c) => c.name === 'normalized_quantity');
  if (hasColumn) {
    console.log('Column normalized_quantity already exists in purchase_items, skipping');
    return;
  }

  db.exec(`
    ALTER TABLE purchase_items
    ADD COLUMN normalized_quantity REAL DEFAULT 0;
  `);

  console.log(
    'Added normalized_quantity column to purchase_items'
  );
}