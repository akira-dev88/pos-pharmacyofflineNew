import db from '../database/connection';
import type { Product, ProductCreateInput, ProductUpdateInput } from '../types/index';
import { v4 as uuidv4 } from 'uuid';

export class ProductModel {
  // Create new product
  static create(input: ProductCreateInput): Product {
    const uuid = uuidv4();

    const stmt = db.prepare(`
    INSERT INTO products (
      product_uuid, name, barcode, sku, price, gst_percent, stock, hsn_code
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

    stmt.run(
      uuid,
      input.name,
      input.barcode || null,
      input.sku || null,
      input.price,
      input.gst_percent || 0,
      input.stock || 0,
      input.hsn_code || null
    );

    return this.findById(uuid)!;
  }

  // Find product by UUID
  static findById(uuid: string): Product | undefined {
    const stmt = db.prepare('SELECT * FROM products WHERE product_uuid = ?');
    return stmt.get(uuid) as Product | undefined;
  }

  // Find product by barcode
  static findByBarcode(barcode: string): Product | undefined {
    const stmt = db.prepare('SELECT * FROM products WHERE barcode = ?');
    return stmt.get(barcode) as Product | undefined;
  }

  // Find product by SKU
  static findBySku(sku: string): Product | undefined {
    const stmt = db.prepare('SELECT * FROM products WHERE sku = ?');
    return stmt.get(sku) as Product | undefined;
  }

  // List all products (paginated)
  static findAll(page: number = 1, limit: number = 20): { products: Product[], total: number } {
    const offset = (page - 1) * limit;

    const products = db.prepare(
      'SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(limit, offset) as Product[];

    const total = (db.prepare('SELECT COUNT(*) as count FROM products').get() as any).count;

    return { products, total };
  }

  // Search products by name
  static search(query: string, limit: number = 20): Product[] {
    const stmt = db.prepare(`
      SELECT * FROM products 
      WHERE name LIKE ? 
      ORDER BY name ASC 
      LIMIT ?
    `);

    return stmt.all(`%${query}%`, limit) as Product[];
  }

  // Advanced search with multiple criteria
  static advancedSearch(params: {
    name?: string;
    barcode?: string;
    sku?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }): Product[] {
    let query = 'SELECT * FROM products WHERE 1=1';
    const values: any[] = [];

    if (params.name) {
      query += ' AND name LIKE ?';
      values.push(`%${params.name}%`);
    }

    if (params.barcode) {
      query += ' AND barcode = ?';
      values.push(params.barcode);
    }

    if (params.sku) {
      query += ' AND sku = ?';
      values.push(params.sku);
    }

    if (params.minPrice !== undefined) {
      query += ' AND price >= ?';
      values.push(params.minPrice);
    }

    if (params.maxPrice !== undefined) {
      query += ' AND price <= ?';
      values.push(params.maxPrice);
    }

    if (params.inStock) {
      query += ' AND stock > 0';
    }

    query += ' ORDER BY name ASC';

    const stmt = db.prepare(query);
    return stmt.all(...values) as Product[];
  }

  // Update product
  static update(uuid: string, updates: ProductUpdateInput): Product | undefined {
    const product = this.findById(uuid);
    if (!product) return undefined;

    const allowedFields = ['name', 'barcode', 'sku', 'price', 'gst_percent', 'stock', 'hsn_code'];
    const updateFields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) return product;

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(uuid);

    const stmt = db.prepare(`
      UPDATE products SET ${updateFields.join(', ')} WHERE product_uuid = ?
    `);

    stmt.run(...values);
    return this.findById(uuid);
  }

  // Update stock quantity
  static updateStock(uuid: string, quantity: number, operation: 'add' | 'subtract' = 'add'): Product | undefined {
    const product = this.findById(uuid);
    if (!product) return undefined;

    const currentStock = operation === 'add'
      ? product.stock + quantity
      : product.stock - quantity;

    if (currentStock < 0) {
      throw new Error('Insufficient stock');
    }

    const stmt = db.prepare(
      'UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE product_uuid = ?'
    );
    stmt.run(currentStock, uuid);

    return this.findById(uuid);
  }

  // Delete product
  static delete(uuid: string): boolean {
    const stmt = db.prepare('DELETE FROM products WHERE product_uuid = ?');
    const result = stmt.run(uuid);
    return result.changes > 0;
  }

  // Bulk create products (for import)
  static bulkCreate(products: ProductCreateInput[]): number {
    const insertStmt = db.prepare(`
      INSERT INTO products (product_uuid, name, barcode, sku, price, gst_percent, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((items: ProductCreateInput[]) => {
      let count = 0;
      for (const item of items) {
        insertStmt.run(
          uuidv4(),
          item.name,
          item.barcode || null,
          item.sku || null,
          item.price,
          item.gst_percent || 0,
          item.stock || 0
        );
        count++;
      }
      return count;
    });

    return transaction(products);
  }

  // Get low stock products
  static getLowStock(threshold: number = 10): Product[] {
    const stmt = db.prepare('SELECT * FROM products WHERE stock <= ? ORDER BY stock ASC');
    return stmt.all(threshold) as Product[];
  }

  // Get product count
  static count(): number {
    const result = db.prepare('SELECT COUNT(*) as count FROM products').get() as any;
    return result.count;
  }
}
