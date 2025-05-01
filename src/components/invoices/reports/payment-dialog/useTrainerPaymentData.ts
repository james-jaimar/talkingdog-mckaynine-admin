
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";

export function useTrainerPaymentData(
  open: boolean, 
  trainerId: string, 
  branchId?: string,
  dateRange?: { from: Date; to: Date }
) {
  const [loading, setLoading] = useState(false);
  const [trainerName, setTrainerName] = useState("");
  const [classDetails, setClassDetails] = useState<TrainerClassDetail[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const queryClient = useQueryClient();
  
  // Fetch trainer's classes and payment data when dialog opens
  useEffect(() => {
    if (open && trainerId) {
      fetchTrainerData();
    } else {
      setClassDetails([]);
      setSelectedClasses([]);
    }
  }, [open, trainerId, branchId]);

  const fetchTrainerData = async () => {
    if (!trainerId || !branchId) return;
    
    setLoading(true);
    try {
      // First get trainer name
      const { data: trainerData } = await supabase
        .from('trainers')
        .select('first_name, last_name')
        .eq('id', trainerId)
        .single();
      
      if (trainerData) {
        setTrainerName(`${trainerData.first_name} ${trainerData.last_name}`);
      }

      // Get the trainer payments data from the query cache
      const cachedData = queryClient.getQueryData(['trainer-payments', branchId, dateRange]) as any[];
      
      if (cachedData) {
        const trainerData = cachedData.find(t => t.id === trainerId);
        if (trainerData && trainerData.classDetails) {
          setClassDetails(trainerData.classDetails);
          
          // Pre-select unpaid classes
          setSelectedClasses(
            trainerData.classDetails
              .filter(c => !c.isPaid)
              .map(c => c.scheduleId)
          );
          setLoading(false);
          return;
        }
      }

      // If we didn't find cached data, fetch data directly
      const { data: schedules } = await supabase
        .from('class_schedules')
        .select(`
          id,
          start_time,
          end_time,
          classes:class_id (
            id, 
            name,
            trainer_fee_type,
            trainer_fee_value
          ),
          bookings:bookings!class_schedule_id (
            id,
            invoice_items:invoice_items!booking_id (
              id,
              amount,
              invoice_id,
              invoices:invoice_id (
                id,
                status
              )
            )
          )
        `)
        .eq('trainer_id', trainerId)
        .gte('start_time', dateRange?.from.toISOString())
        .lte('start_time', dateRange?.to.toISOString())
        .order('start_time');

      if (!schedules || schedules.length === 0) {
        setClassDetails([]);
        setLoading(false);
        return;
      }

      // Get trainer payments to determine which are already paid
      const { data: trainerPayments } = await supabase
        .from('trainer_payments')
        .select('class_schedule_id, status')
        .eq('trainer_id', trainerId)
        .in('class_schedule_id', schedules.map(s => s.id));

      // Process class details
      const details: TrainerClassDetail[] = schedules.map(schedule => {
        // Check if this schedule is already paid
        const payment = trainerPayments?.find(p => 
          p.class_schedule_id === schedule.id && p.status === 'paid'
        );
        const isPaid = !!payment;
        
        // Calculate revenue for this class
        let revenue = 0;
        let bookingsCount = 0;
        
        if (schedule.bookings && schedule.bookings.length > 0) {
          bookingsCount = schedule.bookings.length;
          
          for (const booking of schedule.bookings) {
            if (!booking.invoice_items || booking.invoice_items.length === 0) continue;
            
            for (const item of booking.invoice_items) {
              if (!item.invoices || item.invoices.status === 'cancelled') continue;
              
              // Calculate trainer's commission
              if (schedule.classes) {
                const feeType = schedule.classes.trainer_fee_type;
                const feeValue = schedule.classes.trainer_fee_value || 0;
                
                if (feeType === 'percentage') {
                  revenue += (item.amount || 0) * (feeValue / 100);
                } else if (feeType === 'fixed') {
                  revenue += feeValue;
                }
              }
            }
          }
        }
        
        return {
          scheduleId: schedule.id,
          className: schedule.classes?.name || 'Unknown Class',
          classDate: schedule.start_time,
          scheduleDate: new Date(schedule.start_time),
          revenue,
          potentialRevenue: revenue,
          bookings: bookingsCount,
          isPaid
        };
      });

      setClassDetails(details);
      
      // Pre-select unpaid classes
      setSelectedClasses(details.filter(c => !c.isPaid).map(c => c.scheduleId));
    } catch (error) {
      console.error("Error fetching trainer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClasses(classDetails.filter(c => !c.isPaid).map(c => c.scheduleId));
    } else {
      setSelectedClasses([]);
    }
  };

  const toggleClass = (classId: string, checked: boolean) => {
    if (checked) {
      setSelectedClasses(prev => [...prev, classId]);
    } else {
      setSelectedClasses(prev => prev.filter(id => id !== classId));
    }
  };

  return {
    loading,
    trainerName,
    classDetails,
    selectedClasses,
    toggleSelectAll,
    toggleClass
  };
}
