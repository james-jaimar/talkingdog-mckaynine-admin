
import { useState, useEffect } from 'react';
import { Invoice } from '@/types/invoice';

export type AllocationCategory = {
  name: string;
  value: number;
  color: string;
};

export function useAllocationChartData(invoices: Invoice[], showOnlyPaid: boolean = true) {
  const [allocationData, setAllocationData] = useState<AllocationCategory[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

  const COLORS = ["#10B981", "#6366F1", "#F59E0B"];

  useEffect(() => {
    if (!invoices?.length) {
      setAllocationData([]);
      setTotalRevenue(0);
      return;
    }

    // Filter invoices if needed
    const filteredInvoices = showOnlyPaid 
      ? invoices.filter(invoice => invoice.status === 'paid')
      : invoices;

    if (filteredInvoices.length === 0) {
      setAllocationData([]);
      setTotalRevenue(0);
      return;
    }

    // Calculate total revenue
    const total = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    setTotalRevenue(total);

    // Using correct percentages from the system
    const data: AllocationCategory[] = [
      { 
        name: 'Handler Fee', 
        value: total * 0.40, // 40% handler fee
        color: COLORS[0]
      },
      { 
        name: 'Franchise Fee', 
        value: total * 0.15, // 15% franchise fee
        color: COLORS[1]
      },
      { 
        name: 'Admin Fee', 
        value: total * 0.10, // 10% admin fee
        color: COLORS[2]
      }
    ];

    setAllocationData(data);
  }, [invoices, showOnlyPaid]);

  return { allocationData, totalRevenue };
}
