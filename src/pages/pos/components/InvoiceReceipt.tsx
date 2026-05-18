import { IonIcon } from '@ionic/react';
import { printOutline, closeOutline, logoWhatsapp } from 'ionicons/icons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface InvoiceReceiptProps {
  invoice: any;
  onClose: () => void;
  autoPrint?: boolean;
}

export default function InvoiceReceipt({ invoice, onClose, autoPrint }: InvoiceReceiptProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, invoice]);

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

  const handlePrint = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/printing/print-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoice)
      });

      const result = await response.json();

      if (result.success && result.printed) {
        console.log('✅ Printed to thermal printer');
        onClose();
      } else if (result.useBrowserPrint || result.fallback) {
        console.warn('⚠️ Thermal printer not available, using browser print:', result.message);
        window.print();
      }
    } catch (error) {
      console.error('❌ Print error:', error);
      window.print();
    }
  };

  const handleWhatsApp = () => {
    const phone = invoice.customer?.mobile
      ? `91${invoice.customer.mobile.replace(/\D/g, '')}` // prepend country code, strip non-digits
      : '';

    const shopName = invoice.shop?.name || 'Our Store';
    const invoiceNo = invoice.invoice_number || 'N/A';
    const date = formatDate(invoice.date || invoice.created_at || new Date().toISOString());

    const itemLines = (invoice.items || [])
      .map((item: any) => `  • ${item.name} x${item.qty} = ₹${formatNumber(item.total)}`)
      .join('\n');

    const paymentLines = (invoice.payments || [])
      .map((p: any) => `  ${p.method.toUpperCase()}: ₹${formatNumber(p.amount)}`)
      .join('\n');

    const message = [
      `${shopName}`,
      `Invoice: ${invoiceNo}`,
      `Date: ${date}`,
      invoice.customer?.name ? `Customer: ${invoice.customer.name}` : null,
      ``,
      `Items:`,
      itemLines,
      ``,
      `Subtotal: ₹${formatNumber(invoice.summary?.total || 0)}`,
      (invoice.summary?.tax || 0) > 0 ? `GST: ₹${formatNumber(invoice.summary.tax)}` : null,
      (invoice.discount || 0) > 0 ? `Discount: -₹${formatNumber(invoice.discount)}` : null,
      `Total: ₹${formatNumber(invoice.summary?.grand_total || 0)}`,
      ``,
      `Payment:`,
      paymentLines,
      ``,
      `Thank you for shopping with us! 🙏`,
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
  }, [handleWhatsApp, onClose]);

  const dashes = '--------------------------------';
  const doubleDashes = '================================';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 print:static print:bg-white print:p-0 print:block font-bold">

      {/* Action Buttons - Hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg"
        >
          <IonIcon icon={printOutline} />
          {t('receipt.print')}
        </button>

        <button
          onClick={handleWhatsApp}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 shadow-lg"
        >
          <IonIcon icon={logoWhatsapp} />
          WhatsApp
        </button>

        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 shadow-lg"
        >
          <IonIcon icon={closeOutline} />
          {t('common.close')}
        </button>
      </div>

      {/* Receipt Paper */}
      <div
        id="receipt"
        className="bg-white print:shadow-none shadow-2xl"
        style={{
          width: '302px',
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
              {t('receipt.phoneLabel')}: {invoice.shop.mobile}
            </div>
          )}
          {invoice.shop?.gstin && (
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
              {t('receipt.gstinLabel')}: {invoice.shop.gstin}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px' }}>{doubleDashes}</div>

        {/* Invoice Info */}
        <div style={{ fontSize: '11px', margin: '6px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('receipt.invoiceNo')}:</span>
            <span style={{ fontWeight: 'bold' }}>{invoice.invoice_number || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('receipt.date')}:</span>
            <span>{formatDate(invoice.date || invoice.created_at || new Date().toISOString())}</span>
          </div>
          {invoice.customer?.name && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('receipt.customer')}:</span>
              <span>{invoice.customer.name}</span>
            </div>
          )}
          {invoice.customer?.mobile && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('receipt.mobile')}:</span>
              <span>{invoice.customer.mobile}</span>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px' }}>{doubleDashes}</div>

        {/* TAX INVOICE Label */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', margin: '4px 0' }}>
          {t('receipt.taxInvoice')}
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px' }}>{dashes}</div>

        {/* Items Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', margin: '4px 4px' }}>
          <span>{t('receipt.item')}</span>
          <span>{t('receipt.qty')}</span>
          <span>{t('receipt.rate')}</span>
          <span>{t('receipt.amt')}</span>
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px' }}>{dashes}</div>

        {/* Items */}
        {(invoice.items || []).map((item: any, index: number) => (
          <div key={index} style={{ marginBottom: '6px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 4px' }}>
              <span style={{ fontWeight: 'bold' }}>{item.name}</span>
              <span>{item.qty}</span>
              <span>{formatNumber(item.price)}</span>
              <span style={{ fontWeight: 'bold' }}>{formatNumber(item.total)}</span>
            </div>
            {(item.hsn_code || item.tax_percent > 0) && (
              <div style={{ fontSize: '10px', color: '#444', paddingLeft: '2px' }}>
                {item.hsn_code && <span>{t('receipt.hsn')}:{item.hsn_code} </span>}
                {item.tax_percent > 0 && (
                  <span>{t('receipt.gstShort')}:{item.tax_percent}% ({t('receipt.cgstShort')}:{formatNumber(item.cgst)} {t('receipt.sgstShort')}:{formatNumber(item.sgst)})</span>
                )}
              </div>
            )}
          </div>
        ))}

        <div style={{ textAlign: 'center', fontSize: '11px' }}>{dashes}</div>

        {/* Summary */}
        <div style={{ fontSize: '11px', margin: '6px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('receipt.subtotal')}:</span>
            <span>Rs.{formatNumber(invoice.summary?.total || 0)}</span>
          </div>
          {(invoice.summary?.tax || 0) > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('receipt.cgst')}:</span>
                <span>Rs.{formatNumber(invoice.summary?.cgst || invoice.summary?.tax / 2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('receipt.sgst')}:</span>
                <span>Rs.{formatNumber(invoice.summary?.sgst || invoice.summary?.tax / 2)}</span>
              </div>
            </>
          )}
          {(invoice.discount || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('receipt.discount')}:</span>
              <span>-Rs.{formatNumber(invoice.discount)}</span>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px' }}>{doubleDashes}</div>

        {/* Grand Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', margin: '6px 0' }}>
          <span>{t('receipt.total')}:</span>
          <span>Rs.{formatNumber(invoice.summary?.grand_total || 0)}</span>
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px' }}>{doubleDashes}</div>

        {/* Payments */}
        {(invoice.payments || []).length > 0 && (
          <div style={{ fontSize: '11px', margin: '6px 0' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{t('receipt.payment')}:</div>
            {(invoice.payments || []).map((payment: any, index: number) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ textTransform: 'capitalize' }}>{t(`receipt.paymentMethods.${payment.method}`)}:</span>
                <span>Rs.{formatNumber(payment.amount)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: '11px' }}>{dashes}</div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '11px', margin: '8px 0 4px' }}>
          <div style={{ fontWeight: 'bold' }}>{t('receipt.thankYou')}</div>
          <div style={{ marginTop: '2px' }}>{t('receipt.visitAgain')}</div>
          <div style={{ marginTop: '4px', fontSize: '10px' }}>
            {t('receipt.computerGenerated')}
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