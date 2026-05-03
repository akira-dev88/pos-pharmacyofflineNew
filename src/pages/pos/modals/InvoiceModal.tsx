interface InvoiceModalProps {
  invoiceId: string;
  onClose: () => void;
}

export default function InvoiceModal({ invoiceId, onClose }: InvoiceModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Invoice #{invoiceId}</h2>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>
        <div className="p-4">
          <p>Invoice details for: {invoiceId}</p>
          {/* Add your invoice details here */}
        </div>
      </div>
    </div>
  );
}