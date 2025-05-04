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
        // Improved query to handle classes that span multiple terms
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
          // This improved filter will include schedules that:
          // 1. Start within the date range OR
          // 2. Have any selected_dates that fall within the range OR
          // 3. End within the date range
          query = query.or(`start_time.gte.${fromDate},selected_dates.cs.{${fromDate},${toDate}},end_time.lte.${toDate}`);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching financial bookings data:', error);
          throw error;
        }
        
        // Post-process the data to keep only class sessions within our date range
        const filteredSchedules = data
          .filter(schedule => {
            // If no date range is provided, keep all schedules
            if (!fromDate || !toDate) return true;
            
            // Check if start_time is within range
            const scheduleStart = new Date(schedule.start_time);
            const scheduleEnd = new Date(schedule.end_time);
            const fromDateObj = new Date(fromDate);
            const toDateObj = new Date(toDate);
            
            // Keep if schedule period overlaps with date range
            if ((scheduleStart >= fromDateObj && scheduleStart <= toDateObj) ||
                (scheduleEnd >= fromDateObj && scheduleEnd <= toDateObj)) {
              return true;
            }
            
            // Check if any selected_dates fall within the date range
            if (schedule.selected_dates && schedule.selected_dates.length > 0) {
              return schedule.selected_dates.some(dateStr => {
                const classDate = new Date(dateStr);
                return classDate >= fromDateObj && classDate <= toDateObj;
              });
            }
            
            return false;
          })
          .map(schedule => {
            // If we're filtering by date, only include selected_dates within the range
            if (fromDate && toDate && schedule.selected_dates?.length > 0) {
              const fromDateObj = new Date(fromDate);
              const toDateObj = new Date(toDate);
              
              return {
                ...schedule,
                selected_dates: schedule.selected_dates.filter(dateStr => {
                  const classDate = new Date(dateStr);
                  return classDate >= fromDateObj && classDate <= toDateObj;
                })
              };
            }
            
            return schedule;
          });
        
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
