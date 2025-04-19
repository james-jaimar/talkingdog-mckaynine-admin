
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

  const COLORS = ["#10B981", "#6366F1", "#F59E0B", "#EC4899"];

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

    const data: AllocationCategory[] = [
      { 
        name: 'Trainer Compensation', 
        value: total * 0.60,
        color: COLORS[0]
      },
      { 
        name: 'Franchise Royalties', 
        value: total * 0.15,
        color: COLORS[1]
      },
      { 
        name: 'Branch Operations', 
        value: total * 0.20,
        color: COLORS[2]
      },
      { 
        name: 'Admin Fees', 
        value: total * 0.05,
        color: COLORS[3]
      }
    ];

    setAllocationData(data);
  }, [invoices, showOnlyPaid]);

  return { allocationData, totalRevenue };
}
