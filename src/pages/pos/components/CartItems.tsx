// src/pages/pos/components/CartItems.tsx

import { IonIcon } from '@ionic/react';
import { addOutline, removeOutline, trashOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

interface CartItem {
  id: number;
  product_uuid: string;
  unit_uuid: string;
  quantity: number;
  price: number;
  discount: number;
  tax_percent: number;
  product: {
    name: string;
    barcode?: string;
    manufacturer?: string;
    medicine_type?: string;
    schedule_type?: string;
    prescription_required?: number;
  };
}

interface CartItemsProps {
  items: CartItem[];
  onIncrease: (item: CartItem) => void;
  onDecrease: (item: CartItem) => void;
  onRemove?: (item: CartItem) => void;
}

export default function CartItems({
  items,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemsProps) {
  const { t } = useTranslation();

  // Debug: Log when items change
  useEffect(() => {
    console.log("🛒 CartItems received items update:", items);
    console.log("🛒 Number of items:", items.length);
  }, [items]);

  if (!items || items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-sm">{t('pos.noItems')}</p>
          <p className="text-xs mt-1">{t('pos.clickToAdd')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3">
      {items.map((item, index) => {
        const subtotal = item.price * item.quantity;
        const taxAmount =
          ((item.price * item.quantity - (item.discount || 0)) *
            item.tax_percent) /
          100;

        console.log(`🛒 Rendering item ${index + 1}:`, {
          name: item.product?.name,
          quantity: item.quantity,
          price: item.price,
          unit_uuid: item.unit_uuid
        });

        return (
          <div
            key={`${item.product_uuid}_${item.unit_uuid || index}`}
            className="bg-[#212121] rounded-xl p-3 transition-all hover:bg-[#2a2a2a]"
          >
            {/* Product Name + Remove */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium text-sm truncate">
                  {(item.product?.name || t('pos.unknownProduct')).replace(
                    '[Custom] ',
                    ''
                  )}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.product?.manufacturer && (
                    <span className="text-gray-500 text-xs truncate">
                      {item.product.manufacturer}
                    </span>
                  )}
                  {item.product?.schedule_type &&
                    item.product.schedule_type !== 'NONE' && (
                      <span className="text-xs bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded shrink-0">
                        Sch {item.product.schedule_type}
                      </span>
                    )}
                  {item.product?.prescription_required ? (
                    <span className="text-xs bg-orange-900/40 text-orange-400 px-1.5 py-0.5 rounded shrink-0">
                      Rx
                    </span>
                  ) : null}
                </div>
              </div>

              {onRemove && (
                <button
                  onClick={() => {
                    console.log("🗑 Removing item:", item.product?.name);
                    onRemove(item);
                  }}
                  className="text-red-500 hover:text-red-400 transition-colors p-1 shrink-0"
                >
                  <IonIcon icon={trashOutline} className="text-lg" />
                </button>
              )}
            </div>

            {/* Price + Quantity Controls */}
            <div className="flex justify-between items-center">
              <div className="text-white font-semibold">
                ₹{item.price.toFixed(2)}
              </div>

              <div className="flex items-center gap-2 bg-[#333333] rounded-lg">
                <button
                  onClick={() => {
                    console.log("➖ Decrease item:", item.product?.name);
                    onDecrease(item);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-white hover:bg-[#444444] rounded-l-lg transition-colors"
                >
                  <IonIcon icon={removeOutline} className="text-sm" />
                </button>

                <span className="text-white text-sm font-medium min-w-[24px] text-center">
                  {item.quantity}
                </span>

                <button
                  onClick={() => {
                    console.log("➕ Increase item:", item.product?.name);
                    onIncrease(item);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-white hover:bg-[#444444] rounded-r-lg transition-colors"
                >
                  <IonIcon icon={addOutline} className="text-sm" />
                </button>
              </div>
            </div>

            {/* Subtotal */}
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700">
              <span className="text-gray-400 text-xs">{t('pos.subtotal')}:</span>
              <span className="text-green-500 text-sm font-semibold">
                ₹{subtotal.toFixed(2)}
              </span>
            </div>

            {/* Tax */}
            {item.tax_percent > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-500 text-xs">
                  {t('pos.taxWithPercent', { percent: item.tax_percent })}:
                </span>
                <span className="text-gray-400 text-xs">
                  ₹{taxAmount.toFixed(2)}
                </span>
              </div>
            )}

            {/* Item discount badge */}
            {item.discount > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-500 text-xs">Discount:</span>
                <span className="text-blue-400 text-xs">
                  -₹{item.discount.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}