// hooks/useCustomers.ts
import { useState, useEffect } from "react";
import {
  getCustomers,
  createCustomer,
  getLedger,
  addCustomerPayment,
  getCustomerSummary,
} from "../../../renderer/services/customerApi";
import { getSales, getInvoice } from "../../../renderer/services/saleApi";

export function useCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [customerSummary, setCustomerSummary] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadCustomers = async () => {
    const res = await getCustomers();
    setCustomers(Array.isArray(res) ? res : []);
  };

  const loadCustomerSummary = async () => {
    try {
      const summary = await getCustomerSummary();
      setCustomerSummary(summary);
    } catch (error) {
      console.error("Error loading customer summary:", error);
    }
  };

  const loadLedger = async (customerUUID: string) => {
    const data = await getLedger(customerUUID);
    setLedger(data);
  };

  const createNewCustomer = async (customerData: { name: string; mobile: string; address?: string; gstin?: string; credit_limit?: number }) => {
    const newCustomer = await createCustomer(customerData);
    await loadCustomers();
    await loadCustomerSummary();
    return newCustomer;
  };

  const addPayment = async (customerUUID: string, amount: number, method: string) => {
    await addCustomerPayment(customerUUID, { amount, method });
    await loadLedger(customerUUID);
    await loadCustomers();
    await loadCustomerSummary();
  };

  const loadSales = async () => {
    const data = await getSales();
    setSales(data);
  };

  const handleSelectCustomer = async (customer: any) => {
    setSelectedCustomer(customer);
    if (customer) {
      await loadLedger(customer.customer_uuid);
    }
  };

  // Function to refresh all customer data
  const refreshAllCustomerData = async () => {
    console.log("🔄 Refreshing all customer data...");
    await Promise.all([
      loadCustomers(),
      loadCustomerSummary(),
    ]);
  };

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      console.log("📢 Received refresh customer event");
      refreshAllCustomerData();
    };
    
    window.addEventListener('refresh-customers', handleRefresh);
    
    // Initial load
    refreshAllCustomerData();
    
    return () => {
      window.removeEventListener('refresh-customers', handleRefresh);
    };
  }, []);

  return {
    customers,
    selectedCustomer,
    setSelectedCustomer: handleSelectCustomer,
    ledger,
    sales,
    customerSummary,
    createNewCustomer,
    addPayment,
    loadSales,
    refreshCustomers: loadCustomers,
    refreshCustomerSummary: loadCustomerSummary,
    refreshAllCustomerData,
    getInvoice,
  };
}