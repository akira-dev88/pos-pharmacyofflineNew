import { useState, useEffect } from "react";
import {
  getCustomers,
  createCustomer,
  getLedger,
  addCustomerPayment,
} from "../../../renderer/services/customerApi";
import { getSales, getInvoice } from "../../../renderer/services/saleApi"; // Add getInvoice

export function useCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const res = await getCustomers();
    setCustomers(Array.isArray(res) ? res : []);
  };

  const loadLedger = async (customerUUID: string) => {
    const data = await getLedger(customerUUID);
    setLedger(data);
  };

  const createNewCustomer = async (customerData: { name: string; mobile: string }) => {
    const newCustomer = await createCustomer(customerData);
    await loadCustomers();
    return newCustomer;
  };

  const addPayment = async (customerUUID: string, amount: number, method: string) => {
    await addCustomerPayment(customerUUID, { amount, method });
    await loadLedger(customerUUID);
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

  return {
    customers,
    selectedCustomer,
    setSelectedCustomer: handleSelectCustomer,
    ledger,
    sales,
    createNewCustomer,
    addPayment,
    loadSales,
    refreshCustomers: loadCustomers,
    getInvoice,
  };
}