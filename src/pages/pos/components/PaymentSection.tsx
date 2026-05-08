import { useState, useEffect } from 'react';

interface PaymentSectionProps {
  payments: Array<{ method: string; amount: number }>;
  onPaymentChange: (index: number, field: string, value: any) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  totalPaid: number;
  balance: number;
  grandTotal?: number;
}

export default function PaymentSection({
  payments,
  onPaymentChange,
  onAddRow,
  onRemoveRow,
  totalPaid,
  balance,
  grandTotal = 0,
}: PaymentSectionProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("cash");
  const [amountGiven, setAmountGiven] = useState<number>(0);

  // Sync amount when grandTotal changes (auto-fill)
  useEffect(() => {
    if (grandTotal > 0) {
      setAmountGiven(grandTotal);
      onPaymentChange(0, "amount", grandTotal);
    }
  }, [grandTotal]);

  const change = amountGiven - grandTotal;

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    onPaymentChange(0, "method", method);
    
    // When selecting "credit", set amount to grandTotal automatically
    if (method === "credit") {
      setAmountGiven(grandTotal);
      onPaymentChange(0, "amount", grandTotal);
    }
  };

  const handleAmountChange = (value: number) => {
    setAmountGiven(value);
    onPaymentChange(0, "amount", value);
  };

  const methods = [
    { id: "cash", label: "Cash", activeBorder: "border-green-500", activeBg: "bg-green-500/10", activeText: "text-green-500" },
    { id: "upi", label: "UPI", activeBorder: "border-purple-500", activeBg: "bg-purple-500/10", activeText: "text-purple-500" },
    { id: "credit", label: "Pay Later", activeBorder: "border-orange-500", activeBg: "bg-orange-500/10", activeText: "text-orange-500" },
  ];

  return (
    <div className="space-y-3">
      <div className="font-medium text-sm text-gray-300">Payment Method</div>

      {/* Method Selector */}
      <div className="grid grid-cols-3 gap-2">
        {methods.map(({ id, label, activeBorder, activeBg, activeText }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleMethodSelect(id)}
            className={`border-2 rounded-xl p-3 transition-all text-center ${
              selectedMethod === id
                ? `${activeBorder} ${activeBg}`
                : "border-gray-700 bg-[#212121] hover:border-gray-600"
            }`}
          >
            <span className={`text-sm font-medium ${
              selectedMethod === id ? activeText : "text-white"
            }`}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Bill Amount */}
      <div className="flex justify-between items-center bg-[#212121] rounded-xl px-3 py-2">
        <span className="text-gray-400 text-sm">Bill Amount</span>
        <span className="text-white font-bold text-lg">₹{grandTotal.toLocaleString()}</span>
      </div>

      {/* Amount Input - Show only for cash and upi */}
      {selectedMethod !== "credit" && (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            {selectedMethod === "cash" ? "Cash Given by Customer" : "Amount Paid"}
          </label>
          <div className="flex items-center gap-2 bg-[#212121] border border-gray-600 rounded-xl px-3 py-2 focus-within:border-green-500 transition-colors">
            <span className="text-gray-400 font-bold text-lg">₹</span>
            <input
              type="number"
              className="flex-1 bg-transparent text-white text-xl font-bold outline-none"
              value={amountGiven || ""}
              placeholder={grandTotal.toString()}
              onChange={(e) => handleAmountChange(Number(e.target.value))}
            />
            <button
              type="button"
              className="text-xs text-green-500 border border-green-500/50 px-2 py-1 rounded-lg hover:bg-green-500/10 transition-colors whitespace-nowrap"
              onClick={() => handleAmountChange(grandTotal)}
            >
              Exact
            </button>
          </div>
        </div>
      )}

      {/* Credit Info - Show when Pay Later is selected */}
      {selectedMethod === "credit" && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-3 py-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-orange-400 text-sm font-medium">Pay Later</span>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            This amount will be added to the customer's credit balance
          </p>
        </div>
      )}

      {/* Change / Due - Show only for cash and upi */}
      {selectedMethod !== "credit" && amountGiven > 0 && (
        <div className={`rounded-xl px-3 py-2 flex justify-between items-center ${
          change >= 0
            ? "bg-green-500/10 border border-green-500/30"
            : "bg-red-500/10 border border-red-500/30"
        }`}>
          <span className={`text-sm font-medium ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
            {change >= 0 ? "Change to Return" : "⚠️ Amount Due"}
          </span>
          <span className={`text-xl font-bold ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
            ₹{Math.abs(change).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}