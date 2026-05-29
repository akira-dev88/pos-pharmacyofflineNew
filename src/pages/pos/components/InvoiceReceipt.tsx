import { IonIcon } from '@ionic/react';
import { printOutline, closeOutline, logoWhatsapp } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InvoiceReceiptProps {
  invoice: any;
  onClose: () => void;
  autoPrint?: boolean;
}

export default function InvoiceReceipt({ invoice, onClose, autoPrint }: InvoiceReceiptProps) {
  const { t } = useTranslation();
  const [formattedInvoice, setFormattedInvoice] = useState<any>(null);

  useEffect(() => {
    if (invoice) {
      formatInvoiceData();
    }
  }, [invoice]);

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, formattedInvoice]);

  useEffect(() => {
    const handleEnterKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleEnterKey);
    return () => window.removeEventListener('keydown', handleEnterKey);
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return new Date().toLocaleString('en-IN');
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatNumber = (num: number) => {
    const parsed = typeof num === 'string' ? parseFloat(num) : num;
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parsed || 0);
  };

  const formatInvoiceData = () => {
    const shopData = invoice.shop || invoice.pharmacy || {};
    const customerData = invoice.customer || {};
    const summaryData = invoice.summary || {};
    const itemsList = invoice.items || [];
    const paymentsList = invoice.payments || [];
    const complianceData = invoice.compliance || {};

    const calculatedSubtotal = itemsList.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);
    const calculatedTax = itemsList.reduce((sum: number, item: any) => sum + (Number(item.gst_amount) || Number(item.tax_amount) || 0), 0);
    const calculatedGrandTotal = calculatedSubtotal + calculatedTax - (Number(invoice.discount) || 0);

    setFormattedInvoice({
      shop: {
        name: shopData.shop_name || shopData.name || 'PHARMACY',
        address: shopData.address || '',
        mobile: shopData.mobile || shopData.phone || '',
        gstin: shopData.gstin || '',
        drug_license_number: shopData.drug_license_number || '',
        pharmacist_name: shopData.pharmacist_name || '',
      },
      invoice_number: invoice.invoice_number || invoice.invoice_no || 'N/A',
      created_at: invoice.created_at || invoice.date || new Date().toISOString(),
      customer: {
        name: customerData.name || 'Walk-in Customer',
        mobile: customerData.mobile || '',
      },
      items: itemsList.map((item: any) => ({
        name: item.product_name || item.name || 'Unknown',
        qty: item.quantity || item.qty || 1,
        price: item.price || item.unit_price || 0,
        total: item.total || (item.price * (item.quantity || 1)) || 0,
        hsn_code: item.hsn_code || item.hsn || '',
        tax_percent: item.gst_percent || item.tax_percent || 0,
        batch_number: item.batch_number || '',
        manufacturer: item.manufacturer || '',
      })),
      summary: {
        subtotal: summaryData.subtotal || summaryData.total || calculatedSubtotal,
        tax: summaryData.tax || summaryData.gst_total || calculatedTax,
        grand_total: summaryData.grand_total || invoice.grand_total || calculatedGrandTotal,
      },
      discount: invoice.discount || 0,
      payments: paymentsList.map((payment: any) => ({
        method: payment.method || 'cash',
        amount: payment.amount || 0,
      })),
      compliance: {
        contains_schedule_h: complianceData.contains_schedule_h || false,
        contains_schedule_h1: complianceData.contains_schedule_h1 || false,
      },
    });
  };

  const handlePrint = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/printing/print-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedInvoice || invoice),
      });
      const result = await response.json();
      if (result.success && result.printed) {
        onClose();
      } else {
        window.print();
      }
    } catch (error) {
      window.print();
    }
  };

  const handleWhatsApp = () => {
    if (!formattedInvoice) return;
    
    const phone = formattedInvoice.customer?.mobile ? `91${formattedInvoice.customer.mobile.replace(/\D/g, '')}` : '';
    const shopName = formattedInvoice.shop?.name || 'Our Store';
    const invoiceNo = formattedInvoice.invoice_number;
    const date = formatDate(formattedInvoice.created_at);

    const itemLines = formattedInvoice.items.map((item: any) => `  • ${item.name} x${item.qty} = ₹${formatNumber(item.total)}`).join('\n');
    const paymentLines = formattedInvoice.payments.map((p: any) => `  ${p.method.toUpperCase()}: ₹${formatNumber(p.amount)}`).join('\n');

    const message = [
      `${shopName}`,
      `Invoice: ${invoiceNo}`,
      `Date: ${date}`,
      formattedInvoice.customer?.name !== 'Walk-in Customer' ? `Customer: ${formattedInvoice.customer.name}` : null,
      ``,
      `Items:`,
      itemLines,
      ``,
      `Subtotal: ₹${formatNumber(formattedInvoice.summary.subtotal)}`,
      formattedInvoice.summary.tax > 0 ? `GST: ₹${formatNumber(formattedInvoice.summary.tax)}` : null,
      formattedInvoice.discount > 0 ? `Discount: -₹${formatNumber(formattedInvoice.discount)}` : null,
      `Total: ₹${formatNumber(formattedInvoice.summary.grand_total)}`,
      ``,
      `Payment:`,
      paymentLines,
      ``,
      `Thank you! 🙏`,
    ].filter(line => line !== null).join('\n');

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.key === '1') {
        e.preventDefault();
        handleWhatsApp();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [formattedInvoice]);

  if (!formattedInvoice) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  const { shop, customer, items, summary, payments, discount, compliance } = formattedInvoice;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 print:static print:bg-white print:p-0">
      {/* Buttons */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 shadow-lg">
          <IonIcon icon={printOutline} /> Print
        </button>
        <button onClick={handleWhatsApp} className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 shadow-lg">
          <IonIcon icon={logoWhatsapp} /> WhatsApp
        </button>
        <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg flex items-center gap-2 shadow-lg">
          <IonIcon icon={closeOutline} /> Close
        </button>
      </div>

      {/* Receipt - Robust layout for 80mm printer */}
      <div id="receipt" className="bg-white shadow-2xl overflow-hidden print:shadow-none" style={{ width: '80mm', maxWidth: '100%' }}>
        <div className="p-3 print:p-2">
          {/* Shop Header */}
          <div className="text-center border-b border-dashed border-gray-300 pb-2 mb-2">
            <div className="text-base font-bold uppercase tracking-tight">{shop.name}</div>
            {shop.address && <div className="text-[10px] text-gray-600 mt-1 leading-tight">{shop.address}</div>}
            <div className="text-[10px] text-gray-600 mt-0.5">
              {shop.mobile && <span>{shop.mobile}</span>}
              {shop.gstin && <span className="ml-1">GST: {shop.gstin}</span>}
            </div>
            {shop.drug_license_number && (
              <div className="text-[8px] text-gray-500 mt-0.5">Lic: {shop.drug_license_number}</div>
            )}
          </div>

          {/* Invoice Info */}
          <div className="text-[10px] mb-2 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice No:</span>
              <span className="font-semibold">{formattedInvoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span>{formatDate(formattedInvoice.created_at)}</span>
            </div>
            {customer.name && customer.name !== 'Walk-in Customer' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="truncate max-w-[120px]">{customer.name}</span>
              </div>
            )}
            {customer.mobile && (
              <div className="flex justify-between">
                <span className="text-gray-600">Mobile:</span>
                <span>{customer.mobile}</span>
              </div>
            )}
          </div>

          {/* TAX INVOICE label */}
          <div className="text-center bg-gray-100 py-0.5 rounded text-[9px] font-semibold mb-2">TAX INVOICE</div>

          {/* Items Header - Using table layout for reliability */}
          <div className="border-t border-gray-300 pt-1 mb-1">
            <div className="flex text-[9px] font-bold text-gray-700 pb-1 border-b border-gray-200">
              <div className="w-[38%]">Item</div>
              <div className="w-[18%] text-center">Qty</div>
              <div className="w-[22%] text-right">Price</div>
              <div className="w-[22%] text-right">Amount</div>
            </div>

            {/* Items List */}
            {items.map((item: any, idx: number) => (
              <div key={idx} className="mb-2 text-[9px]">
                <div className="flex">
                  <div className="w-[38%] break-words leading-tight">{item.name}</div>
                  <div className="w-[18%] text-center">{item.qty}</div>
                  <div className="w-[22%] text-right">₹{formatNumber(item.price)}</div>
                  <div className="w-[22%] text-right font-semibold">₹{formatNumber(item.total)}</div>
                </div>
                {(item.hsn_code || item.batch_number || item.manufacturer) && (
                  <div className="text-[8px] text-gray-400 mt-0.5 pl-1">
                    {item.hsn_code && <span>HSN: {item.hsn_code}</span>}
                    {item.batch_number && <span className="ml-2">Batch: {item.batch_number}</span>}
                    {item.manufacturer && <span className="ml-2">Mfg: {item.manufacturer}</span>}
                  </div>
                )}
                {item.tax_percent > 0 && (
                  <div className="text-[8px] text-gray-400 pl-1">GST: {item.tax_percent}%</div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="border-t border-gray-300 pt-1 mb-1 space-y-0.5 text-[10px]">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>₹{formatNumber(summary.subtotal)}</span>
            </div>
            {summary.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">GST:</span>
                <span>₹{formatNumber(summary.tax)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-₹{formatNumber(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t-2 border-gray-400 pt-1 mt-1">
              <span>TOTAL:</span>
              <span className="text-green-700">₹{formatNumber(summary.grand_total)}</span>
            </div>
          </div>

          {/* Payments */}
          {payments.length > 0 && (
            <div className="border-t border-dashed border-gray-300 pt-1 mb-1 text-[10px]">
              <div className="font-semibold mb-0.5">Payment</div>
              {payments.map((payment: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span className="capitalize">{payment.method}:</span>
                  <span>₹{formatNumber(payment.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Schedule Warnings */}
          {compliance.contains_schedule_h && (
            <div className="mt-2 text-center text-[8px] text-red-600 border border-red-200 bg-red-50 p-1 rounded">
              ⚠️ Schedule H drug - Prescription required
            </div>
          )}
          {compliance.contains_schedule_h1 && (
            <div className="mt-2 text-center text-[8px] text-orange-600 border border-orange-200 bg-orange-50 p-1 rounded">
              📋 Schedule H1 drug - Prescription recorded
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-[9px] text-gray-500 border-t border-dashed border-gray-300 pt-2 mt-2">
            <div className="font-medium text-gray-700">Thank you for your purchase!</div>
            <div className="mt-0.5">** Computer generated invoice **</div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          body * { visibility: hidden; }
          #receipt, #receipt * { visibility: visible; }
          #receipt { position: absolute; left: 0; top: 0; width: 80mm !important; margin: 0; border-radius: 0; }
          .print\\:hidden, button { display: none !important; }
        }
      `}</style>
    </div>
  );
}