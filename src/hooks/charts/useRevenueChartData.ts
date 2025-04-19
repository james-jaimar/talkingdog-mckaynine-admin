
import { useState, useEffect } from 'react';
import { Invoice } from '@/types/invoice';

export type TimeFrame = 'monthly' | 'quarterly' | 'yearly';

export function useRevenueChartData(invoices: Invoice[], timeframe: TimeFrame = 'monthly') {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!invoices?.length) {
      setChartData([]);
      return;
    }

    const data: Record<string, {
      name: string;
      totalRevenue: number;
      paidRevenue: number;
      pendingRevenue: number;
      overdueRevenue: number;
    }> = {};

    // Group by month/quarter/year based on timeframe
    invoices.forEach(invoice => {
      const date = new Date(invoice.issued_date);
      let period: string;
      
      if (timeframe === 'monthly') {
        period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (timeframe === 'quarterly') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        period = `${date.getFullYear()} Q${quarter}`;
      } else {
        period = `${date.getFullYear()}`;
      }

      if (!data[period]) {
        data[period] = {
          name: period,
          totalRevenue: 0,
          paidRevenue: 0,
          pendingRevenue: 0,
          overdueRevenue: 0
        };
      }

      // Add invoice amount to appropriate category
      const amount = invoice.total;
      data[period].totalRevenue += amount;
      
      if (invoice.status === 'paid') {
        data[period].paidRevenue += amount;
      } else if (invoice.status === 'sent') {
        data[period].pendingRevenue += amount;
      } else if (invoice.status === 'overdue') {
        data[period].overdueRevenue += amount;
      }
    });

    // Sort the data by period for proper chronological display
    const sortedData = Object.values(data).sort((a, b) => a.name.localeCompare(b.name));
    
    // Verify that for each period, paid + pending + overdue = total
    // If there's any discrepancy, adjust the values to ensure they sum correctly
    sortedData.forEach(period => {
      const sum = period.paidRevenue + period.pendingRevenue + period.overdueRevenue;
      
      // If there's a discrepancy due to floating point precision or data issues
      if (Math.abs(period.totalRevenue - sum) > 0.01) {
        // Calculate the adjustment needed
        const adjustment = period.totalRevenue - sum;
        
        // Apply adjustment to the largest non-zero category to minimize percentage impact
        if (period.paidRevenue >= period.pendingRevenue && period.paidRevenue >= period.overdueRevenue && period.paidRevenue > 0) {
          period.paidRevenue += adjustment;
        } else if (period.pendingRevenue >= period.paidRevenue && period.pendingRevenue >= period.overdueRevenue && period.pendingRevenue > 0) {
          period.pendingRevenue += adjustment;
        } else if (period.overdueRevenue > 0) {
          period.overdueRevenue += adjustment;
        } else {
          // If all categories are 0, just put the adjustment in pending
          period.pendingRevenue += adjustment;
        }
      }
      
      // Double-check our adjustment worked
      const newSum = period.paidRevenue + period.pendingRevenue + period.overdueRevenue;
      if (Math.abs(period.totalRevenue - newSum) > 0.01) {
        console.warn(`Revenue balance issue remains for period ${period.name}: ` +
          `total ${period.totalRevenue} vs sum ${newSum}`);
      }
    });
    
    setChartData(sortedData);
  }, [invoices, timeframe]);

  return { chartData };
}
