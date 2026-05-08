import { apiGet, apiPost, apiPut, apiDelete } from "./api";

export interface Customer {
  customer_uuid: string;
  name: string;
  mobile?: string;
  address?: string;
  gstin?: string;
  credit_balance?: number;
  created_at: string;
}

export async function getCustomers() {
  const response = await apiGet("/customers");
  console.log("Raw customers API response:", response);
  
  // Extract the data array from the response
  // Your API returns: { success: true, data: [...] }
  if (response.success && response.data) {
    return response.data;
  }
  
  // If response already has data property
  if (response.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  // If response is already an array
  if (Array.isArray(response)) {
    return response;
  }
  
  // Return empty array as fallback
  console.warn("Unexpected customers response structure:", response);
  return [];
}

export async function createCustomer(data: any) {
  const response = await apiPost("/customers", data);
  return response.data || response;
}

export async function getLedger(customer_uuid: string) {
  const response = await apiGet(`/customers/${customer_uuid}/ledger`);
  return response.data || response;
}

export async function addCustomerPayment(
  customer_uuid: string,
  data: { amount: number; method: string }
) {
  const response = await apiPost(`/customers/${customer_uuid}/payments`, data);
  return response.data || response;
}

// ✏️ update
export async function updateCustomer(uuid: string, data: Partial<Customer>) {
  const response = await apiPut(`/customers/${uuid}`, data);
  return response.data || response;
}

// ❌ delete
export async function deleteCustomer(uuid: string) {
  const response = await apiDelete(`/customers/${uuid}`);
  return response.data || response;
}

// 📊 ledger
export async function getCustomerLedger(uuid: string) {
  const response = await apiGet(`/customers/${uuid}/ledger`);
  return response.data || response;
}

export async function getCustomerSummary(): Promise<any> {
  const response = await apiGet("/customers/summary");
  const data = response.data || response;
  return {
    ...data,
    total_credit: Number(data.total_credit) || 0,
    customers_with_credit: Number(data.customers_with_credit) || 0,
    top_debtors: data.top_debtors || []
  };
}