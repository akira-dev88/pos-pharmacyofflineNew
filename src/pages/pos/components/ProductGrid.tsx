import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Product } from "../../../renderer/types/product";
import { getProductBatches, getProductUnits } from "../../../renderer/services/productApi";
import { IonIcon } from "@ionic/react";
import { alertCircleOutline, timeOutline, closeOutline } from "ionicons/icons";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  onAddItem: (product: Product, unitUuid: string, quantity: number, unitName: string) => void;
}

interface BatchInfo {
  batch_uuid: string;
  batch_number: string;
  expiry_date: string;
  selling_price: number;
  quantity: number;
  sold_quantity: number;
  available: number;
}

interface ProductUnit {
  unit_uuid: string;
  unit_name: string;
  conversion_factor: number;
  price: number | null;
  is_base_unit: boolean;
}

// Predefined color classes
const colorClasses = [
  'bg-blue-100 hover:bg-blue-200 text-blue-800',
  'bg-purple-100 hover:bg-purple-200 text-purple-800',
  'bg-pink-100 hover:bg-pink-200 text-pink-800',
  'bg-green-100 hover:bg-green-200 text-green-800',
  'bg-yellow-100 hover:bg-yellow-200 text-yellow-800',
  'bg-indigo-100 hover:bg-indigo-200 text-indigo-800',
  'bg-teal-100 hover:bg-teal-200 text-teal-800',
  'bg-orange-100 hover:bg-orange-200 text-orange-800',
  'bg-cyan-100 hover:bg-cyan-200 text-cyan-800',
  'bg-amber-100 hover:bg-amber-200 text-amber-800',
  'bg-lime-100 hover:bg-lime-200 text-lime-800',
  'bg-emerald-100 hover:bg-emerald-200 text-emerald-800',
  'bg-rose-100 hover:bg-rose-200 text-rose-800',
  'bg-sky-100 hover:bg-sky-200 text-sky-800',
  'bg-violet-100 hover:bg-violet-200 text-violet-800',
];

// Get color based on stock status
const getStockColorClass = (product: Product): string | null => {
  const stock = product.stock ?? 0;
  if (stock === 0) {
    return 'bg-red-100 hover:bg-red-200 text-red-800';
  }
  if (stock < 10) {
    return 'bg-orange-100 hover:bg-orange-200 text-orange-800';
  }
  return null;
};

