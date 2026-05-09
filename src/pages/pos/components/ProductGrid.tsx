import { useState } from "react";
import type { Product } from "../../../renderer/types/product";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  onAddItem: (product: Product) => void;
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

// Get color based on stock status (priority)
const getStockColorClass = (product: Product): string | null => {
  if (product.stock === 0) {
    return 'bg-red-100 hover:bg-red-200 text-red-800';
  }
  if (product.stock && product.stock < 10) {
    return 'bg-orange-100 hover:bg-orange-200 text-orange-800';
  }
  return null;
};

export default function ProductGrid({ products, loading, onAddItem }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter products based on search term
  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3">
          <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-4 gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-3 sticky top-0 z-10">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products by name, SKU, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-inter"
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
            Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Product Grid */}
      <div className="overflow-y-auto p-3 grid grid-cols-3 gap-2 scrollbar-hide">
        {filteredProducts.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm">No products found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        ) : (
          filteredProducts.map((p, index) => {
            const stockColor = getStockColorClass(p);

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
                className={`border-2 ${hasImage ? 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800' : colorClass} p-2 rounded-xl cursor-pointer h-40 2xl:h-56 flex flex-col justify-end items-start transition-all duration-200 font-inter hover:scale-105 hover:shadow-lg relative overflow-hidden`}
                onClick={() => onAddItem(p)}
              >
                {/* Background image */}
                {hasImage && (
                  <img
                    src={(p as any).image}
                    alt={p.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {/* Dark overlay for image cards so text is readable */}
                {hasImage && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                )}

                {/* Content */}
                <div className="relative z-10 w-full text-start">
                  <div className={`font-medium text-sm truncate w-full text-start ${hasImage ? 'text-white' : ''}`}>
                    {p.name}
                  </div>
                  <div className={`text-sm font-semibold ${hasImage ? 'text-white' : ''}`}>
                    ₹{p.price}
                  </div>
                  {p.stock !== undefined && p.stock < 10 && p.stock > 0 && (
                    <div className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full mt-1 inline-block">
                      Only {p.stock} left
                    </div>
                  )}
                  {p.stock === 0 && (
                    <div className="text-xs bg-gray-600 text-white px-2 py-0.5 rounded-full mt-1 inline-block">
                      Out of Stock
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}