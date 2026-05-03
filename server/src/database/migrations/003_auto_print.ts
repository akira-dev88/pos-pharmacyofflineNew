import db from '../connection';

export function addAutoPrint(): void {
  const cols = db.prepare("PRAGMA table_info(settings)").all() as any[];
  
  const hasAutoPrint = cols.some(c => c.name === 'auto_print');
  if (!hasAutoPrint) {
    db.exec(`ALTER TABLE settings ADD COLUMN auto_print INTEGER DEFAULT 0`);
    console.log('Added auto_print column to settings');
  }

  const hasPrinterType = cols.some(c => c.name === 'printer_type');
  if (!hasPrinterType) {
    db.exec(`ALTER TABLE settings ADD COLUMN printer_type TEXT DEFAULT 'network'`);
    console.log('Added printer_type column to settings');
  }

  const hasPrinterHost = cols.some(c => c.name === 'printer_host');
  if (!hasPrinterHost) {
    db.exec(`ALTER TABLE settings ADD COLUMN printer_host TEXT DEFAULT 'localhost'`);
    console.log('Added printer_host column to settings');
  }

  const hasPrinterPort = cols.some(c => c.name === 'printer_port');
  if (!hasPrinterPort) {
    db.exec(`ALTER TABLE settings ADD COLUMN printer_port INTEGER DEFAULT 9104`);
    console.log('Added printer_port column to settings');
  }

  const hasPrinterName = cols.some(c => c.name === 'printer_name');
  if (!hasPrinterName) {
    db.exec(`ALTER TABLE settings ADD COLUMN printer_name TEXT`);
    console.log('Added printer_name column to settings');
  }
}