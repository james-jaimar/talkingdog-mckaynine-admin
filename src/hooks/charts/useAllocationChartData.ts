
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

  const COLORS = ["#10B981", "#6366F1", "#F59E0B", "#8B5CF6"];

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

    // Calculate total revenue from filtered invoices
    // Note: This is the full invoice total including enrollment fees
    const total = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    setTotalRevenue(total);

    // Sum the actual fee amounts from invoice data
    // Note: These fees should already be calculated on course fee only (excl enrollment fee)
    // If invoice doesn't have specific fee fields, fall back to percentage of total
    // (This fallback may slightly overstate fees for invoices with enrollment fees)
    const handlerFeeTotal = filteredInvoices.reduce((sum, invoice) => 
      sum + (invoice.trainer_fee || invoice.total * 0.40), 0);
    
    const franchiseFeeTotal = filteredInvoices.reduce((sum, invoice) => 
      sum + (invoice.franchise_fee || invoice.total * 0.15), 0);
    
    const adminFeeTotal = filteredInvoices.reduce((sum, invoice) => 
      sum + (invoice.admin_fee || invoice.total * 0.10), 0);
    
    // Calculate profit (remaining revenue after all fees)
    const totalFees = handlerFeeTotal + franchiseFeeTotal + adminFeeTotal;
    const profitTotal = total - totalFees;

    // Create allocation data with actual monetary values
    const data: AllocationCategory[] = [
      { 
        name: 'Handler Fee', 
        value: handlerFeeTotal,
        color: COLORS[0]
      },
      { 
        name: 'Franchise Fee', 
        value: franchiseFeeTotal,
        color: COLORS[1]
      },
      { 
        name: 'Admin Fee', 
        value: adminFeeTotal,
        color: COLORS[2]
      },
      { 
        name: 'Profit', 
        value: profitTotal,
        color: COLORS[3]
      }
    ];

    // Sort by value descending to make the chart clearer
    data.sort((a, b) => b.value - a.value);
    
    setAllocationData(data);
  }, [invoices, showOnlyPaid]);

  return { allocationData, totalRevenue };
}
