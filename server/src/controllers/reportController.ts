import type { Request, Response } from 'express';
import { ReportModel } from '../models/Report';
import type { AuthRequest } from '../middleware/auth';

export class ReportController {

  static dashboard = (req: AuthRequest, res: Response): void => {
    try {
      const data = ReportModel.getDashboard();
      res.json({ success: true, data });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  static topProducts = (req: AuthRequest, res: Response): void => {
    try {
      const data = ReportModel.getTopProducts();
      res.json({ success: true, data });
    } catch (error) {
      console.error('Top products error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  static stock = (req: AuthRequest, res: Response): void => {
    try {
      const data = ReportModel.getStockReport();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Stock report error:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  };

  static profit = (req: AuthRequest, res: Response): void => {
    try {
      const data = ReportModel.getProfit();
      res.json({ success: true, data });
    } catch (error) {
      console.error('Profit report error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  static salesTrend = (req: AuthRequest, res: Response): void => {
    try {
      const data = ReportModel.getSalesTrend();
      res.json({ success: true, data });
    } catch (error) {
      console.error('Sales trend error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  static profitTrend = (req: AuthRequest, res: Response): void => {
    try {
      const data = ReportModel.getProfitTrend();
      res.json({ success: true, data });
    } catch (error) {
      console.error('Profit trend error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  static salesByPayment = (req: AuthRequest, res: Response): void => {
    try {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const data = ReportModel.getSalesByPaymentMethod(startDate, endDate);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Sales by payment error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  static dailySales = (req: AuthRequest, res: Response): void => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = ReportModel.getDailySalesSummary(days);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Daily sales error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  static productSales = (req: AuthRequest, res: Response): void => {
    try {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const data = ReportModel.getProductSalesReport(startDate, endDate);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Product sales report error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  static customerPurchases = (req: AuthRequest, res: Response): void => {
    try {
      const data = ReportModel.getCustomerPurchaseReport();
      res.json({ success: true, data });
    } catch (error) {
      console.error('Customer purchase report error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  // ── New endpoints ──────────────────────────────────────────────────────────

  static dailyReport = (req: Request, res: Response): void => {
    try {
      const date = String(
        req.query.date || new Date().toISOString().split('T')[0]
      );
      const data = ReportModel.getDailyReportByDate(date);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Daily report error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  static gstReport = (req: Request, res: Response): void => {
    try {
      const month = String(
        req.query.month || new Date().toISOString().slice(0, 7)
      );
      const data = ReportModel.getGSTReport(month);
      res.json({ success: true, data });
    } catch (error) {
      console.error('GST report error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
}