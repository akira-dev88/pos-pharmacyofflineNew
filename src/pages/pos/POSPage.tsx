import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TopBar from "./components/TopBar";
import ProductGrid from "./components/ProductGrid";
import CartItems from "./components/CartItems";
import CartSummary from "./components/CartSummary";
import CustomerSelect from "./components/CustomerSelect";
import DiscountSection from "./components/DiscountSection";
import PaymentSection from "./components/PaymentSection";
import CustomerModal from "./modals/CustomerModal";
import SalesModal from "./modals/SalesModal";
import CustomerStatement from "../admin/CustomerStatement";
import { useCart } from "./hooks/useCart";
import { useProducts } from "./hooks/useProducts";
import { useCustomers } from "./hooks/useCustomers";
import { IonIcon } from '@ionic/react';
import { storefrontOutline } from 'ionicons/icons';
import InvoiceReceipt from "./components/InvoiceReceipt";
import { getSettings } from "../../renderer/services/settingsApi";

function POSpage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Refs for scrollable containers
  const productGridRef = useRef<HTMLDivElement>(null);
  const cartItemsRef = useRef<HTMLDivElement>(null);
  const paymentSummaryRef = useRef<HTMLDivElement>(null);

  const { products, loading: productsLoading } = useProducts();
  const {
    cartUUID,
    cartData,
    addItem,
    increaseItem,
    decreaseItem,
    applyDiscount,
    checkout,
    refreshCart,
    discount,
    setDiscount,
    payments,
    setPayments,
    totalPaid,
    grandTotal,
    balance,
    loading: cartLoading,
    isCartInitializing,
  } = useCart();

  const {
    customers,
    selectedCustomer,
    setSelectedCustomer,
    ledger,
    createNewCustomer,
    addPayment,
    loadSales,
    sales,
  } = useCustomers();

  const [shopSettings, setShopSettings] = useState<any>(null);

  useEffect(() => {
    getSettings().then(res => {
      if (res?.data) setShopSettings(res.data);
      else if (res?.shop_name) setShopSettings(res);
    });
  }, []);

  // Save scroll positions function
  const saveScrollPositions = () => {
    const scrollState = {
      productGrid: productGridRef.current?.scrollTop || 0,
      cartItems: cartItemsRef.current?.scrollTop || 0,
      paymentSummary: paymentSummaryRef.current?.scrollTop || 0,
    };
    sessionStorage.setItem('pos_scroll_positions', JSON.stringify(scrollState));
    console.log('Saved scroll positions:', scrollState);
  };

  // Check cart status
  useEffect(() => {
    const checkCartStatus = async () => {
      if (cartData) {
        const status = cartData?.status || cartData?.cart?.status;
        console.log("Current cart status:", status);

        if (status === 'completed') {
          console.log("Cart completed, refreshing...");
          await refreshCart();
        }
      }
    };

    checkCartStatus();
  }, [cartData, refreshCart]);

  // Save scroll positions on scroll
  useEffect(() => {
    const handleProductScroll = () => saveScrollPositions();
    const handleCartScroll = () => saveScrollPositions();
    const handlePaymentScroll = () => saveScrollPositions();

    const productElement = productGridRef.current;
    const cartElement = cartItemsRef.current;
    const paymentElement = paymentSummaryRef.current;

    if (productElement) {
      productElement.addEventListener('scroll', handleProductScroll);
    }
    if (cartElement) {
      cartElement.addEventListener('scroll', handleCartScroll);
    }
    if (paymentElement) {
      paymentElement.addEventListener('scroll', handlePaymentScroll);
    }

    return () => {
      if (productElement) {
        productElement.removeEventListener('scroll', handleProductScroll);
      }
      if (cartElement) {
        cartElement.removeEventListener('scroll', handleCartScroll);
      }
      if (paymentElement) {
        paymentElement.removeEventListener('scroll', handlePaymentScroll);
      }
    };
  }, [cartData]);

  // Save scroll positions before navigating away
  useEffect(() => {
    return () => {
      saveScrollPositions();
    };
  }, []);

  // Save before page unload
  useEffect(() => {
    window.addEventListener('beforeunload', saveScrollPositions);
    return () => {
      window.removeEventListener('beforeunload', saveScrollPositions);
    };
  }, []);

  // Restore scroll positions when component mounts
  useEffect(() => {
    const restoreTimer = setTimeout(() => {
      const savedPositions = sessionStorage.getItem('pos_scroll_positions');
      console.log('Restoring scroll positions:', savedPositions);

      if (savedPositions) {
        try {
          const { productGrid, cartItems, paymentSummary } = JSON.parse(savedPositions);

          if (productGridRef.current && productGrid > 0) {
            productGridRef.current.scrollTop = productGrid;
          }
          if (cartItemsRef.current && cartItems > 0) {
            cartItemsRef.current.scrollTop = cartItems;
          }
          if (paymentSummaryRef.current && paymentSummary > 0) {
            paymentSummaryRef.current.scrollTop = paymentSummary;
          }
        } catch (error) {
          console.error('Error restoring scroll positions:', error);
        }
      }
    }, 150);

    return () => clearTimeout(restoreTimer);
  }, []);

  const handleCheckout = async () => {
    if (!cartUUID || !cartData) {
      alert("Cart not ready. Please wait...");
      return;
    }

    // Check if cart is active
    const cartStatus = cartData?.status || cartData?.cart?.status;
    if (cartStatus === 'completed') {
      console.log("Cart already completed, refreshing...");
      await refreshCart();
      alert("Cart was already processed. Please try again.");
      return;
    }

    // Check if cart has items
    const cartItems = cartData?.cart?.items || cartData?.items;
    if (!cartItems || cartItems.length === 0) {
      alert("No items in cart");
      return;
    }

    // Check if payment amount is valid
    if (totalPaid <= 0) {
      alert("Please enter a payment amount");
      return;
    }

    // Check if payment covers the total
    if (totalPaid < grandTotal && !selectedCustomer) {
      alert(`Total amount is ₹${grandTotal}. Please enter full payment or select a customer for credit.`);
      return;
    }

    const result = await checkout(
      payments,
      selectedCustomer?.customer_uuid || null,
      selectedCustomer
    );

    if (result?.success) {
      console.log("📄 Full invoice data:", JSON.stringify(result.invoice, null, 2));
      setInvoiceData(result.invoice);
      setShowInvoiceModal(true);
    }
  };

  const handleCloseInvoice = () => {
    setShowInvoiceModal(false);
    setInvoiceData(null);
    // Reset form after closing receipt
    setPayments([{ method: "cash", amount: 0 }]);
    setDiscount(0);
    setSelectedCustomer(null);
  };

  // Show loading screen while cart is initializing
  if (isCartInitializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#141414]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-white">Initializing cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#141414] font-inter overflow-hidden">
      <TopBar
        onNavigate={navigate}
        onShowSales={() => {
          loadSales();
          setShowSalesModal(true);
        }}
      />

      {/* 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden gap-3 p-3">

        {/* COLUMN 1: PRODUCTS */}
        <div className="w-1/2 flex flex-col min-h-0">
          <div className="px-3 font-bold text-white text-start">
            Products
          </div>
          <div
            ref={productGridRef}
            className="flex-1 overflow-y-auto scrollbar-hide"
            id="product-scroll-container"
          >
            <ProductGrid
              products={products}
              loading={productsLoading}
              onAddItem={addItem}
            />
          </div>
        </div>

        {/* COLUMN 2: CART ITEMS */}
        <div className="w-1/4 flex flex-col bg-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="p-4 font-bold text-white text-start border-b border-gray-800 flex justify-between items-center">
            <span>Cart Items</span>
            <span className="text-sm text-gray-400">
              {cartData?.cart?.items?.length || 0} items
            </span>
          </div>

          {/* Store Info - Not scrollable */}
<div className="m-3 p-3 bg-[#212121] rounded-xl flex-shrink-0">
  <div className="flex items-center gap-3">
    <div className="rounded-xl bg-black p-2">
      <IonIcon icon={storefrontOutline} className="text-2xl text-gray-300" />
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="text-base font-bold text-white">
          {shopSettings?.shop_name || 'My Store'}
        </div>
        {shopSettings?.gstin && (
          <div className="text-xs text-gray-400">GSTIN: {shopSettings.gstin}</div>
        )}
      </div>
      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
        <span>{shopSettings?.address || 'Set address in Settings'}</span>
      </div>
    </div>
  </div>
</div>

          {/* Cart Items List - Scrollable */}
          <div
            ref={cartItemsRef}
            className="flex-1 overflow-y-auto scrollbar-hide"
            id="cart-scroll-container"
          >
            {cartLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <CartItems
                items={cartData?.cart?.items || []}
                onIncrease={increaseItem}
                onDecrease={decreaseItem}
              />
            )}
          </div>
        </div>

        {/* COLUMN 3: PAYMENT SUMMARY */}
        <div className="w-1/4 flex flex-col bg-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="p-4 font-bold text-white text-start border-b border-gray-800 flex-shrink-0">
            Payment Summary
          </div>

          <div
            ref={paymentSummaryRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
            id="payment-scroll-container"
          >
            {/* Cart Summary */}
            <CartSummary
              total={cartData?.summary?.total || 0}
              tax={cartData?.summary?.tax || 0}
              grandTotal={grandTotal}
            />

            {/* Customer Select */}
            <CustomerSelect
              customers={customers}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
              onAddNew={() => setShowCustomerModal(true)}
            />

            {/* Discount Section */}
            <DiscountSection
              discount={discount}
              onDiscountChange={setDiscount}
              onApplyDiscount={() => applyDiscount(cartUUID, discount)}
            />

            {/* Payment Section */}
            <PaymentSection
              payments={payments}
              onPaymentChange={(index, field, value) => {
                const updated = [...payments];
                updated[index] = { ...updated[index], [field]: value };
                setPayments(updated);
              }}
              onAddRow={() =>
                setPayments([...payments, { method: "upi", amount: 0 }])
              }
              onRemoveRow={(index) => {
                const updated = payments.filter((_, i) => i !== index);
                setPayments(updated);
              }}
              totalPaid={totalPaid}
              balance={balance}
            />

            {/* Checkout Button */}
            <button
              className="w-full bg-green-600 text-white p-3 rounded-xl font-bold disabled:opacity-50 hover:bg-green-700 transition-colors"
              onClick={handleCheckout}
              disabled={cartLoading || !cartData?.cart?.items?.length || isCartInitializing}
            >
              {cartLoading ? "Processing..." : "Checkout"}
            </button>

            {/* Clear Due Button */}
            {selectedCustomer?.credit_balance > 0 && (
              <button
                className="w-full bg-orange-500 text-white p-2 rounded-xl text-sm hover:bg-orange-600 transition-colors"
                onClick={() => {
                  setPayments([
                    { method: "cash", amount: selectedCustomer.credit_balance },
                  ]);
                }}
              >
                Clear Old Due ₹{selectedCustomer.credit_balance}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCustomerModal && (
        <CustomerModal
          onClose={() => setShowCustomerModal(false)}
          onCreateCustomer={async (customerData) => {
            const newCustomer = await createNewCustomer(customerData);
            setSelectedCustomer(newCustomer);
            setShowCustomerModal(false);
          }}
        />
      )}

      {showSalesModal && (
        <SalesModal
          sales={sales}
          onClose={() => setShowSalesModal(false)}
          onViewInvoice={(saleUUID) => {
            console.log("View invoice:", saleUUID);
          }}
        />
      )}

      {/* Invoice Receipt Modal */}
      {showInvoiceModal && invoiceData && (
        <InvoiceReceipt
          invoice={invoiceData}
          onClose={handleCloseInvoice}
        />
      )}
    </div>
  );
}

export default POSpage;