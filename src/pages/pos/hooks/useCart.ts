// hooks/useCart.ts

import { useState, useEffect } from "react";
import {
  createCart,
  addItem,
  getCart,
  updateItem,
  removeItem,
  applyDiscount as applyDiscountApi,
} from "../../../renderer/services/cartApi";
import { checkoutCart, getInvoice } from "../../../renderer/services/saleApi";

export function useCart() {
  const [cartUUID, setCartUUID] = useState<string | null>(null);
  const [cartData, setCartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isCartInitializing, setIsCartInitializing] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [payments, setPayments] = useState([{ method: "cash", amount: 0 }]);

  // Helper function to normalize cart data structure
  const normalizeCartData = (data: any) => {
    // If data is already in the expected format with cart property
    if (data?.cart) {
      return data;
    }

    // If data is wrapped in data property (API response structure)
    if (data?.data?.cart) {
      return data.data;
    }

    // If data itself is the cart object
    if (data?.items !== undefined || data?.summary !== undefined) {
      return { cart: data, summary: data.summary };
    }

    // If data has success and data properties
    if (data?.success && data?.data) {
      if (data.data.cart) {
        return data.data;
      }
      return { cart: data.data, summary: data.data.summary };
    }

    // Return as is
    return data;
  };

  // Init cart
  useEffect(() => {
    async function init() {
      console.log("🟢 Initializing cart...");
      setIsCartInitializing(true);
      try {
        const res = await createCart();
        console.log("✅ Cart created successfully:", res);

        // Handle different response structures
        const cartUuid = res.cart_uuid || res.data?.cart_uuid;
        if (!cartUuid) {
          throw new Error("No cart_uuid in response");
        }

        setCartUUID(cartUuid);

        // Fetch the cart data immediately after creation
        const cartResponse = await getCart(cartUuid);
        console.log("📦 Initial cart response:", cartResponse);

        const normalizedData = normalizeCartData(cartResponse);
        console.log("📦 Normalized cart data:", normalizedData);
        setCartData(normalizedData);
      } catch (error) {
        console.error("❌ Failed to create cart:", error);
        alert("Failed to initialize cart. Please refresh the page.");
      } finally {
        setIsCartInitializing(false);
      }
    }
    init();
  }, []);

  // Auto-fill first payment row
  useEffect(() => {
    const cartGrandTotal = cartData?.summary?.grand_total || cartData?.cart?.summary?.grand_total || 0;
    if (cartGrandTotal && !isCartInitializing) {
      setPayments((prev) => {
        if (prev.length === 1 && prev[0].amount === 0) {
          const newAmount = Number(cartGrandTotal);
          console.log("💰 Auto-filling payment amount:", newAmount);
          return [{ method: "cash", amount: newAmount }];
        }
        return prev;
      });
    }
  }, [cartData, isCartInitializing]);

  const refreshCart = async () => {
    if (!cartUUID) {
      console.log("⚠️ Cannot refresh cart: No cartUUID");
      return;
    }
    console.log("🔄 Refreshing cart for UUID:", cartUUID);
    try {
      const response = await getCart(cartUUID);
      console.log("📦 Raw refresh response:", response);

      const normalizedData = normalizeCartData(response);
      console.log("📦 Normalized refresh data:", normalizedData);
      setCartData(normalizedData);
    } catch (error) {
      console.error("❌ Error refreshing cart:", error);
    }
  };

  const addItemToCart = async (product: any) => {
    console.log("🛒 addItemToCart called with product:", product);
    console.log("📌 Current cartUUID:", cartUUID);
    console.log("📌 Is cart initializing:", isCartInitializing);

    if (isCartInitializing) {
      console.log("⏳ Cart is still initializing, waiting...");
      alert("Cart is initializing, please wait a moment...");
      return;
    }

    if (!cartUUID) {
      console.error("❌ Cannot add item: No cartUUID");
      alert("Cart not initialized. Please refresh the page.");
      return;
    }

    setLoading(true);
    try {
      console.log(`📤 Adding item ${product.product_uuid} to cart ${cartUUID}`);
      const response = await addItem(cartUUID, product.product_uuid);
      console.log("✅ Add item response:", response);

      console.log("🔄 Refreshing cart after add...");
      await refreshCart();
      console.log("✅ Item added and cart refreshed successfully");
    } catch (error: any) {
      console.error("❌ Error adding item to cart:", error);
      alert(`Failed to add item: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const increaseItem = async (item: any) => {
    console.log("⬆️ Increase item quantity:", item);
    if (!cartUUID) {
      console.error("❌ Cannot increase item: No cartUUID");
      return;
    }

    setLoading(true);
    try {
      console.log(`📤 Adding one more ${item.product_uuid} to cart`);
      await addItem(cartUUID, item.product_uuid);
      await refreshCart();
      console.log("✅ Item quantity increased successfully");
    } catch (error: any) {
      console.error("❌ Error increasing item:", error);
    } finally {
      setLoading(false);
    }
  };

  const decreaseItem = async (item: any) => {
    console.log("⬇️ Decrease item quantity:", item);
    if (!cartUUID) {
      console.error("❌ Cannot decrease item: No cartUUID");
      return;
    }

    setLoading(true);
    try {
      const newQty = item.quantity - 1;
      console.log(`New quantity would be: ${newQty}`);

      if (newQty <= 0) {
        console.log(`🗑️ Removing item ${item.product_uuid} from cart`);
        await removeItem(cartUUID, item.product_uuid);
      } else {
        console.log(`📝 Updating item ${item.product_uuid} to quantity ${newQty}`);
        await updateItem(cartUUID, item.product_uuid, { quantity: newQty });
      }
      await refreshCart();
      console.log("✅ Item quantity decreased successfully");
    } catch (error: any) {
      console.error("❌ Error decreasing item:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyDiscount = async (uuid: string | null, amount: number) => {
    if (!uuid) {
      console.log("⚠️ Cannot apply discount: No cartUUID");
      return;
    }
    console.log(`🏷️ Applying discount of ₹${amount} to cart ${uuid}`);
    try {
      await applyDiscountApi(uuid, amount);
      await refreshCart();
      console.log("✅ Discount applied successfully");
    } catch (error) {
      console.error("❌ Error applying discount:", error);
    }
  };

  // In useCart.ts, update the checkout function

  const checkout = async (
    paymentMethods: any[],
    customerUUID: string | null,
    selectedCustomer: any
  ) => {
    if (!cartUUID) {
      console.error("❌ Cannot checkout: No cartUUID");
      alert("Cart not initialized");
      return null;
    }

    // Check if cart is already completed
    const cartStatus = cartData?.status || cartData?.cart?.status;
    if (cartStatus === 'completed') {
      console.log("⚠️ Cart is already completed, creating a new cart...");
      alert("Cart was already processed. Creating a new cart...");

      const newCart = await createCart();
      const newCartUuid = newCart.cart_uuid || newCart.data?.cart_uuid;
      setCartUUID(newCartUuid);

      const newCartData = await getCart(newCartUuid);
      const normalizedData = normalizeCartData(newCartData);
      setCartData(normalizedData);
      setPayments([{ method: "cash", amount: 0 }]);
      setDiscount(0);

      alert("New cart created. Please try checkout again.");
      return null;
    }

    const totalPaid = paymentMethods.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const grandTotal = Number(cartData?.summary?.grand_total || cartData?.cart?.summary?.grand_total || 0);

    console.log("💳 Checkout initiated:", {
      cartUUID,
      totalPaid,
      grandTotal,
      customerUUID,
      selectedCustomer: selectedCustomer?.name,
      cartStatus
    });

    if (totalPaid < grandTotal && !customerUUID) {
      alert("Select customer for credit sale");
      return null;
    }

    if (totalPaid < grandTotal && selectedCustomer) {
      const remainingCredit =
        (selectedCustomer.credit_limit || 0) - (selectedCustomer.credit_balance || 0);
      const newCredit = grandTotal - totalPaid;
      if (newCredit > remainingCredit) {
        alert(`Credit limit exceeded 🚫\nRemaining credit: ₹${remainingCredit}\nNeed additional: ₹${newCredit}`);
        return null;
      }
    }

    setLoading(true);
    try {
      const res = await checkoutCart(cartUUID, paymentMethods, customerUUID);
      console.log("✅ Full checkout response:", JSON.stringify(res, null, 2));

      if (!res.success) {
        throw new Error(res.error || res.message || "Checkout failed");
      }

      // Extract sale data from response
      let saleData = null;
      if (res.data?.sale) {
        saleData = res.data.sale;
      } else if (res.sale) {
        saleData = res.sale;
      }

      console.log("📦 Sale data:", saleData);

      // Use invoice directly from backend response
      const invoice = res.invoice;
      console.log("📄 Full invoice data:", JSON.stringify(invoice, null, 2));

      // Create a new cart for next transaction
      console.log("🆕 Creating new cart for next transaction...");
      const newCart = await createCart();
      console.log("✅ New cart created:", newCart);

      const newCartUuid = newCart.cart_uuid || newCart.data?.cart_uuid;
      setCartUUID(newCartUuid);

      if (newCartUuid) {
        const newCartData = await getCart(newCartUuid);
        const normalizedData = normalizeCartData(newCartData);
        setCartData(normalizedData);
      }

      setPayments([{ method: "cash", amount: 0 }]);
      setDiscount(0);

      return { success: true, invoice };
    } catch (err: any) {
      console.error("❌ Checkout failed:", err);
      alert(err.message || "Checkout failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get cart items from normalized structure
  const getCartItems = () => {
    return cartData?.cart?.items || cartData?.items || [];
  };

  // Get cart summary from normalized structure
  const getCartSummary = () => {
    return cartData?.summary || cartData?.cart?.summary || { total: 0, tax: 0, grand_total: 0 };
  };

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const grandTotal = Number(getCartSummary().grand_total || 0);
  const balance = totalPaid - grandTotal;

  // Log cart state changes
  useEffect(() => {
    if (cartUUID) {
      const items = getCartItems();
      console.log("📦 Cart State Updated:", {
        cartUUID,
        hasCartData: !!cartData,
        itemsCount: items.length,
        items: items,
        grandTotal,
        isCartInitializing
      });
    }
  }, [cartUUID, cartData, grandTotal, isCartInitializing]);

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
  };
}