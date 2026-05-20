// productApi.ts
import { apiGet, apiPost, apiPut, apiDelete } from "./api";

export async function getProducts(page = 1, limit = 20) {
  try {
    const response = await apiGet(`/products?page=${page}&limit=${limit}`);
    console.log("📦 Products API response:", response);

    // New backend returns { success, products, total }
    if (response && response.success && Array.isArray(response.products)) {
      return response.products;
    }
    // Old fallback: { success, data: [...] }
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response)) return response;

    console.warn("Unexpected products response structure", response);
    return [];
  } catch (error) {
    console.error("Failed to load products:", error);
    return [];
  }
}

export async function createProduct(data: any) {
  const response = await apiPost("/products", data);
  return response.data || response;
}

export async function updateProduct(uuid: string, data: any) {
  const response = await apiPut(`/products/${uuid}`, data);
  return response.data || response;
}

export async function deleteProduct(uuid: string) {
  const response = await apiDelete(`/products/${uuid}`);
  return response.data || response;
}

export async function searchProducts(q: string) {
  const response = await apiGet(`/products/search?q=${encodeURIComponent(q)}`);
  if (response && response.success && Array.isArray(response.data)) {
    return response.data;
  }
  return [];
}

export async function getLowStockProducts(threshold = 10) {
  const response = await apiGet(`/products/low-stock?threshold=${threshold}`);
  if (response && response.success && Array.isArray(response.data)) {
    return response.data;
  }
  return [];
}

// ── Product Units (new in hardware store backend) ──────────────────────────

export async function getProductUnits(product_uuid: string) {
  const response = await apiGet(`/product-units/product/${product_uuid}`);
  if (response && response.success && Array.isArray(response.data)) {
    return response.data;
  }
  return [];
}

export async function createProductUnit(data: {
  product_uuid: string;
  unit_name: string;
  conversion_factor: number;
  barcode?: string;
  price?: number;
  purchase_price?: number;
  is_base_unit?: boolean;
}) {
  const response = await apiPost("/product-units", data);
  return response.data || response;
}

export async function deleteProductUnit(unit_uuid: string) {
  const response = await apiDelete(`/product-units/${unit_uuid}`);
  return response.data || response;
}

// ── Migration (keep as-is) ─────────────────────────────────────────────────

export async function previewMigration(fileContent: string, fileType: string) {
  const response = await apiPost('/migration/preview', { fileContent, fileType });
  return response.data || response;
}

export async function confirmMigration(products: any[], onDuplicate: 'skip' | 'overwrite') {
  const response = await apiPost('/migration/confirm', { products, onDuplicate });
  return response.data || response;
}