import type { Request, Response } from 'express';
import { ProductModel } from '../models/Product';
import type { AuthRequest } from '../middleware/auth';

export class ProductController {
  // Helper to safely get query parameter as string
  private static getQueryParam(req: Request, param: string, defaultValue: string = ''): string {
    const value = req.query[param];
    if (Array.isArray(value)) {
      return (value[0] as string) || defaultValue;
    }
    return (value as string) || defaultValue;
  }

  // Helper to safely get query parameter as number
  private static getQueryParamAsNumber(req: Request, param: string, defaultValue: number): number {
    const value = this.getQueryParam(req, param);
    const num = parseInt(value);
    return isNaN(num) ? defaultValue : num;
  }

  // Create new product
  static create = (req: AuthRequest, res: Response): void => {
    try {
      const { name, price, barcode, sku, gst_percent, stock, hsn_code } = req.body;

      // Validation
      if (!name || price === undefined) {
        res.status(400).json({
          success: false,
          error: 'Name and price are required'
        });
        return;
      }

      // Check barcode uniqueness if provided
      if (barcode && typeof barcode === 'string') {
        const existingBarcode = ProductModel.findByBarcode(barcode);
        if (existingBarcode) {
          res.status(400).json({
            success: false,
            error: 'Product with this barcode already exists'
          });
          return;
        }
      }

      // Check SKU uniqueness if provided
      if (sku && typeof sku === 'string') {
        const existingSku = ProductModel.findBySku(sku);
        if (existingSku) {
          res.status(400).json({
            success: false,
            error: 'Product with this SKU already exists'
          });
          return;
        }
      }

      const product = ProductModel.create({
        name: String(name),
        price: Number(price),
        barcode: barcode ? String(barcode) : undefined,
        sku: sku ? String(sku) : undefined,
        gst_percent: gst_percent !== undefined ? Number(gst_percent) : undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        hsn_code: hsn_code ? String(hsn_code) : undefined  // ← add this
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  // List all products (with pagination)
  static index = (req: Request, res: Response): void => {
    try {
      const page = ProductController.getQueryParamAsNumber(req, 'page', 1);
      const limit = ProductController.getQueryParamAsNumber(req, 'limit', 20);

      const { products, total } = ProductModel.findAll(page, limit);

      res.json({
        success: true,
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('List products error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  // Search products
  static search = (req: Request, res: Response): void => {
    try {
      const query = ProductController.getQueryParam(req, 'q');

      if (!query) {
        res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
        return;
      }

      const products = ProductModel.search(query, 20);

      res.json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      console.error('Search products error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  // Find by barcode
  static findByBarcode = (req: Request, res: Response): void => {
    try {
      const barcode = String(req.params.barcode);
      const product = ProductModel.findByBarcode(barcode);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found'
        });
        return;
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Find by barcode error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  // Find by SKU
  static findBySku = (req: Request, res: Response): void => {
    try {
      const sku = String(req.params.sku);
      const product = ProductModel.findBySku(sku);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found'
        });
        return;
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Find by SKU error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  // Get single product
  static show = (req: Request, res: Response): void => {
    try {
      const uuid = String(req.params.uuid);
      const product = ProductModel.findById(uuid);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found'
        });
        return;
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Show product error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  // Update product
  static update = (req: AuthRequest, res: Response): void => {
    try {
      const uuid = String(req.params.uuid);
      const { name, price, barcode, sku, gst_percent, stock, hsn_code } = req.body;

      const updates: any = {};
      if (name !== undefined) updates.name = String(name);
      if (price !== undefined) updates.price = Number(price);
      if (barcode !== undefined) updates.barcode = String(barcode);
      if (sku !== undefined) updates.sku = String(sku);
      if (gst_percent !== undefined) updates.gst_percent = Number(gst_percent);
      if (stock !== undefined) updates.stock = Number(stock);
      if (hsn_code !== undefined) updates.hsn_code = String(hsn_code);

      const product = ProductModel.update(uuid, updates);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  // Delete product
  static destroy = (req: AuthRequest, res: Response): void => {
    try {
      const uuid = String(req.params.uuid);
      const deleted = ProductModel.delete(uuid);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Product not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  // Get low stock products
  static lowStock = (req: Request, res: Response): void => {
    try {
      const threshold = ProductController.getQueryParamAsNumber(req, 'threshold', 10);
      const products = ProductModel.getLowStock(threshold);

      res.json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      console.error('Low stock error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  // Bulk create products
  static bulkCreate = (req: AuthRequest, res: Response): void => {
    try {
      const { products } = req.body;

      if (!Array.isArray(products) || products.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Products array is required'
        });
        return;
      }

      // Validate and sanitize each product
      const sanitizedProducts = products.map((product: any) => ({
        name: String(product.name),
        price: Number(product.price),
        barcode: product.barcode ? String(product.barcode) : undefined,
        sku: product.sku ? String(product.sku) : undefined,
        gst_percent: product.gst_percent !== undefined ? Number(product.gst_percent) : undefined,
        stock: product.stock !== undefined ? Number(product.stock) : undefined,
        hsn_code: product.hsn_code ? String(product.hsn_code) : undefined  // ← add this
      }));

      const count = ProductModel.bulkCreate(sanitizedProducts);

      res.status(201).json({
        success: true,
        message: `${count} products created successfully`,
        count
      });
    } catch (error) {
      console.error('Bulk create error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
}
