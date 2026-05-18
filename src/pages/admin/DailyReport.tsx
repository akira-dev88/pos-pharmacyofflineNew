import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getDailyReport } from "../../renderer/services/reportApi";
import { IonIcon } from "@ionic/react";
import { printOutline, calendarOutline, refreshOutline } from "ionicons/icons";

export default function DailyReport() {
  const { t } = useTranslation();
  const getTodayIST = () => {
    const now = new Date();
    // Offset for IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getTodayIST);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await getDailyReport(date);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(); }, [date]);

  const handlePrint = () => window.print();

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(n || 0);

  // Translation for payment methods
  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'cash': return t('dailyReport.paymentMethods.cash');
      case 'upi': return t('dailyReport.paymentMethods.upi');
      case 'card': return t('dailyReport.paymentMethods.card');
      case 'pay_later': return t('dailyReport.paymentMethods.payLater');
      default: return method;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('dailyReport.title')}</h1>
          <p className="text-gray-500 text-sm">{t('dailyReport.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <IonIcon icon={calendarOutline} className="text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="focus:outline-none text-sm"
            />
          </div>
          <button onClick={loadReport}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            <IonIcon icon={refreshOutline} className="text-gray-600 text-xl" />
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">
            <IonIcon icon={printOutline} className="text-xl" />
            {t('dailyReport.printButton')}
          </button>
        </div>
      </div>

      {!report ? (
        <div className="text-center text-gray-500 py-20">{t('dailyReport.noData')}</div>
      ) : (
        <div ref={printRef} className="space-y-4">

          {/* Print Header - only visible when printing */}
          <div className="hidden print:block text-center mb-4">
            <h2 className="text-xl font-bold">{report.shop?.name || t('dailyReport.myStore')}</h2>
            {report.shop?.address && <p className="text-sm">{report.shop.address}</p>}
            {report.shop?.gstin && <p className="text-sm">{t('dailyReport.gstinLabel')}: {report.shop.gstin}</p>}
            <h3 className="text-lg font-bold mt-2">{t('dailyReport.printTitle')} — {date}</h3>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
            {[
              { label: t('dailyReport.totalBills'), value: report.summary.total_bills, prefix: '', color: 'blue' },
              { label: t('dailyReport.subtotal'), value: fmt(report.summary.subtotal), prefix: '₹', color: 'green' },
              { label: t('dailyReport.gstCollected'), value: fmt(report.summary.total_tax), prefix: '₹', color: 'orange' },
              { label: t('dailyReport.grandTotal'), value: fmt(report.summary.grand_total), prefix: '₹', color: 'purple' },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm print:border print:border-gray-200 print:shadow-none">
                <p className="text-gray-500 text-sm">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{card.prefix}{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Breakdown */}
            <div className="bg-white rounded-2xl p-5 shadow-sm print:border print:border-gray-200 print:shadow-none">
              <h3 className="font-bold text-gray-700 mb-3">{t('dailyReport.paymentBreakdown')}</h3>
              {report.payments.length === 0 ? (
                <p className="text-gray-400 text-sm">{t('dailyReport.noPayments')}</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {report.payments.map((p: any, i: number) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 text-gray-600">{getPaymentLabel(p.method)}</td>
                        <td className="py-2 text-right font-semibold text-gray-800">₹{fmt(p.total)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="py-2 text-gray-800">{t('dailyReport.totalCollected')}</td>
                      <td className="py-2 text-right text-green-600">
                        ₹{fmt(report.payments.reduce((s: number, p: any) => s + p.total, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* GST Summary */}
            <div className="bg-white rounded-2xl p-5 shadow-sm print:border print:border-gray-200 print:shadow-none">
              <h3 className="font-bold text-gray-700 mb-3">{t('dailyReport.gstSummary')}</h3>
              {report.gst_slabs.length === 0 ? (
                <p className="text-gray-400 text-sm">{t('dailyReport.noGst')}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-100">
                      <th className="text-left py-1">{t('dailyReport.slabHeader')}</th>
                      <th className="text-right py-1">{t('dailyReport.taxableAmtHeader')}</th>
                      <th className="text-right py-1">{t('dailyReport.cgstHeader')}</th>
                      <th className="text-right py-1">{t('dailyReport.sgstHeader')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.gst_slabs.map((g: any, i: number) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 text-gray-600">{g.tax_percent}%</td>
                        <td className="py-2 text-right text-gray-700">₹{fmt(g.taxable_amount)}</td>
                        <td className="py-2 text-right text-gray-700">₹{fmt(g.tax_collected / 2)}</td>
                        <td className="py-2 text-right text-gray-700">₹{fmt(g.tax_collected / 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl p-5 shadow-sm print:border print:border-gray-200 print:shadow-none">
            <h3 className="font-bold text-gray-700 mb-3">{t('dailyReport.topProducts')}</h3>
            {report.top_products.length === 0 ? (
              <p className="text-gray-400 text-sm">{t('dailyReport.noSales')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="text-left py-2">#</th>
                    <th className="text-left py-2">{t('dailyReport.productHeader')}</th>
                    <th className="text-right py-2">{t('dailyReport.qtySoldHeader')}</th>
                    <th className="text-right py-2">{t('dailyReport.revenueHeader')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.top_products.map((p: any, i: number) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2 font-medium text-gray-800">{p.name}</td>
                      <td className="py-2 text-right text-gray-600">{p.qty_sold}</td>
                      <td className="py-2 text-right font-semibold text-green-600">₹{fmt(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* All Bills */}
          <div className="bg-white rounded-2xl p-5 shadow-sm print:border print:border-gray-200 print:shadow-none">
            <h3 className="font-bold text-gray-700 mb-3">{t('dailyReport.billsHeader', { count: report.bills.length })}</h3>
            {report.bills.length === 0 ? (
              <p className="text-gray-400 text-sm">{t('dailyReport.noBills')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="text-left py-2">{t('dailyReport.invoiceHeader')}</th>
                    <th className="text-left py-2">{t('dailyReport.customerHeader')}</th>
                    <th className="text-left py-2">{t('dailyReport.timeHeader')}</th>
                    <th className="text-right py-2">{t('dailyReport.amountHeader')}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.bills.map((b: any, i: number) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="py-2 font-mono text-gray-700">{b.invoice_number}</td>
                      <td className="py-2 text-gray-600">{b.customer_name || t('dailyReport.walkInCustomer')}</td>
                      <td className="py-2 text-gray-500">
                        {new Date(b.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </td>
                      <td className="py-2 text-right font-semibold text-gray-800">₹{fmt(b.grand_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body * { visibility: hidden; }
          #root * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          [ref="printRef"], [ref="printRef"] * { visibility: visible; }
        }
      `}</style>
    </div>
  );
}