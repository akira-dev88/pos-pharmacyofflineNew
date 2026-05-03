import { apiGet, apiPost } from "./api";

export interface Sale {
  sale_uuid: string;
  invoice_number: string;
  grand_total: number | string;
  created_at: string;
  customer?: any;
}

export interface Invoice {
  invoice_no: string | undefined;
  total_amount: any;
  gst: any;
  customer_name: any;
  cart: any;
  customer_name: any;
  cart: any;
  invoice_number?: string;
  sale_uuid?: string;
  created_at?: string;
  grand_total?: number;
  total?: number;
  tax?: number;
  subtotal?: number;
  customer?: any;
  items?: any[];
  payments?: any[];
  shop?: any;
  summary?: any;
}

export async function getSales(): Promise<Sale[]> {
  const response: any = await apiGet("/sales");
  // Expected response: { success: true, data: Sale[] }
  if (response && response.success && Array.isArray(response.data)) {
    return response.data;
  }
  if (Array.isArray(response)) {
    return response;
  }
  return [];
}

export async function getInvoice(saleUUID: string): Promise<Invoice> {
  const response: any = await apiGet(`/sales/${saleUUID}/invoice`);
  return response.data || response;
}

export async function checkoutCart(
  cart_uuid: string,
  payments: { method: string; amount: number }[],
  customer_uuid?: string | null
) {
  return await apiPost(`/carts/${cart_uuid}/checkout`, {
    payments,
    customer_uuid: customer_uuid || null,
  });
}