
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

      data[period].totalRevenue += invoice.total;
      
      if (invoice.status === 'paid') {
        data[period].paidRevenue += invoice.total;
      } else if (invoice.status === 'sent') {
        data[period].pendingRevenue += invoice.total;
      } else if (invoice.status === 'overdue') {
        data[period].overdueRevenue += invoice.total;
      }
    });

    const sortedData = Object.values(data).sort((a, b) => a.name.localeCompare(b.name));
    setChartData(sortedData);
  }, [invoices, timeframe]);

  return { chartData };
}
