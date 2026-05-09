// stockApi.ts
const BASE_URL = "http://127.0.0.1:3000/api";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

export async function getStock() {
  try {
    const res = await fetch(`${BASE_URL}/products`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    // Assuming the products endpoint returns { success: true, data: [...] }
    let products = Array.isArray(data) ? data : data?.data || [];

    // Normalize to ensure stock field exists
    const stockData = products.map((p: any) => ({
      product_uuid: p.product_uuid,
      name: p.name,
      sku: p.sku,
      stock: p.stock ?? 0,
      price: p.price,
    }));

    return stockData;
  } catch (error) {
    console.error("Stock API error:", error);
    return [];
  }
}

export async function updateStock(productUUID: string, stock: number) {
  try {
    const res = await fetch(`${BASE_URL}/products/${productUUID}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ stock }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log("Update stock response:", data);
    return data;
  } catch (error) {
    console.error("Update stock error:", error);
    throw error;
  }
}