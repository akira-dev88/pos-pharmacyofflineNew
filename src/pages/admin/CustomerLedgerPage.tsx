import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getCustomerLedger,
  addCustomerPayment,
} from "../../renderer/services/customerApi";
import CustomerStatement from "./CustomerStatement";
import { IonIcon } from "@ionic/react";
import {
  closeOutline,
  cashOutline,
  printOutline,
  logoWhatsapp,
  receiptOutline,
} from "ionicons/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CustomerLedgerModal({ customer, onClose }: any) {
  const { t } = useTranslation();
  const [ledger, setLedger] = useState<any[]>([]);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState("cash");

  useEffect(() => {
    load();
  }, [customer]);

  const load = async () => {
    const data = await getCustomerLedger(customer.customer_uuid);
    setLedger(Array.isArray(data) ? data : []);
  };

  const handlePayment = async () => {
    if (!amount) return alert(t('customerLedger.enterAmount'));

    await addCustomerPayment(customer.customer_uuid, {
      amount,
      method,
    });

    setAmount(0);
    await load();
    window.dispatchEvent(new CustomEvent('refresh-customers'));
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write("<html><body>");
    printWindow.document.write(
      document.getElementById("print-area")!.innerHTML
    );
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
  };

  const sendWhatsApp = () => {
    if (!customer.mobile) {
      return alert(t('customerLedger.noMobileNumber'));
    }

    const msg = `${t('customerLedger.whatsappMessage', { 
      name: customer.name, 
      balance: customer.credit_balance || 0 
    })}

- ${t('customerLedger.storeName')}
  `;

    const url = `https://wa.me/${customer.mobile}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-[720px] max-h-[85vh] flex flex-col shadow-xl border-slate-200 bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white text-lg">{customer.name}</CardTitle>
              <p className="text-blue-100 text-sm mt-0.5">
                {t('customerLedger.creditLabel')}: ₹{customer.credit_balance || 0}
              </p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <IonIcon icon={closeOutline} className="text-2xl" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Payment Controls */}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {t('customerLedger.amountPlaceholder')}
              </label>
              <Input
                type="number"
                placeholder={t('customerLedger.amountPlaceholder')}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="w-[130px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Method
              </label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="cash">{t('customerLedger.methodCash')}</SelectItem>
                  <SelectItem value="upi">{t('customerLedger.methodUPI')}</SelectItem>
                  <SelectItem value="card">{t('customerLedger.methodCard')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handlePayment} className="bg-green-600 hover:bg-green-700 text-white gap-1.5">
              <IonIcon icon={cashOutline} className="text-lg" />
              {t('customerLedger.payButton')}
            </Button>
            <Button variant="outline" onClick={handlePrint} className="gap-1.5">
              <IonIcon icon={printOutline} className="text-lg" />
              {t('customerLedger.printButton')}
            </Button>
            <Button variant="outline" onClick={sendWhatsApp} className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
              <IonIcon icon={logoWhatsapp} className="text-lg" />
              {t('customerLedger.whatsappButton')}
            </Button>
          </div>

          {/* Ledger Table */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-4 gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>{t('customerLedger.tableType')}</span>
              <span>{t('customerLedger.tableAmount')}</span>
              <span>{t('customerLedger.tableNote')}</span>
              <span>{t('customerLedger.tableDate')}</span>
            </div>
            <ScrollArea className="h-[320px]">
              {ledger.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  {t('customerLedger.noEntries')}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {ledger.map((l) => (
                    <div
                      key={l.id}
                      className="grid grid-cols-4 gap-2 px-4 py-3 text-sm hover:bg-slate-50/80 transition-colors"
                    >
                      <span>
                        <Badge
                          variant="secondary"
                          className={l.type === 'credit'
                            ? "bg-emerald-100 text-emerald-700 border-0 text-xs"
                            : "bg-red-100 text-red-700 border-0 text-xs"
                          }
                        >
                          {l.type === 'credit' ? t('customerLedger.creditType') : t('customerLedger.debitType')}
                        </Badge>
                      </span>
                      <span className={`font-medium ${l.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                        ₹{l.amount}
                      </span>
                      <span className="text-slate-500 truncate">{l.note || '-'}</span>
                      <span className="text-slate-400 text-xs">
                        {new Date(l.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Print Area (hidden) */}
          <div id="print-area" className="hidden">
            <CustomerStatement customer={customer} ledger={ledger} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
