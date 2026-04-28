import { apiPost, apiGet, apiPut, apiDelete } from "./api";

// 🆕 Create Cart
export async function createCart() {
  return await apiPost("/carts", {});
}

// ➕ Add Item (increase also uses this)
export async function addItem(cart_uuid: string, product_uuid: string) {
  return await apiPost(`/carts/${cart_uuid}/items`, {
    product_uuid,
    quantity: 1,
  });
}

export async function checkout(cart_uuid: string, customer_uuid: string | null, payments: any[]) {
  return await apiPost(`/carts/${cart_uuid}/checkout`, {
    customer_uuid,
    payments
  });
}

// 📥 Get Cart
export async function getCart(cart_uuid: string) {
  return await apiGet(`/carts/${cart_uuid}`);
}

// ✏️ Update Item (quantity / price / discount)
export async function updateItem(
  cart_uuid: string,
  product_uuid: string,
  data: any
) {
  return await apiPut(`/carts/${cart_uuid}/items/${product_uuid}`, data);
}

// ❌ Remove Item
export async function removeItem(
  cart_uuid: string,
  product_uuid: string
) {
  return await apiDelete(`/carts/${cart_uuid}/items/${product_uuid}`);
}

export async function applyDiscount(cart_uuid: string, discount: number) {
  return await apiPost(`/carts/${cart_uuid}/discount`, {
    discount,
  });
}