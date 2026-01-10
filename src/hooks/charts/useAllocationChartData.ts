
import { useState, useEffect } from 'react';
import { Invoice } from '@/types/invoice';
import { getCourseFeeAmount, getEnrollmentFeeAmount } from '@/lib/invoiceItemUtils';

export type AllocationCategory = {
  name: string;
  value: number;
  color: string;
};

interface InvoiceWithItems extends Invoice {
  invoice_items?: Array<{
    amount: number;
    description?: string;
    item_type?: string;
  }>;
}

export function useAllocationChartData(invoices: InvoiceWithItems[], showOnlyPaid: boolean = true) {
  const [allocationData, setAllocationData] = useState<AllocationCategory[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [courseFeeRevenue, setCourseFeeRevenue] = useState<number>(0);
  const [enrollmentFeeRevenue, setEnrollmentFeeRevenue] = useState<number>(0);

  const COLORS = ["#10B981", "#6366F1", "#F59E0B", "#8B5CF6"];

  useEffect(() => {
    if (!invoices?.length) {
      setAllocationData([]);
      setTotalRevenue(0);
      setCourseFeeRevenue(0);
      setEnrollmentFeeRevenue(0);
      return;
    }

    // Filter invoices if needed
    const filteredInvoices = showOnlyPaid 
      ? invoices.filter(invoice => invoice.status === 'paid')
      : invoices;

    if (filteredInvoices.length === 0) {
      setAllocationData([]);
      setTotalRevenue(0);
      setCourseFeeRevenue(0);
      setEnrollmentFeeRevenue(0);
      return;
    }

    // Calculate total revenue from filtered invoices (includes enrollment fees)
    const total = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    setTotalRevenue(total);

    // Calculate course fee revenue (excludes enrollment fees) - this is the base for fee calculations
    let courseFeeTotal = 0;
    let enrollmentFeeTotal = 0;

    filteredInvoices.forEach(invoice => {
      if (invoice.invoice_items && invoice.invoice_items.length > 0) {
        courseFeeTotal += getCourseFeeAmount(invoice.invoice_items);
        enrollmentFeeTotal += getEnrollmentFeeAmount(invoice.invoice_items);
      } else {
        // Fallback: if no items, treat full total as course fee
        courseFeeTotal += invoice.total;
      }
    });

    setCourseFeeRevenue(courseFeeTotal);
    setEnrollmentFeeRevenue(enrollmentFeeTotal);

    // Sum the actual fee amounts from invoice data
    // IMPORTANT: Fees are calculated on course fee only (excludes enrollment fees)
    const handlerFeeTotal = filteredInvoices.reduce((sum, invoice) => 
      sum + (invoice.trainer_fee || (invoice.invoice_items?.length 
        ? getCourseFeeAmount(invoice.invoice_items) * 0.40 
        : invoice.total * 0.40)), 0);
    
    const franchiseFeeTotal = filteredInvoices.reduce((sum, invoice) => 
      sum + (invoice.franchise_fee || (invoice.invoice_items?.length 
        ? getCourseFeeAmount(invoice.invoice_items) * 0.15 
        : invoice.total * 0.15)), 0);
    
    const adminFeeTotal = filteredInvoices.reduce((sum, invoice) => 
      sum + (invoice.admin_fee || (invoice.invoice_items?.length 
        ? getCourseFeeAmount(invoice.invoice_items) * 0.10 
        : invoice.total * 0.10)), 0);
    
    // Calculate profit (course fee revenue minus all fees)
    const totalFees = handlerFeeTotal + franchiseFeeTotal + adminFeeTotal;
    const profitTotal = courseFeeTotal - totalFees;

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

  return { allocationData, totalRevenue, courseFeeRevenue, enrollmentFeeRevenue };
}
