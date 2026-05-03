interface SalesModalProps {
  sales: any[];
  onClose: () => void;
  onViewInvoice: (saleUUID: string) => void;
}

export default function SalesModal({ sales, onClose, onViewInvoice }: SalesModalProps) {

  console.log('First sale object:', sales[0]);
  console.log('All sale keys:', Object.keys(sales[0] || {}));
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-black">Sales History</h2>
          <button onClick={onClose} className="text-black hover:text-gray-700">
            ✕
          </button>
        </div>

        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Invoice #</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-center">Status</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.sale_uuid} className="border-t">
                <td className="p-2">{new Date(sale.created_at).toLocaleDateString()}</td>
                <td className="p-2">{sale.invoice_no || sale.sale_uuid.slice(0, 8)}</td>
                <td className="p-2 text-right">
                  ₹{(
                    sale.total_amount ||
                    sale.totalAmount ||
                    sale.amount ||
                    sale.total ||
                    sale.grand_total ||
                    sale.final_amount ||
                    0
                  ).toLocaleString()}
                </td>
                <td className="p-2 text-center">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Completed
                  </span>
                </td>
                <td className="p-2 text-center">
                  <button
                    className="text-blue-600 hover:underline text-sm"
                    onClick={() => onViewInvoice(sale.sale_uuid)}
                  >
                    View Invoice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sales.length === 0 && (
          <div className="text-center text-gray-500 py-8">No sales found</div>
        )}
      </div>
    </div>
  );
}