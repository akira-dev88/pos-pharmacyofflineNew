import { useEffect, useState } from "react";
import { getStock, updateStock } from "../../renderer/services/stockApi";
import { IonIcon } from "@ionic/react";
import {
  refreshOutline,
  checkmarkCircleOutline,
  warningOutline,
  closeCircleOutline,
  createOutline,
  saveOutline,
  closeOutline,
  cubeOutline,
  trendingUpOutline,
  searchOutline,
  checkmarkOutline,
} from "ionicons/icons";

export default function Stock() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "ok">("all");
  const [error, setError] = useState<string | null>(null);

  const loadStock = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStock();

      // Ensure data is an array
      const stockData = Array.isArray(data) ? data : [];
      setItems(stockData);
    } catch (err: any) {
      console.error("Stock load error:", err);
      setError(err.message || "Failed to load stock data");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const handleUpdate = async (uuid: string) => {
    try {
      setLoading(true);
      setError(null);
      await updateStock(uuid, newStock);
      setEditing(null);
      setNewStock(0);
      await loadStock();
    } catch (err: any) {
      console.error("Stock update error:", err);
      setError(err.message || "Failed to update stock");
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats safely
  const totalProducts = items.length;
  const lowStockCount = items.filter((item) => item && item.stock < 10 && item.stock > 0).length;
  const outOfStockCount = items.filter((item) => item && item.stock === 0).length;
  const totalStock = items.reduce((sum, item) => sum + (item?.stock || 0), 0);

  // Filter items safely
  const filteredItems = items.filter((item) => {
    if (!item) return false;
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus =
      filterStatus === "all" ? true :
        filterStatus === "low" ? item.stock < 10 && item.stock > 0 :
          item.stock >= 10;
    return matchesSearch && matchesStatus;
  });

  if (error) {
    return (
      <div className="space-y-6 font-inter">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Stock Management</h1>
          <button
            onClick={loadStock}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <IonIcon icon={refreshOutline} className="text-xl" />
            <span>Retry</span>
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <IonIcon icon={warningOutline} className="text-5xl text-red-500 mx-auto mb-4" />
          <p className="text-red-700 font-medium">{error}</p>
          <p className="text-red-600 text-sm mt-2">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-inter">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white font-inter">Stock Management</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage your inventory levels</p>
        </div>
        <button
          onClick={loadStock}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          <IonIcon icon={refreshOutline} className="text-xl" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-start">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Products</p>
              <p className="text-3xl font-bold mt-1">{totalProducts}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <IonIcon icon={cubeOutline} className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 text-sm">Total Stock Units</p>
              <p className="text-3xl font-bold mt-1">{totalStock.toLocaleString()}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <IonIcon icon={trendingUpOutline} className="text-2xl" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-orange-100 text-sm">Low Stock</p>
              <p className="text-3xl font-bold mt-1">{lowStockCount}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <IonIcon icon={warningOutline} className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-red-100 text-sm">Out of Stock</p>
              <p className="text-3xl font-bold mt-1">{outOfStockCount}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <IonIcon icon={closeCircleOutline} className="text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <IonIcon icon={searchOutline} className="text-2xl" />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${filterStatus === "all"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus("low")}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${filterStatus === "low"
                ? "bg-orange-600 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setFilterStatus("ok")}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${filterStatus === "ok"
                ? "bg-green-600 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
          >
            In Stock
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Product</th>
                <th className="text-right p-4 text-sm font-semibold text-gray-600">Current Stock</th>
                <th className="text-center p-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-center p-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading stock data...</p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-gray-500">
                    {searchTerm ? "No products match your search" : "No stock data available"}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const stock = item?.stock || 0;
                  const isLow = stock < 10 && stock > 0;
                  const isOut = stock === 0;
                  const stockPercentage = Math.min((stock / 50) * 100, 100);

                  return (
                    <tr
                      key={item.product_uuid}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-all group"
                    >
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-gray-800">{item.name || "Unknown"}</div>
                          {item.sku && (
                            <div className="text-xs text-gray-400 font-mono mt-0.5">SKU: {item.sku}</div>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="text-right">
                          <div className={`text-xl font-bold ${isOut ? "text-red-600" :
                              isLow ? "text-orange-600" :
                                "text-green-600"
                            }`}>
                            {stock}
                          </div>
                          {/* Progress Bar */}
                          <div className="w-32 ml-auto mt-2">
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${isOut ? "bg-red-500" :
                                    isLow ? "bg-orange-500" :
                                      "bg-green-500"
                                  }`}
                                style={{ width: `${stockPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                            <IonIcon icon={closeCircleOutline} className="text-xs" />
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full animate-pulse">
                            <IonIcon icon={warningOutline} className="text-xs" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            <IonIcon icon={checkmarkCircleOutline} className="text-xs" />
                            In Stock
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        {editing === item.product_uuid ? (
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              className="w-24 border border-gray-300 rounded-lg p-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={newStock}
                              onChange={(e) => setNewStock(Number(e.target.value))}
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdate(item.product_uuid)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Save"
                            >
                              <IonIcon icon={checkmarkOutline} className="text-lg" />
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                              title="Cancel"
                            >
                              <IonIcon icon={closeOutline} className="text-lg" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (!item.product_uuid) {
                                console.error("Missing product_uuid for item", item);
                                return;
                              }
                              setEditing(item.product_uuid);
                              setNewStock(stock);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Update Stock"
                          >
                            <IonIcon icon={createOutline} className="text-lg" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions Footer */}
      {lowStockCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <IonIcon icon={warningOutline} className="text-orange-600 text-xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-800">Low Stock Alert</p>
                <p className="text-xs text-orange-600">
                  {lowStockCount} product{lowStockCount !== 1 ? 's are' : ' is'} running low on stock. Update inventory soon.
                </p>
              </div>
            </div>
            <button
              onClick={() => setFilterStatus("low")}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-all"
            >
              View Low Stock Items
            </button>
          </div>
        </div>
      )}
    </div>
  );
}