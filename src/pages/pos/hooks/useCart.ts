// hooks/useCart.ts

import { useState, useEffect, useRef } from "react";
import {
  createCart,
  addItem,
  getCart,
  updateItem,
  removeItem,
  applyDiscount as applyDiscountApi,
} from "../../../renderer/services/cartApi";
import { checkoutCart } from "../../../renderer/services/saleApi";

export function useCart() {
  const [cartUUID, setCartUUID] = useState<string | null>(null);
  const [cartData, setCartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isCartInitializing, setIsCartInitializing] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [payments, setPayments] = useState([{ method: "cash", amount: 0 }]);
  const currentMethodRef = useRef("cash");

  // Helper function to normalize cart data structure
  const normalizeCartData = (data: any) => {
    if (data?.cart) return data;
    if (data?.data?.cart) return data.data;
    if (data?.items !== undefined || data?.summary !== undefined) {
      return { cart: data, summary: data.summary };
    }
    if (data?.success && data?.data) {
      if (data.data.cart) return data.data;
      return { cart: data.data, summary: data.data.summary };
    }
    return data;
  };

  // Wait for backend to be ready
  const waitForBackend = async (maxRetries = 15, delayMs = 2000): Promise<boolean> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await fetch('http://127.0.0.1:3000/health');
        if (res.ok) return true;
      } catch {
        // backend not ready yet
      }
      console.log(`⏳ Waiting for backend... attempt ${i + 1}/${maxRetries}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
    return false;
  };

  // Init cart
  useEffect(() => {
    async function init() {
      console.log("🟢 Initializing cart...");
      setIsCartInitializing(true);

      // Wait for backend to be ready first
      const backendReady = await waitForBackend();
      if (!backendReady) {
        alert("Backend not responding. Please restart the app.");
        setIsCartInitializing(false);
        return;
      }

      try {
        const res = await createCart();
        const cartUuid = res.cart_uuid || res.data?.cart_uuid;
        if (!cartUuid) throw new Error("No cart_uuid in response");

        setCartUUID(cartUuid);
        const cartResponse = await getCart(cartUuid);
        setCartData(normalizeCartData(cartResponse));
      } catch (error) {
        console.error("❌ Failed to create cart:", error);
        alert("Failed to initialize cart. Please restart the app.");
      } finally {
        setIsCartInitializing(false);
      }
    }
    init();
  }, []);

  // Auto-fill payment amount whenever grand total changes
  useEffect(() => {
    const cartGrandTotal =
      cartData?.summary?.grand_total ||
      cartData?.cart?.summary?.grand_total ||
      0;
    if (cartGrandTotal > 0) {
      setPayments([{ method: currentMethodRef.current, amount: cartGrandTotal }]);
    } else {
      setPayments([{ method: currentMethodRef.current, amount: 0 }]);
    }
  }, [cartData]);

  const refreshCart = async () => {
    if (!cartUUID) return;
    try {
      const response = await getCart(cartUUID);
      setCartData(normalizeCartData(response));
    } catch (error) {
      console.error("❌ Error refreshing cart:", error);
    }
  };

  const createFreshCart = async () => {
    const newCart = await createCart();
    const newCartUuid = newCart.cart_uuid || newCart.data?.cart_uuid;
    setCartUUID(newCartUuid);
    if (newCartUuid) {
      const newCartData = await getCart(newCartUuid);
      setCartData(normalizeCartData(newCartData));
    }
    setPayments([{ method: currentMethodRef.current, amount: 0 }]);
    setDiscount(0);
    return newCartUuid;
  };

  const addItemToCart = async (product: any) => {
    if (isCartInitializing) {
      alert("Cart is initializing, please wait a moment...");
      return;
    }
    if (!cartUUID) {
      alert("Cart not initialized. Please restart the app.");
      return;
    }
    setLoading(true);
    try {
      await addItem(cartUUID, product.product_uuid);
      await refreshCart();
    } catch (error: any) {
      console.error("❌ Error adding item to cart:", error);
      alert(`Failed to add item: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const increaseItem = async (item: any) => {
    if (!cartUUID) return;
    setLoading(true);
    try {
      await addItem(cartUUID, item.product_uuid);
      await refreshCart();
    } catch (error: any) {
      console.error("❌ Error increasing item:", error);
    } finally {
      setLoading(false);
    }
  };

  const decreaseItem = async (item: any) => {
    if (!cartUUID) return;
    setLoading(true);
    try {
      const newQty = item.quantity - 1;
      if (newQty <= 0) {
        await removeItem(cartUUID, item.product_uuid);
      } else {
        await updateItem(cartUUID, item.product_uuid, { quantity: newQty });
      }
      await refreshCart();
    } catch (error: any) {
      console.error("❌ Error decreasing item:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyDiscount = async (uuid: string | null, amount: number) => {
    if (!uuid) return;
    try {
      await applyDiscountApi(uuid, amount);
      await refreshCart();
    } catch (error) {
      console.error("❌ Error applying discount:", error);
    }
  };

  const checkout = async (
    paymentMethods: any[],
    customerUUID: string | null,
    selectedCustomer: any
  ) => {
    if (!cartUUID) {
      alert("Cart not initialized");
      return null;
    }

    const cartStatus = cartData?.status || cartData?.cart?.status;
    if (cartStatus === 'completed') {
      await createFreshCart();
      alert("New cart created. Please add items again.");
      return null;
    }

    const grandTotal = Number(
      cartData?.summary?.grand_total ||
      cartData?.cart?.summary?.grand_total ||
      0
    );

    // Parse amount safely — could be string from input
    const amountGiven = Number(paymentMethods[0]?.amount || 0);

    // Send grand total to backend (not cash given — change is frontend only)
    const normalizedPayments = paymentMethods.map((p, i) => ({
      method: p.method,
      amount: i === 0 ? grandTotal : Number(p.amount || 0)
    }));

    const totalSending = normalizedPayments.reduce((sum, p) => sum + p.amount, 0);

    if (amountGiven < grandTotal && !customerUUID) {
      alert(`Please enter full payment of ₹${grandTotal} or select a customer for credit.`);
      return null;
    }

    if (amountGiven < grandTotal && selectedCustomer) {
      const remainingCredit =
        (selectedCustomer.credit_limit || 0) - (selectedCustomer.credit_balance || 0);
      const newCredit = grandTotal - amountGiven;
      if (newCredit > remainingCredit) {
        alert(`Credit limit exceeded 🚫\nRemaining credit: ₹${remainingCredit}\nNeed: ₹${newCredit}`);
        return null;
      }
    }

    
    setLoading(true);
    console.log("🔍 PAYMENTS BEING SENT TO BACKEND:", JSON.stringify(normalizedPayments, null, 2));
    console.log("🔍 ORIGINAL PAYMENT METHODS:", JSON.stringify(paymentMethods, null, 2));
    try {
      const res = await checkoutCart(cartUUID, normalizedPayments, customerUUID);
      console.log("✅ Checkout response:", JSON.stringify(res, null, 2));

      if (!res.success) {
        throw new Error(res.error || res.message || "Checkout failed");
      }

      const invoice = res.invoice;
      console.log("📄 Invoice data:", JSON.stringify(invoice, null, 2));

      // Create new cart for next transaction
      await createFreshCart();

      return { success: true, invoice };
    } catch (err: any) {
      console.error("❌ Checkout failed:", err);
      if (err.message?.includes('not active') || err.message?.includes('completed')) {
        await createFreshCart();
        alert("Cart was reset. Please add items again.");
      } else {
        alert(err.message || "Checkout failed");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getCartItems = () => cartData?.cart?.items || cartData?.items || [];

  const getCartSummary = () =>
    cartData?.summary ||
    cartData?.cart?.summary ||
    { total: 0, tax: 0, grand_total: 0 };

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const grandTotal = Number(getCartSummary().grand_total || 0);
  const balance = totalPaid - grandTotal;

  return {
    cartUUID,
    cartData,
    loading,
    isCartInitializing,
    discount,
    setDiscount,
    payments,
    setPayments,
    totalPaid,
    grandTotal,
    balance,
    addItem: addItemToCart,
    increaseItem,
    decreaseItem,
    applyDiscount,
    checkout,
    refreshCart,
    getCartItems,
    getCartSummary,
    currentMethodRef,
  };
}