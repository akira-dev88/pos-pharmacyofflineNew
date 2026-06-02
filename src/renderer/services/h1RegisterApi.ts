import { apiGet } from "./api";

export async function getH1Register() {
  try {
    const response = await apiGet("/h1-register");
    if (response?.success && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Failed to load H1 register:", error);
    return [];
  }
}

export async function getH1RegisterByDateRange(from: string, to: string) {
  try {
    const response = await apiGet(`/h1-register/date-range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    if (response?.success && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Failed to load H1 register by date range:", error);
    return [];
  }
}
