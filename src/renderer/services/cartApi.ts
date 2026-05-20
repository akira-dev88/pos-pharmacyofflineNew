import { apiPost, apiGet, apiPut, apiDelete } from "./api";

// Create Cart
export async function createCart() {
  const response = await apiPost("/carts", {});
  // Backend returns { success, data: { cart_uuid, ... } }
  return response.data || response;
}

// Get Cart
export async function getCart(cart_uuid: string) {
  const response = await apiGet(`/carts/${cart_uuid}`);
  return response.data || response;
}

// Add Item (quantity always 1, backend stacks)
export async function addItem(cart_uuid: string, product_uuid: string) {
  const response = await apiPost(`/carts/${cart_uuid}/items`, {
    product_uuid,
    quantity: 1,
  });
  return response.data || response;
}

// Update Item (quantity / price / discount / tax_percent)
export async function updateItem(
  cart_uuid: string,
  product_uuid: string,
  data: { quantity?: number; price?: number; discount?: number; tax_percent?: number }
) {
  const response = await apiPut(`/carts/${cart_uuid}/items/${product_uuid}`, data);
  return response.data || response;
}

// Remove Item
export async function removeItem(cart_uuid: string, product_uuid: string) {
  const response = await apiDelete(`/carts/${cart_uuid}/items/${product_uuid}`);
  return response.data || response;
}

// Apply Bill Discount
export async function applyDiscount(cart_uuid: string, discount: number) {
  const response = await apiPost(`/carts/${cart_uuid}/discount`, { discount });
  return response.data || response;
}

// Hold Cart
export async function holdCart(cart_uuid: string) {
  const response = await apiPost(`/carts/${cart_uuid}/hold`, {});
  return response.data || response;
}

// Resume Held Cart
export async function resumeCart(cart_uuid: string) {
  const response = await apiPost(`/carts/${cart_uuid}/resume`, {});
  return response.data || response;
}

// Get Held Carts
export async function getHeldCarts() {
  const response = await apiGet("/carts/held");
  if (response?.success && Array.isArray(response.data)) return response.data;
  return [];
}

// Clear Cart
export async function clearCart(cart_uuid: string) {
  const response = await apiPost(`/carts/${cart_uuid}/clear`, {});
  return response.data || response;
}

// Checkout — note: route is POST /carts/:cart_uuid/checkout
// payments: [{ method: "cash"|"upi"|"card"|"pay_later", amount: number }]
export async function checkoutCart(
  cart_uuid: string,
  payments: { method: string; amount: number }[],
  customer_uuid: string | null
) {
  const response = await apiPost(`/carts/${cart_uuid}/checkout`, {
    payments,
    customer_uuid,
  });
  // Return full response so useCart can read response.success and response.invoice
  return response;
}

// Custom Item (if your backend supports it)
export async function addCustomItem(
  cart_uuid: string,
  item: { name: string; price: number; gst_percent: number; quantity: number }
) {
  const response = await apiPost(`/carts/${cart_uuid}/custom-item`, item);
  return response.data || response;
}