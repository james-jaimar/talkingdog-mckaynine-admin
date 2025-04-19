
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

    // Using fixed percentages of total revenue for allocation categories
    const trainerCompensation = total * 0.60;
    const franchiseRoyalties = total * 0.15;
    const branchOperations = total * 0.20;
    const adminFees = total * 0.05;
    
    // Verify that all categories sum to total (accounting for potential floating point precision issues)
    const sum = trainerCompensation + franchiseRoyalties + branchOperations + adminFees;
    const adjustment = total - sum;
    
    const data: AllocationCategory[] = [
      { 
        name: 'Trainer Compensation', 
        value: trainerCompensation,
        color: COLORS[0]
      },
      { 
        name: 'Franchise Royalties', 
        value: franchiseRoyalties,
        color: COLORS[1]
      },
      { 
        name: 'Branch Operations', 
        value: branchOperations,
        color: COLORS[2]
      },
      { 
        name: 'Admin Fees', 
        value: adminFees + adjustment, // Add any rounding adjustment to the smallest category
        color: COLORS[3]
      }
    ];

    setAllocationData(data);
  }, [invoices, showOnlyPaid]);

  return { allocationData, totalRevenue };
}
