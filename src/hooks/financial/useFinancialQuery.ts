import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FinancialBookingData, InvoiceItemWithInvoice } from "./types";

export function useFinancialQuery(branchId?: string, fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['financial-bookings', branchId, fromDate, toDate],
    queryFn: async (): Promise<FinancialBookingData> => {
      if (!branchId) {
        return {
          bookings: [],
          totalRevenue: 0,
          uniqueClients: 0,
          uniqueHandlers: 0,
          uniqueSchedules: 0,
          branchId: '',
          fromDate: '',
          toDate: ''
        };
      }
      
      console.log(`Fetching financial data for branch: ${branchId} from ${fromDate} to ${toDate}`);
      
      try {
        // Adjust the query to handle classes that span multiple terms
        // We'll include classes that start within the date range OR have class sessions within the range
        let query = supabase
          .from('class_schedules')
          .select(`
            id,
            start_time,
            end_time,
            selected_dates,
            term_id,
            term_number,
            academic_year,
            classes!inner(
              id,
              name,
              class_type,
              course_fee,
              enrollment_fee,
              mckaynine_commission_type,
              mckaynine_commission_value,
              admin_fee_type,
              admin_fee_value,
              trainer_fee_type,
              trainer_fee_value
            ),
            bookings!class_schedule_id(
              id,
              payment_status,
              clients!inner(
                id,
                first_name,
                last_name
              ),
              invoice_items(
                id,
                amount,
                invoice_id,
                invoices:invoice_id(
                  id,
                  status,
                  payment_date,
                  issued_date,
                  total,
                  subtotal,
                  discount_amount,
                  tax_amount,
                  tax_rate
                )
              )
            )
          `)
          .eq('classes.branch_id', branchId);
          
        // Add date filtering conditionally
        if (fromDate && toDate) {
          // Include schedules that:
          // 1. Start within the date range OR
          // 2. Have at least one class session (selected_date) within the range
          query = query.or(`start_time.gte.${fromDate},start_time.lte.${toDate}`);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching financial bookings data:', error);
          throw error;
        }
        
        // Post-process the data to filter out class sessions outside our date range
        const filteredSchedules = data.map(schedule => {
          // Keep the schedule if it starts within the date range
          const scheduleStart = new Date(schedule.start_time);
          
          if ((!fromDate || new Date(scheduleStart) >= new Date(fromDate)) &&
              (!toDate || new Date(scheduleStart) <= new Date(toDate))) {
            return schedule;
          }
          
          // For schedules that start outside the date range, check if any selected dates are within range
          if (schedule.selected_dates && schedule.selected_dates.length > 0) {
            const datesInRange = schedule.selected_dates.filter(dateStr => {
              const classDate = new Date(dateStr);
              return (!fromDate || classDate >= new Date(fromDate)) &&
                     (!toDate || classDate <= new Date(toDate));
            });
            
            if (datesInRange.length > 0) {
              // Some classes are in the date range, keep this schedule
              // but only include the relevant dates
              return {
                ...schedule,
                selected_dates: datesInRange
              };
            }
          }
          
          // No dates in range, exclude this schedule
          return null;
        }).filter(Boolean);
        
        // Calculate revenue metrics
        let totalRevenue = 0;
        const uniqueClientIds = new Set<string>();
        const uniqueScheduleIds = new Set<string>();
        
        filteredSchedules.forEach(schedule => {
          if (schedule.bookings) {
            schedule.bookings.forEach(booking => {
              if (booking.clients?.id) {
                uniqueClientIds.add(booking.clients.id);
              }
              
              // Sum up revenue from paid invoices
              booking.invoice_items?.forEach(item => {
                if (item.invoices?.status === 'paid') {
                  // Use the invoice total if available (this takes discounts into account)
                  // or fall back to the item amount
                  totalRevenue += item.amount || 0;
                }
              });
            });
          }
          uniqueScheduleIds.add(schedule.id);
        });
        
        return {
          bookings: filteredSchedules,
          totalRevenue,
          uniqueClients: uniqueClientIds.size,
          uniqueHandlers: uniqueClientIds.size, // Clients and handlers are 1:1 in this system
          uniqueSchedules: uniqueScheduleIds.size,
          branchId,
          fromDate: fromDate || '',
          toDate: toDate || ''
        };
      } catch (error) {
        console.error('Error in useFinancialQuery:', error);
        throw error;
      }
    },
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
}
