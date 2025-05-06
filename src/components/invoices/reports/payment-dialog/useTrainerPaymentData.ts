
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";

export function useTrainerPaymentData(
  open: boolean, 
  trainerId: string, 
  branchId?: string,
  dateRange?: { from: Date; to: Date },
  termId?: string
) {
  const [loading, setLoading] = useState(false);
  const [trainerName, setTrainerName] = useState("");
  const [trainerEmail, setTrainerEmail] = useState<string | null>(null);
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
  }, [open, trainerId, branchId, termId]); // Add termId as a dependency

  const fetchTrainerData = async () => {
    if (!trainerId) return;
    
    setLoading(true);
    try {
      // First get trainer name and email
      const { data: trainerData } = await supabase
        .from('trainers')
        .select('first_name, last_name, email')
        .eq('id', trainerId)
        .single();
      
      if (trainerData) {
        setTrainerName(`${trainerData.first_name} ${trainerData.last_name}`);
        setTrainerEmail(trainerData.email);
      }

      // Get the trainer payments data from the query cache if available
      const cachedData = queryClient.getQueryData(['trainer-payments', branchId, dateRange, termId]) as any[];
      
      if (cachedData) {
        const trainerData = cachedData.find(t => t.id === trainerId);
        if (trainerData && trainerData.classDetails) {
          setClassDetails(trainerData.classDetails);
          
          // Pre-select unpaid classes
          setSelectedClasses(
            trainerData.classDetails
              .filter((c: TrainerClassDetail) => !c.isPaid)
              .map((c: TrainerClassDetail) => c.scheduleId)
          );
          setLoading(false);
          return;
        }
      }

      // If we didn't find cached data, fetch data directly
      // Add term filtering to the query
      let scheduleQuery = supabase
        .from('class_schedules')
        .select(`
          id,
          start_time,
          end_time,
          classes:class_id (
            id, 
            name,
            trainer_fee_type,
            trainer_fee_value,
            course_fee
          ),
          bookings:bookings!class_schedule_id (
            id,
            client_id,
            clients:client_id (
              id,
              first_name,
              last_name
            ),
            invoice_items:invoice_items!booking_id (
              id,
              amount,
              invoice_id,
              invoices:invoice_id (
                id,
                status,
                total
              )
            )
          )
        `)
        .eq('trainer_id', trainerId);
        
      // Apply term filter if provided
      if (termId) {
        console.log(`Filtering schedules for term: ${termId}`);
        scheduleQuery = scheduleQuery.eq('term_id', termId);
      }
      
      const { data: schedules } = await scheduleQuery;

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
        let bookingsDetails = [];
        
        if (schedule.bookings && schedule.bookings.length > 0) {
          bookingsCount = schedule.bookings.length;
          
          for (const booking of schedule.bookings) {
            // Add booking details
            const clientName = booking.clients 
              ? `${booking.clients.first_name || ''} ${booking.clients.last_name || ''}`.trim()
              : 'Unnamed Client';
              
            let bookingRevenue = 0;
            
            // Calculate fees for this booking
            if (booking.invoice_items && booking.invoice_items.length > 0 && schedule.classes) {
              // Get paid invoice items
              const paidItems = booking.invoice_items.filter(
                item => item.invoices && item.invoices.status === 'paid'
              );
              
              const feeType = schedule.classes.trainer_fee_type;
              const feeValue = schedule.classes.trainer_fee_value || 0;
              
              // Calculate from invoice totals for percentage fees
              if (feeType === 'percentage') {
                for (const item of paidItems) {
                  // Use invoice total for more accurate calculation
                  const invoiceTotal = item.invoices?.total || 0;
                  bookingRevenue += (invoiceTotal * feeValue / 100);
                }
              } else {
                // For fixed fee, just add the fixed amount if there are any paid invoices
                bookingRevenue = paidItems.length > 0 ? feeValue : 0;
              }
            } else if (schedule.classes) {
              // If no invoices yet, calculate potential revenue
              const feeType = schedule.classes.trainer_fee_type;
              const feeValue = schedule.classes.trainer_fee_value || 0;
              const courseFee = schedule.classes.course_fee || 0;
              
              if (feeType === 'percentage') {
                bookingRevenue = courseFee * (feeValue / 100);
              } else {
                bookingRevenue = feeValue;
              }
            }
            
            // Add this booking's revenue to total
            revenue += bookingRevenue;
            
            // Add booking details
            bookingsDetails.push({
              bookingId: booking.id,
              clientId: booking.client_id || '',
              handlerName: clientName,
              commissionAmount: bookingRevenue
            });
          }
        }
        
        // Calculate potential revenue - what could be earned if all bookings pay
        let potentialRevenue = 0;
        if (schedule.classes && schedule.bookings) {
          const feeType = schedule.classes.trainer_fee_type;
          const feeValue = schedule.classes.trainer_fee_value || 0;
          const courseFee = schedule.classes.course_fee || 0;
          
          if (feeType === 'percentage') {
            potentialRevenue = courseFee * (feeValue / 100) * bookingsCount;
          } else {
            potentialRevenue = feeValue * bookingsCount;
          }
        }
        
        return {
          scheduleId: schedule.id,
          className: schedule.classes?.name || 'Unknown Class',
          classDate: schedule.start_time,
          scheduleDate: new Date(schedule.start_time),
          revenue,
          potentialRevenue,
          bookings: bookingsCount,
          isPaid,
          bookingsDetails
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
    trainerEmail,
    classDetails,
    selectedClasses,
    toggleSelectAll,
    toggleClass
  };
}
