import { apiGet } from "./api";

export async function getAuditLogs() {
  try {
    const response = await apiGet("/audit-logs");
    if (response?.success && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Failed to load audit logs:", error);
    return [];
  }
}
