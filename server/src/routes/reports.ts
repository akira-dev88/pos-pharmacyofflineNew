import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';
import db from '../database/connection';

const router = Router();

// All report routes require authentication
router.use(authenticate);

// Main report routes (matching PHP)
router.get('/dashboard', ReportController.dashboard);
router.get('/top-products', ReportController.topProducts);
router.get('/stock', ReportController.stock);
router.get('/profit', ReportController.profit);
router.get('/sales-trend', ReportController.salesTrend);
router.get('/profit-trend', ReportController.profitTrend);

// Additional useful report routes
router.get('/sales-by-payment', ReportController.salesByPayment);
router.get('/daily-sales', ReportController.dailySales);
router.get('/product-sales', ReportController.productSales);
router.get('/customer-purchases', ReportController.customerPurchases);

router.get('/daily', (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? String(date) : new Date().toISOString().split('T')[0];
    const startOfDay = `${reportDate} 00:00:00`;
    const endOfDay = `${reportDate} 23:59:59`;

    const summary = db.prepare(`
  SELECT COUNT(*) as total_bills,
    COALESCE(SUM(total), 0) as subtotal,
    COALESCE(SUM(tax), 0) as total_tax,
    COALESCE(SUM(grand_total), 0) as grand_total
  FROM sales
  WHERE datetime(created_at, 'localtime') BETWEEN ? AND ?
  AND (status = 'completed')
  AND (is_deleted = 0 OR is_deleted IS NULL)
`).get(startOfDay, endOfDay) as any;

    const payments = db.prepare(`
      SELECT p.method, COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      JOIN sales s ON p.sale_uuid = s.sale_uuid
      WHERE s.created_at BETWEEN ? AND ? AND s.status = 'completed'
      GROUP BY p.method
    `).all(startOfDay, endOfDay);

    const topProducts = db.prepare(`
      SELECT p.name, SUM(si.quantity) as qty_sold,
        SUM(si.price * si.quantity) as revenue
      FROM sale_items si
      JOIN products p ON si.product_uuid = p.product_uuid
      JOIN sales s ON si.sale_uuid = s.sale_uuid
      WHERE s.created_at BETWEEN ? AND ? AND s.status = 'completed'
      GROUP BY si.product_uuid
      ORDER BY revenue DESC LIMIT 10
    `).all(startOfDay, endOfDay);

    const gstSlabs = db.prepare(`
      SELECT si.tax_percent,
        SUM(si.price * si.quantity) as taxable_amount,
        SUM(si.tax_amount) as tax_collected
      FROM sale_items si
      JOIN sales s ON si.sale_uuid = s.sale_uuid
      WHERE s.created_at BETWEEN ? AND ? AND s.status = 'completed'
        AND si.tax_percent > 0
      GROUP BY si.tax_percent ORDER BY si.tax_percent
    `).all(startOfDay, endOfDay);

    const bills = db.prepare(`
      SELECT s.invoice_number, s.grand_total, s.created_at,
        c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_uuid = c.customer_uuid
      WHERE s.created_at BETWEEN ? AND ? AND s.status = 'completed'
      ORDER BY s.created_at DESC
    `).all(startOfDay, endOfDay);

    const settings = db.prepare('SELECT * FROM settings LIMIT 1').get() as any;

    res.json({
      success: true,
      data: {
        date: reportDate,
        shop: settings ? {
          name: settings.shop_name,
          address: settings.address,
          gstin: settings.gstin,
          mobile: settings.mobile,
        } : null,
        summary, payments, top_products: topProducts, gst_slabs: gstSlabs, bills
      }
    });
  } catch (err) {
    console.error('Daily report error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }

  router.get('/gst', (req, res) => {
    try {
      const { month } = req.query;
      // month format: "2026-05"
      const reportMonth = month ? String(month) : new Date().toISOString().slice(0, 7);
      const [year, mon] = reportMonth.split('-');

      const startDate = `${reportMonth}-01 00:00:00`;
      // Last day of month
      const lastDay = new Date(parseInt(year), parseInt(mon), 0).getDate();
      const endDate = `${reportMonth}-${lastDay} 23:59:59`;

      // GST slab wise summary
      const slabs = db.prepare(`
      SELECT
        si.tax_percent,
        COUNT(DISTINCT s.sale_uuid) as invoice_count,
        SUM(si.price * si.quantity) as taxable_value,
        SUM(si.tax_amount) as total_tax,
        SUM(si.tax_amount) / 2 as cgst,
        SUM(si.tax_amount) / 2 as sgst
      FROM sale_items si
      JOIN sales s ON si.sale_uuid = s.sale_uuid
      WHERE s.created_at BETWEEN ? AND ?
        AND s.status = 'completed'
        AND si.tax_percent > 0
      GROUP BY si.tax_percent
      ORDER BY si.tax_percent ASC
    `).all(startDate, endDate) as any[];

      // Exempt/zero rated sales
      const exemptSales = db.prepare(`
      SELECT
        COALESCE(SUM(si.price * si.quantity), 0) as taxable_value
      FROM sale_items si
      JOIN sales s ON si.sale_uuid = s.sale_uuid
      WHERE s.created_at BETWEEN ? AND ?
        AND s.status = 'completed'
        AND si.tax_percent = 0
    `).get(startDate, endDate) as any;

      // Overall summary
      const summary = db.prepare(`
      SELECT
        COUNT(DISTINCT s.sale_uuid) as total_invoices,
        COALESCE(SUM(s.total), 0) as total_taxable,
        COALESCE(SUM(s.tax), 0) as total_tax,
        COALESCE(SUM(s.grand_total), 0) as grand_total
      FROM sales s
      WHERE s.created_at BETWEEN ? AND ?
        AND s.status = 'completed'
    `).get(startDate, endDate) as any;

      // Invoice list for the month
      const invoices = db.prepare(`
      SELECT
        s.invoice_number,
        s.created_at,
        s.total,
        s.tax,
        s.grand_total,
        c.name as customer_name,
        c.gstin as customer_gstin
      FROM sales s
      LEFT JOIN customers c ON s.customer_uuid = c.customer_uuid
      WHERE s.created_at BETWEEN ? AND ?
        AND s.status = 'completed'
      ORDER BY s.created_at ASC
    `).all(startDate, endDate) as any[];

      const settings = db.prepare('SELECT * FROM settings LIMIT 1').get() as any;

      res.json({
        success: true,
        data: {
          month: reportMonth,
          shop: settings ? {
            name: settings.shop_name,
            gstin: settings.gstin,
            address: settings.address,
          } : null,
          summary,
          slabs,
          exempt_value: exemptSales?.taxable_value || 0,
          invoices,
        }
      });
    } catch (err) {
      console.error('GST report error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });
});

export default router;
