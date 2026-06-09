import { apiGet, apiPost } from "./api";

export async function getMedicineReturns() {
  try {
    const response = await apiGet("/medicine-returns");
    if (response?.success && Array.isArray(response.data)) {
      return response.data;
    }
    if (response && !response.success) {
      console.warn("Medicine returns API error:", response.error);
      return [];
    }
    return [];
  } catch (error) {
    console.error("Failed to load medicine returns:", error);
    return [];
  }
}

export async function createMedicineReturn(data: {
  sale_uuid?: string;
  product_uuid: string;
  batch_uuid: string;
  return_type: string;
  quantity: number;
  refund_amount?: number;
  reason?: string;
}) {
  const response = await apiPost("/medicine-returns", data);
  if (!response || response.success === false) {
    throw new Error(response?.error || "Medicine return failed");
  }
  return response.data || response;
}
