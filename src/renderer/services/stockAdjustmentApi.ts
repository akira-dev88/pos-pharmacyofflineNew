import { apiGet, apiPost } from "./api";

export async function getStockAdjustments() {
  try {
    const response = await apiGet("/stock-adjustments");
    if (response?.success && Array.isArray(response.data)) {
      return response.data;
    }
    if (response && !response.success) {
      console.warn("Stock adjustments API error:", response.error);
      return [];
    }
    return [];
  } catch (error) {
    console.error("Failed to load stock adjustments:", error);
    return [];
  }
}

export async function createStockAdjustment(data: {
  product_uuid: string;
  batch_uuid: string;
  adjustment_type: string;
  quantity: number;
  note?: string;
}) {
  try {
    const response = await apiPost("/stock-adjustments", data);
    return response.data || response;
  } catch (error) {
    console.error("Failed to create stock adjustment:", error);
    return { success: false, error: "Stock adjustment failed" };
  }
}
