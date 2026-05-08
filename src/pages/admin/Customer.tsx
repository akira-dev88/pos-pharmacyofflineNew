import { useEffect, useState, useCallback } from "react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../../renderer/services/customerApi";
import CustomerLedgerModal from "./CustomerLedgerPage";
import { apiGet } from "../../renderer/services/api";
import { IonIcon } from "@ionic/react";
import {
  personAddOutline,
  createOutline,
  trashOutline,
  eyeOutline,
  closeOutline,
  peopleOutline,
  cashOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  timeOutline,
  callOutline,
  searchOutline,
} from "ionicons/icons";

export default function CustomerPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    address: "",
    gstin: "",
    credit_limit: 0,
  });

  const [aging, setAging] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);

  // 🔄 LOAD ALL DATA
  useEffect(() => {
    loadCustomers();
    loadInsights();
  }, []);

  const loadAllCustomerData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCustomers(),
        loadInsights(),
      ]);
    } catch (error) {
      console.error("Error loading customer data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh when refreshKey changes
  useEffect(() => {
    loadAllCustomerData();
  }, [refreshKey, loadAllCustomerData]);

  // Expose refresh function via window
 useEffect(() => {
    const handleRefresh = () => {
      console.log("📢 Received refresh customer page event");
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('refresh-customers', handleRefresh);
    
    return () => {
      window.removeEventListener('refresh-customers', handleRefresh);
    };
  }, []);

  // Existing loadCustomers and loadInsights functions remain the same
  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      console.log("✅ Customers data loaded:", data);
      setCustomers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading customers:", e);
      setCustomers([]);
    }
  };

  const loadInsights = async () => {
    try {
      const [agingResponse, reminderResponse] = await Promise.all([
        apiGet("/customers/aging"),
        apiGet("/customers/reminders"),
      ]);

      let agingData = [];
      if (agingResponse.success && agingResponse.data) {
        agingData = agingResponse.data;
      } else if (agingResponse.data && Array.isArray(agingResponse.data)) {
        agingData = agingResponse.data;
      } else if (Array.isArray(agingResponse)) {
        agingData = agingResponse;
      }

      let reminderData = [];
      if (reminderResponse.success && reminderResponse.data) {
        reminderData = reminderResponse.data;
      } else if (reminderResponse.data && Array.isArray(reminderResponse.data)) {
        reminderData = reminderResponse.data;
      } else if (Array.isArray(reminderResponse)) {
        reminderData = reminderResponse;
      }

      setAging(agingData);
      setReminders(reminderData);
    } catch (e) {
      console.error("Insights error:", e);
      setAging([]);
      setReminders([]);
    }
  };

  // const loadCustomers = async () => {
  //   try {
  //     setLoading(true);
  //     const data = await getCustomers();
  //     console.log("✅ Customers data loaded:", data);
  //     setCustomers(Array.isArray(data) ? data : []);
  //   } catch (e) {
  //     console.error("Error loading customers:", e);
  //     setCustomers([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const loadInsights = async () => {
  //   try {
  //     const [agingResponse, reminderResponse] = await Promise.all([
  //       apiGet("/customers/aging"),
  //       apiGet("/customers/reminders"),
  //     ]);

  //     console.log("📊 Aging Response:", agingResponse);
  //     console.log("📊 Reminders Response:", reminderResponse);

  //     // Extract data from responses
  //     let agingData = [];
  //     if (agingResponse.success && agingResponse.data) {
  //       agingData = agingResponse.data;
  //     } else if (agingResponse.data && Array.isArray(agingResponse.data)) {
  //       agingData = agingResponse.data;
  //     } else if (Array.isArray(agingResponse)) {
  //       agingData = agingResponse;
  //     }

  //     let reminderData = [];
  //     if (reminderResponse.success && reminderResponse.data) {
  //       reminderData = reminderResponse.data;
  //     } else if (reminderResponse.data && Array.isArray(reminderResponse.data)) {
  //       reminderData = reminderResponse.data;
  //     } else if (Array.isArray(reminderResponse)) {
  //       reminderData = reminderResponse;
  //     }

  //     setAging(agingData);
  //     setReminders(reminderData);
  //   } catch (e) {
  //     console.error("Insights error:", e);
  //     setAging([]);
  //     setReminders([]);
  //   }
  // };

  // 🔁 RESET FORM
  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      mobile: "",
      address: "",
      gstin: "",
      credit_limit: 0,
    });
    setShowForm(false);
  };

  // 💾 SAVE
  const handleSave = async () => {
    if (!form.name) return alert("Name required");

    try {
      if (editing) {
        await updateCustomer(editing.customer_uuid, form);
        alert("Customer updated successfully");
      } else {
        await createCustomer(form);
        alert("Customer created successfully");
      }
      await loadCustomers(); // Reload the list
      resetForm();
    } catch (e) {
      console.error(e);
      alert("Save failed");
    }
  };

  // ✏️ EDIT
  const handleEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name,
      mobile: c.mobile || "",
      address: c.address || "",
      gstin: c.gstin || "",
      credit_limit: c.credit_limit || 0,
    });
    setShowForm(true);
  };

  // ❌ DELETE
  const handleDelete = async (uuid: string) => {
    if (!confirm("Delete customer?")) return;
    try {
      await deleteCustomer(uuid);
      alert("Customer deleted successfully");
      await loadCustomers(); // Reload the list
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Delete failed");
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile?.includes(searchTerm)
  );

  // Stats
  const totalCustomers = customers.length;
  const totalCredit = customers.reduce((sum, c) => {
    const credit = typeof c.credit_balance === 'number' ? c.credit_balance : Number(c.credit_balance) || 0;
    return sum + credit;
  }, 0);
  const overdueCustomers = customers.filter((c) => {
    const balance = typeof c.credit_balance === 'number' ? c.credit_balance : Number(c.credit_balance) || 0;
    const limit = typeof c.credit_limit === 'number' ? c.credit_limit : Number(c.credit_limit) || 0;
    return balance > limit;
  }).length;
  const activeCustomers = customers.filter((c) => {
    const balance = typeof c.credit_balance === 'number' ? c.credit_balance : Number(c.credit_balance) || 0;
    return balance === 0;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Customers</h1>
          <p className="text-gray-300 text-sm mt-1">Manage your customer relationships</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <IonIcon icon={personAddOutline} className="text-xl" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-start">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm">Total Customers</p>
              <p className="text-3xl font-bold mt-1">{totalCustomers}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <IonIcon icon={peopleOutline} className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-100 text-sm">Total Credit Outstanding</p>
              <p className="text-2xl font-bold mt-1">
                ₹{totalCredit.toLocaleString()}
              </p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <IonIcon icon={cashOutline} className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-orange-100 text-sm">Overdue Accounts</p>
              <p className="text-3xl font-bold mt-1">{overdueCustomers}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <IonIcon icon={alertCircleOutline} className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 text-sm">Active Customers</p>
              <p className="text-3xl font-bold mt-1">{activeCustomers}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <IonIcon icon={checkmarkCircleOutline} className="text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search customers by name or mobile..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <IonIcon icon={searchOutline} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Insights */}
        <div className="space-y-6">
          {/* Credit Aging */}
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <IonIcon icon={timeOutline} className="text-orange-600 text-lg" />
              </div>
              <h2 className="font-semibold text-gray-800">Credit Aging</h2>
            </div>

            {aging.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-6">No aging data</div>
            ) : (
              <div className="space-y-4">
                {aging.slice(0, 5).map((c, i) => (
                  <div key={i} className="border-b border-gray-100 pb-3">
                    <div className="font-medium text-gray-800 mb-2">{c.name}</div>
                    <div className="grid grid-cols-4 gap-1 text-xs">
                      <div className="text-center p-1 bg-gray-50 rounded">
                        <div className="text-gray-400">0-30</div>
                        <div className="font-semibold text-gray-700">₹{c.aging?.["0_30"] || 0}</div>
                      </div>
                      <div className="text-center p-1 bg-gray-50 rounded">
                        <div className="text-gray-400">31-60</div>
                        <div className="font-semibold text-gray-700">₹{c.aging?.["31_60"] || 0}</div>
                      </div>
                      <div className="text-center p-1 bg-gray-50 rounded">
                        <div className="text-gray-400">61-90</div>
                        <div className="font-semibold text-gray-700">₹{c.aging?.["61_90"] || 0}</div>
                      </div>
                      <div className="text-center p-1 bg-red-50 rounded">
                        <div className="text-gray-400">90+</div>
                        <div className="font-semibold text-red-600">₹{c.aging?.["90_plus"] || 0}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Reminders */}
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <IonIcon icon={alertCircleOutline} className="text-red-600 text-lg" />
              </div>
              <h2 className="font-semibold text-gray-800">Payment Reminders</h2>
            </div>

            {reminders.length === 0 ? (
              <div className="text-sm text-green-600 text-center py-6 flex items-center justify-center gap-2">
                <IonIcon icon={checkmarkCircleOutline} className="text-lg" />
                No pending dues
              </div>
            ) : (
              <div className="space-y-2">
                {reminders.slice(0, 5).map((r: any, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-medium text-gray-800">{r.name}</div>
                      <div className="text-xs text-red-500">{r.days} days overdue</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">₹{r.due || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Customer List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-800">Customer List</h2>
            <p className="text-xs text-gray-500 mt-1">{filteredCustomers.length} customers found</p>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                {searchTerm ? "No customers match your search" : "No customers found"}
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const availableCredit = (c.credit_limit || 0) - (c.credit_balance || 0);
                const isOverdue = (c.credit_balance || 0) > (c.credit_limit || 0);
                const creditPercentage = Math.min(((c.credit_balance || 0) / (c.credit_limit || 1)) * 100, 100);

                return (
                  <div key={c.customer_uuid} className="p-4 hover:bg-gray-50 transition-all group">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">{c.name?.charAt(0).toUpperCase() || '?'}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{c.name}</h3>
                            {c.mobile && (
                              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                <IonIcon icon={callOutline} className="text-xs" />
                                <span>{c.mobile}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Credit Info */}
                        <div className="mt-3 ml-12">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Credit Used</span>
                            <span className={isOverdue ? "text-red-600 font-semibold" : "text-gray-700"}>
                              ₹{c.credit_balance || 0} / ₹{c.credit_limit || 0}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isOverdue ? "bg-red-500" : "bg-green-500"}`}
                              style={{ width: `${creditPercentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Available: ₹{availableCredit.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Ledger"
                        >
                          <IonIcon icon={eyeOutline} className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                          title="Edit"
                        >
                          <IonIcon icon={createOutline} className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.customer_uuid)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <IonIcon icon={trashOutline} className="text-lg" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {editing ? "Edit Customer" : "Add New Customer"}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full transition">
                <IonIcon icon={closeOutline} className="text-xl text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  placeholder="Customer name"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input
                  placeholder="Mobile number"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  placeholder="Address"
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                <input
                  placeholder="GSTIN"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                <input
                  type="number"
                  placeholder="Credit limit"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.credit_limit}
                  onChange={(e) => setForm({ ...form, credit_limit: Number(e.target.value) })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold transition-all"
                >
                  {editing ? "Update Customer" : "Create Customer"}
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {selectedCustomer && (
        <CustomerLedgerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}