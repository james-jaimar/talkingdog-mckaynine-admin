
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
    // These percentages MUST add up to exactly 100% (1.0)
    const targetPercentages = {
      trainerCompensation: 0.60, // 60%
      franchiseRoyalties: 0.15,  // 15%
      branchOperations: 0.20,    // 20%
      adminFees: 0.05            // 5%
    };
    
    // Verify that target percentages add up to 100%
    const percentageSum = Object.values(targetPercentages).reduce((sum, p) => sum + p, 0);
    console.assert(
      Math.abs(percentageSum - 1) < 0.001, 
      `Allocation percentages must add to 100%, got ${percentageSum * 100}%`
    );
    
    // Calculate values based on percentages
    const trainerCompensation = total * targetPercentages.trainerCompensation;
    const franchiseRoyalties = total * targetPercentages.franchiseRoyalties;
    const branchOperations = total * targetPercentages.branchOperations;
    const adminFees = total * targetPercentages.adminFees;
    
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
