
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClassFinance {
  className: string;
  totalRevenue: number;
  bookingsCount: number;
  franchiseFee: number;
  adminFee: number;
  instructorFee: number;
  profit: number;
}

export function useClassFinancialData(branchId?: string, fromDate?: string, toDate?: string) {
  const [classFinances, setClassFinances] = useState<ClassFinance[]>([]);

  // Get financial data for confirmed bookings
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['financial-bookings', branchId, fromDate, toDate],
    queryFn: async () => {
      if (!branchId) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          class_schedules:class_schedule_id (
            classes:class_id (
              id,
              name,
              course_fee,
              mckaynine_commission_value,
              mckaynine_commission_type,
              admin_fee_value,
              admin_fee_type,
              trainer_fee_value,
              trainer_fee_type
            )
          )
        `)
        .eq('class_schedules.classes.branch_id', branchId)
        .eq('status', 'confirmed')
        .gte('created_at', fromDate)
        .lte('created_at', toDate);

      if (error) throw error;
      return data || [];
    },
    enabled: !!branchId && !!fromDate && !!toDate
  });

  // Process booking data into financial summaries
  useEffect(() => {
    if (!bookingsData) {
      setClassFinances([]);
      return;
    }

    const classSummaries = new Map<string, ClassFinance>();

    bookingsData.forEach(booking => {
      const classData = booking.class_schedules?.classes;
      if (!classData) return;

      const className = classData.name;
      const courseFee = classData.course_fee || 0;

      // Get or create class summary
      const summary = classSummaries.get(className) || {
        className,
        totalRevenue: 0,
        bookingsCount: 0,
        franchiseFee: 0,
        adminFee: 0,
        instructorFee: 0,
        profit: 0
      };

      // Update summary
      summary.bookingsCount++;
      summary.totalRevenue += courseFee;

      // Calculate fees
      if (classData.mckaynine_commission_type === 'percentage') {
        summary.franchiseFee += courseFee * (classData.mckaynine_commission_value / 100);
      } else {
        summary.franchiseFee += classData.mckaynine_commission_value;
      }

      if (classData.admin_fee_type === 'percentage') {
        summary.adminFee += courseFee * (classData.admin_fee_value / 100);
      } else {
        summary.adminFee += classData.admin_fee_value;
      }

      if (classData.trainer_fee_type === 'percentage') {
        summary.instructorFee += courseFee * (classData.trainer_fee_value / 100);
      } else {
        summary.instructorFee += classData.trainer_fee_value;
      }

      // Calculate profit
      summary.profit = summary.totalRevenue - summary.franchiseFee - summary.adminFee - summary.instructorFee;

      classSummaries.set(className, summary);
    });

    setClassFinances(Array.from(classSummaries.values()));
  }, [bookingsData]);

  return { classFinances, isLoading };
}
