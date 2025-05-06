
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrainerClassDetail } from "@/hooks/trainer-payments/types";
import { useTerm } from "@/context/TermContext";

export function useTrainerPaymentData(
  isOpen: boolean,
  trainerId: string,
  branchId?: string,
  dateRange?: { from: Date; to: Date },
  termId?: string
) {
  const [loading, setLoading] = useState(true);
  const [trainerName, setTrainerName] = useState("");
  const [trainerEmail, setTrainerEmail] = useState("");
  const [classDetails, setClassDetails] = useState<TrainerClassDetail[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const { termData } = useTerm();
  
  useEffect(() => {
    // Reset state when dialog opens/closes or trainer changes
    if (!isOpen) {
      return;
    }
    
    async function fetchTrainerDetails() {
      if (!trainerId || !branchId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        // Fetch trainer details
        const { data: trainerData, error: trainerError } = await supabase
          .from("trainers")
          .select("id, first_name, last_name, email")
          .eq("id", trainerId)
          .single();

        if (trainerError || !trainerData) {
          console.error("Error fetching trainer:", trainerError);
          setLoading(false);
          return;
        }
        
        // Set trainer info
        setTrainerName(`${trainerData.first_name} ${trainerData.last_name}`);
        setTrainerEmail(trainerData.email || "");
        
        // Use the provided termId or fall back to current term
        const effectiveTermId = termId || termData?.id;
        
        // Fetch class schedules for this trainer with term filtering
        let query = supabase
          .from("class_schedules")
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
            trainer_payments(status, payment_date, amount)
          `)
          .eq("trainer_id", trainerId);
          
        // Add term filtering when a term ID is provided
        if (effectiveTermId) {
          query = query.eq("term_id", effectiveTermId);
          console.log(`Filtering dialog schedules for term: ${effectiveTermId}`);
        }
          
        const { data: schedules, error: schedulesError } = await query;
        
        if (schedulesError) {
          console.error("Error fetching class schedules:", schedulesError);
          setLoading(false);
          return;
        }
        
        if (!schedules || schedules.length === 0) {
          // No schedules found
          setClassDetails([]);
          setLoading(false);
          return;
        }
        
        // For each schedule, fetch related bookings
        const scheduleDetails = await Promise.all(
          schedules.map(async (schedule) => {
            // Set base info from schedule
            const classDetail: TrainerClassDetail = {
              scheduleId: schedule.id,
              className: schedule.classes?.name || "Unnamed Class",
              classDate: schedule.start_time,
              trainerFeeType: schedule.classes?.trainer_fee_type || "percentage",
              trainerFeeValue: schedule.classes?.trainer_fee_value || 0,
              bookings: 0,
              totalRevenue: 0,
              potentialRevenue: 0,
              isPaid: false,
              hasZeroCommission: schedule.classes?.trainer_fee_value === 0,
              hasZeroAmountPayment: false,
              paidAmount: 0,
              paymentDate: null
            };
            
            // Check if there's a payment record for this schedule
            if (schedule.trainer_payments && schedule.trainer_payments.length > 0) {
              const payment = schedule.trainer_payments[0];
              classDetail.isPaid = payment.status === "paid";
              classDetail.paymentDate = payment.payment_date;
              classDetail.paidAmount = payment.amount || 0;
              classDetail.hasZeroAmountPayment = payment.status === "paid" && (!payment.amount || payment.amount === 0);
            }
            
            // Fetch bookings related to this schedule
            const { data: bookings, error: bookingsError } = await supabase
              .from("bookings")
              .select(`
                id, 
                payment_status,
                invoice_items:invoice_items(amount)
              `)
              .eq("class_schedule_id", schedule.id);
            
            if (bookingsError) {
              console.error(`Error fetching bookings for schedule ${schedule.id}:`, bookingsError);
              return classDetail;
            }
            
            if (bookings && bookings.length > 0) {
              // Count bookings
              classDetail.bookings = bookings.length;
              
              // Calculate total revenue from invoice items
              let totalRevenue = 0;
              bookings.forEach(booking => {
                if (booking.invoice_items && booking.invoice_items.length > 0) {
                  totalRevenue += booking.invoice_items.reduce((sum, item) => sum + (item.amount || 0), 0);
                }
              });
              
              classDetail.totalRevenue = totalRevenue;
              
              // Calculate potential revenue based on fee type and value
              if (classDetail.trainerFeeType === "percentage") {
                classDetail.potentialRevenue = totalRevenue * (classDetail.trainerFeeValue / 100);
              } else if (classDetail.trainerFeeType === "fixed") {
                // Fixed amount per class
                classDetail.potentialRevenue = classDetail.trainerFeeValue;
              }
            }
            
            return classDetail;
          })
        );
        
        // Sort by date (newest first) and then by class name
        const sortedDetails = scheduleDetails.sort((a, b) => {
          // First by unpaid/paid status
          if (!a.isPaid && b.isPaid) return -1;
          if (a.isPaid && !b.isPaid) return 1;
          
          // Then by date
          const dateA = new Date(a.classDate).getTime();
          const dateB = new Date(b.classDate).getTime();
          if (dateA !== dateB) return dateB - dateA;
          
          // Then by name
          return a.className.localeCompare(b.className);
        });
        
        setClassDetails(sortedDetails);
        
        // Select all unpaid classes by default
        const unpaidClassIds = sortedDetails
          .filter(cls => !cls.isPaid)
          .map(cls => cls.scheduleId);
          
        setSelectedClasses(unpaidClassIds);
      } catch (error) {
        console.error("Error loading trainer payment data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTrainerDetails();
  }, [isOpen, trainerId, branchId, dateRange, termId, termData?.id]);
  
  // Handler for toggling a class selection
  const toggleClass = (scheduleId: string, selected: boolean) => {
    if (selected) {
      setSelectedClasses(prev => [...prev, scheduleId]);
    } else {
      setSelectedClasses(prev => prev.filter(id => id !== scheduleId));
    }
  };
  
  // Handler for toggling all classes
  const toggleSelectAll = (selected: boolean) => {
    if (selected) {
      // Only select unpaid classes
      const unpaidClassIds = classDetails
        .filter(cls => !cls.isPaid)
        .map(cls => cls.scheduleId);
      setSelectedClasses(unpaidClassIds);
    } else {
      setSelectedClasses([]);
    }
  };
  
  return {
    loading,
    trainerName,
    trainerEmail,
    classDetails,
    selectedClasses,
    toggleClass,
    toggleSelectAll
  };
}
