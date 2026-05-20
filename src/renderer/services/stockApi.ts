// stockApi.ts
import { apiGet, apiPut } from "./api";

export async function getStock() {
  try {
    const response: any = await apiGet("/products?limit=1000");
    // New backend returns { success, products, total }
    if (response?.success && Array.isArray(response.products)) {
      return response.products.map((p: any) => ({
        product_uuid: p.product_uuid,
        name: p.name,
        sku: p.sku,
        stock: p.stock ?? 0,
        price: p.price,
      }));
    }
    // Fallback: old shape { success, data: [...] }
    if (response?.success && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Stock API error:", error);
    return [];
  }
}

export async function updateStock(productUUID: string, stock: number) {
  try {
    const response: any = await apiPut(`/products/${productUUID}`, { stock });
    return response?.data || response;
  } catch (error) {
    console.error("Update stock error:", error);
    throw error;
  }
}