// Calculate days until expiry
const getDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Unit Selection Modal Component
function UnitSelectionModal({ 
  isOpen, 
  product, 
  units, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean; 
  product: Product | null; 
  units: ProductUnit[];
  onClose: () => void;
  onConfirm: (unitUuid: string, quantity: number, unitName: string, price: number) => void;
}) {
  const [selectedUnitUuid, setSelectedUnitUuid] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(null);

  useEffect(() => {
    if (units.length > 0 && !selectedUnitUuid) {
      const defaultUnit = units.find(u => u.is_base_unit) || units[0];
      setSelectedUnitUuid(defaultUnit.unit_uuid);
      setSelectedUnit(defaultUnit);
    }
  }, [units]);

  useEffect(() => {
    const unit = units.find(u => u.unit_uuid === selectedUnitUuid);
    setSelectedUnit(unit || null);
  }, [selectedUnitUuid, units]);

  if (!isOpen || !product) return null;

  const getUnitPrice = (unit: ProductUnit | null) => {
    if (!unit) return product.price;
    return unit.price || product.price;
  };

  const totalPrice = (getUnitPrice(selectedUnit) * quantity).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 p-5 text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Add to Cart</h2>
              <p className="text-sm text-green-100 mt-0.5">{product.name}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
              <IonIcon icon={closeOutline} className="text-2xl" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Unit Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Unit Type
            </label>
            <select
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={selectedUnitUuid}
              onChange={(e) => setSelectedUnitUuid(e.target.value)}
            >
              {units.map((unit) => (
                <option key={unit.unit_uuid} value={unit.unit_uuid}>
                  {unit.unit_name} {unit.is_base_unit && "(Base Unit)"}
                  {unit.price && ` - ₹${unit.price}`}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-xl font-bold"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                className="w-24 text-center border border-gray-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-xl font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Price Preview */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Unit Price:</span>
              <span className="font-semibold text-gray-800">
                ₹{getUnitPrice(selectedUnit).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
              <span className="text-gray-600">Total Price:</span>
              <span className="text-xl font-bold text-green-600">
                ₹{totalPrice}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedUnit) {
                  onConfirm(
                    selectedUnitUuid,
                    quantity,
                    selectedUnit.unit_name,
                    getUnitPrice(selectedUnit)
                  );
                }
              }}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductGrid({ products, loading, onAddItem }: ProductGridProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [recentUUIDs, setRecentUUIDs] = useState<string[]>([]);
  const [batchInfo, setBatchInfo] = useState<Record<string, BatchInfo[]>>({});
  const [loadingBatch, setLoadingBatch] = useState<Record<string, boolean>>({});
  
  // Unit selection modal state
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);

  // Load batch info for products
  const loadBatchInfoForProduct = async (productUuid: string) => {
    if (batchInfo[productUuid] || loadingBatch[productUuid]) return;
    
    setLoadingBatch(prev => ({ ...prev, [productUuid]: true }));
    try {
      const batches = await getProductBatches(productUuid);
      const availableBatches = batches
        .filter((b: any) => {
          const available = (b.quantity || 0) - (b.sold_quantity || 0);
          return available > 0 && new Date(b.expiry_date) > new Date();
        })
        .map((b: any) => ({
          ...b,
          available: (b.quantity || 0) - (b.sold_quantity || 0)
        }))
        .sort((a: any, b: any) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
      
      setBatchInfo(prev => ({ ...prev, [productUuid]: availableBatches }));
    } catch (err) {
      console.error("Failed to load batches:", err);
    } finally {
      setLoadingBatch(prev => ({ ...prev, [productUuid]: false }));
    }
  };

  // Load units for a product
  const loadProductUnits = async (productUuid: string): Promise<ProductUnit[]> => {
    try {
      const units = await getProductUnits(productUuid);
      return units.map((u: any) => ({
        unit_uuid: u.unit_uuid,
        unit_name: u.unit_name,
        conversion_factor: u.conversion_factor,
        price: u.price,
        is_base_unit: u.is_base_unit === 1
      }));
    } catch (err) {
      console.error("Failed to load units:", err);
      return [];
    }
  };

  // Handle product click - show unit selection modal
  const handleProductClick = async (product: Product) => {
    const units = await loadProductUnits(product.product_uuid);
    
    if (units.length === 0) {
      alert(`No units defined for ${product.name}. Please add pack sizes first.`);
      return;
    }
    
    setSelectedProduct(product);
    setProductUnits(units);
    setShowUnitModal(true);
  };

  // Handle unit selection confirmation
  const handleUnitConfirm = (unitUuid: string, quantity: number, unitName: string, price: number) => {
    if (selectedProduct) {
      // Pass the product, unit UUID, quantity, and unit name to the parent
      onAddItem(selectedProduct, unitUuid, quantity, unitName);
      
      // Update recent products
      setRecentUUIDs(prev => {
        const filtered = prev.filter(id => id !== selectedProduct.product_uuid);
        return [selectedProduct.product_uuid, ...filtered].slice(0, 20);
      });
    }
    setShowUnitModal(false);
    setSelectedProduct(null);
    setProductUnits([]);
  };

  // Load batch info for visible products
  useEffect(() => {
    if (products.length > 0) {
      const productsToLoad = products.slice(0, 20);
      productsToLoad.forEach(product => {
        const stock = product.stock ?? 0;
        if (stock > 0) {
          loadBatchInfoForProduct(product.product_uuid);
        }
      });
    }
  }, [products]);

  // Filter products based on search term
  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchLower))
    );
  });

  const sortedProducts = searchTerm
    ? filteredProducts
    : [
        ...filteredProducts.filter(p => recentUUIDs.includes(p.product_uuid))
          .sort((a, b) => recentUUIDs.indexOf(a.product_uuid) - recentUUIDs.indexOf(b.product_uuid)),
        ...filteredProducts.filter(p => !recentUUIDs.includes(p.product_uuid))
      ];

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3">
          <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-2">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="rounded-xl animate-pulse bg-gray-100 aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-3 sticky top-0 z-10 bg-[#141414]">
        <div className="relative">
          <input
            type="text"
            placeholder={t('pos.searchProducts')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-inter bg-white"
            autoComplete="off"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="text-xs text-gray-500 mt-1.5 ml-1">
            {t('pos.foundProducts', { count: filteredProducts.length })}
          </div>
        )}
      </div>

      {/* Product Grid - Perfect Squares */}
      <div className="overflow-y-auto p-3 grid grid-cols-3 gap-2 scrollbar-hide">
        {sortedProducts.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm">{t('pos.noProductsFound')}</p>
            <p className="text-xs mt-1">{t('pos.tryDifferentSearch')}</p>
          </div>
        ) : (
          sortedProducts.map((p, index) => {
            const stock = p.stock ?? 0;
            const stockColor = getStockColorClass(p);
            const productBatches = batchInfo[p.product_uuid] || [];
            const hasBatches = productBatches.length > 0;
            const nearestExpiry = hasBatches ? productBatches[0] : null;
            const daysUntilExpiry = nearestExpiry ? getDaysUntilExpiry(nearestExpiry.expiry_date) : null;
            const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 90 && daysUntilExpiry > 0;
            const batchCount = productBatches.length;

            let colorIndex: number;
            if (p.product_uuid) {
              const hash = p.product_uuid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              colorIndex = Math.abs(hash) % colorClasses.length;
            } else {
              colorIndex = index % colorClasses.length;
            }

            const colorClass = stockColor || colorClasses[colorIndex];
            const hasImage = !!(p as any).image;

            return (
              <div
                key={p.product_uuid}
                className={`border-2 ${hasImage ? 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800' : colorClass} rounded-xl cursor-pointer aspect-square flex flex-col justify-end p-3 transition-all duration-200 font-inter hover:scale-105 hover:shadow-lg relative overflow-hidden`}
                onClick={() => handleProductClick(p)}
              >
                {/* Background image */}
                {hasImage && (
                  <img
                    src={(p as any).image}
                    alt={p.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {/* Dark overlay for image cards */}
                {hasImage && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                )}

                {/* Content - Bottom Left */}
                <div className="relative z-10 w-full text-start">
                  {/* Product Name */}
                  <div className={`font-medium text-md truncate w-full ${hasImage ? 'text-white' : ''}`}>
                    {p.name}
                  </div>
                  
                  {/* Manufacturer (if available) */}
                  {p.manufacturer && (
                    <div className={`text-xs truncate mt-0.5 ${hasImage ? 'text-gray-300' : 'text-gray-500'}`}>
                      {p.manufacturer}
                    </div>
                  )}

                  {/* Price */}
                  <div className={`text-sm font-semibold mt-1 ${hasImage ? 'text-white' : ''}`}>
                    ₹{p.price}
                  </div>

                  {/* Prescription Required Badge */}
                  {p.prescription_required === 1 && (
                    <div className="mt-1">
                      <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full inline-block">
                        Rx Required
                      </span>
                    </div>
                  )}

                  {/* Batch & Expiry Info */}
                  {stock > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {isExpiringSoon && (
                        <div className={`text-xs flex items-center gap-1 ${hasImage ? 'text-orange-300' : 'text-orange-600'}`}>
                          <IonIcon icon={timeOutline} className="text-xs" />
                          <span>{daysUntilExpiry}d</span>
                        </div>
                      )}
                      
                      {batchCount > 1 && (
                        <div className={`text-xs flex items-center gap-1 ${hasImage ? 'text-gray-300' : 'text-gray-500'}`}>
                          <IonIcon icon={alertCircleOutline} className="text-xs" />
                          <span>{batchCount} batches</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stock Status Badges */}
                  <div className="mt-1">
                    {stock > 0 && stock < 10 && (
                      <div className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded-full inline-block">
                        Only {stock}
                      </div>
                    )}
                    {stock === 0 && (
                      <div className="text-xs bg-gray-600 text-white px-1.5 py-0.5 rounded-full inline-block">
                        Out
                      </div>
                    )}
                    {stock > 0 && !isExpiringSoon && batchCount === 1 && (
                      <div className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full inline-block">
                        In Stock
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Unit Selection Modal */}
      <UnitSelectionModal
        isOpen={showUnitModal}
        product={selectedProduct}
        units={productUnits}
        onClose={() => {
          setShowUnitModal(false);
          setSelectedProduct(null);
          setProductUnits([]);
        }}
        onConfirm={handleUnitConfirm}
      />
    </div>
  );
}