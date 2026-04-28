import { IonIcon } from '@ionic/react';
import { printOutline, closeOutline } from 'ionicons/icons';

interface InvoiceReceiptProps {
  invoice: any;
  onClose: () => void;
}

export default function InvoiceReceipt({ invoice, onClose }: InvoiceReceiptProps) {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const dashes = '--------------------------------';
  const doubleDashes = '================================';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 print:static print:bg-white print:p-0 print:block">
      
      {/* Action Buttons - Hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg"
        >
          <IonIcon icon={printOutline} />
          Print
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 shadow-lg"
        >
          <IonIcon icon={closeOutline} />
          Close
        </button>
      </div>

      {/* Receipt Paper */}
      <div
        id="receipt"
        className="bg-white print:shadow-none shadow-2xl"
        style={{
          width: '302px', // 80mm in px — works for both 58mm and 80mm
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '12px',
          padding: '12px 10px',
          lineHeight: '1.5',
          color: '#000',
        }}
      >
        {/* Shop Header */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px' }}>
            {invoice.shop?.name || 'MY STORE'}
          </div>
          {invoice.shop?.address && (
            <div style={{ fontSize: '11px', marginTop: '2px' }}>
              {invoice.shop.address}
            </div>
          )}
          {invoice.shop?.mobile && (
            <div style={{ fontSize: '11px' }}>
              Ph: {invoice.shop.mobile}
            </div>
          )}
          {invoice.shop?.gstin && (
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
              GSTIN: {invoice.shop.gstin}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px' }}>{doubleDashes}</div>

        {/* Invoice Info */}
        <div style={{ fontSize: '11px', margin: '6px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Invoice#:</span>
            <span style={{ fontWeight: 'bold' }}>{invoice.invoice_number || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Date:</span>
            <span>{formatDate(invoice.date || invoice.created_at || new Date().toISOString())}</span>
          </div>
          {invoice.customer?.name && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Customer:</span>
              <span>{invoice.customer.name}</span>
            </div>
          )}
          {invoice.customer?.mobile && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Mobile:</span>
              <span>{invoice.customer.mobile}</span>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px' }}>{doubleDashes}</div>

        {/* TAX INVOICE Label */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', margin: '4px 0' }}>
          TAX INVOICE
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px' }}>{dashes}</div>

        {/* Items Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', margin: '4px 4px' }}>
          <span >Item</span>
          <span >Qty</span>
          <span >Rate</span>
          <span >Amt</span>
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px' }}>{dashes}</div>

        {/* Items */}
        {(invoice.items || []).map((item: any, index: number) => (
          <div key={index} style={{ marginBottom: '6px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 4px'}}>
              <span style={{  fontWeight: 'bold' }}>{item.name}</span>
              <span>{item.qty}</span>
              <span>{formatNumber(item.price)}</span>
              <span style={{ fontWeight: 'bold' }}>{formatNumber(item.total)}</span>
            </div>
            {(item.hsn_code || item.tax_percent > 0) && (
              <div style={{ fontSize: '10px', color: '#444', paddingLeft: '2px' }}>
                {item.hsn_code && <span>HSN:{item.hsn_code} </span>}
                {item.tax_percent > 0 && <span>GST:{item.tax_percent}% (C:{formatNumber(item.cgst)} S:{formatNumber(item.sgst)})</span>}
              </div>
            )}
          </div>
        ))}

        <div style={{ textAlign: 'center', fontSize: '11px' }}>{dashes}</div>

        {/* Summary */}
        <div style={{ fontSize: '11px', margin: '6px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>Rs.{formatNumber(invoice.summary?.total || 0)}</span>
          </div>
          {(invoice.summary?.tax || 0) > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>CGST:</span>
                <span>Rs.{formatNumber(invoice.summary?.cgst || invoice.summary?.tax / 2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>SGST:</span>
                <span>Rs.{formatNumber(invoice.summary?.sgst || invoice.summary?.tax / 2)}</span>
              </div>
            </>
          )}
          {(invoice.discount || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Discount:</span>
              <span>-Rs.{formatNumber(invoice.discount)}</span>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px' }}>{doubleDashes}</div>

        {/* Grand Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', margin: '6px 0' }}>
          <span>TOTAL:</span>
          <span>Rs.{formatNumber(invoice.summary?.grand_total || 0)}</span>
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px' }}>{doubleDashes}</div>

        {/* Payments */}
        {(invoice.payments || []).length > 0 && (
          <div style={{ fontSize: '11px', margin: '6px 0' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Payment:</div>
            {(invoice.payments || []).map((payment: any, index: number) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ textTransform: 'capitalize' }}>{payment.method}:</span>
                <span>Rs.{formatNumber(payment.amount)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: '11px' }}>{dashes}</div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '11px', margin: '8px 0 4px' }}>
          <div style={{ fontWeight: 'bold' }}>** THANK YOU **</div>
          <div style={{ marginTop: '2px' }}>Visit us again!</div>
          <div style={{ marginTop: '4px', fontSize: '10px' }}>
            Computer generated invoice
          </div>
        </div>

      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #receipt, #receipt * {
            visibility: visible;
          }
          #receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm !important;
            padding: 4px 6px !important;
            box-shadow: none !important;
          }
          .print\\:hidden, button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}