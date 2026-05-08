import { useState } from "react";
import { IonIcon } from '@ionic/react';
import { closeOutline, personAddOutline, callOutline, saveOutline } from 'ionicons/icons';

interface CustomerModalProps {
  onClose: () => void;
  onCreateCustomer: (data: { name: string; mobile: string }) => Promise<void>;
}

export default function CustomerModal({ onClose, onCreateCustomer }: CustomerModalProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !mobile) {
      alert("Please fill all fields");
      return;
    }
    setLoading(true);
    await onCreateCustomer({ name, mobile });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md shadow-2xl border border-gray-700 animate-fadeIn">
        {/* Header */}
        <div className="border-b border-gray-700 p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <IonIcon icon={personAddOutline} className="text-blue-400 text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-white">Add New Customer</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
          >
            <IonIcon icon={closeOutline} className="text-gray-400 text-xl" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Customer Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter customer name"
                  className="w-full bg-[#212121] border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Mobile Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mobile Number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="Enter mobile number"
                  className="w-full bg-[#212121] border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Used for customer identification and payment reminders
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-center gap-1 bg-blue-700 rounded-full w-max px-2 py-1">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-400 text-sm font-medium">Note</span>
            </div>
            <p className="text-gray-400 text-xs mt-1 text-start">
              Credit limit and address can be added later from the Customers page
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-gray-700 p-5 flex gap-3">
          <button
            className="flex-1 px-4 py-2.5 bg-[#2a2a2a] hover:bg-[#333333] text-white rounded-xl font-medium transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <IonIcon icon={saveOutline} className="text-lg" />
                <span>Create Customer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}