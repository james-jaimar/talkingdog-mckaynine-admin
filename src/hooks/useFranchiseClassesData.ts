
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBranch } from '@/context/BranchContext';
import { useTerm } from '@/context/TermContext';

export interface FranchiseHandler {
  clientId: string;
  clientName: string;
  dogId: string;
  dogName: string;
  dogBreed: string;
  paymentStatus: string;
  attendanceCount: number;
  totalClasses: number;
  invoiceAmount: number;
  franchiseFee: number;
  adminFee: number;
  mckaynineCommission: number;
}

export interface FranchiseClassGroup {
  className: string;
  classType: string;
  courseFee: number;
  trainerFeeType: string;
  trainerFeeValue: number;
  adminFeeType: string;
  adminFeeValue: number;
  mckaynineCommissionType: string;
  mckaynineCommissionValue: number;
  handlers: FranchiseHandler[];
  classTotals: {
    totalRevenue: number;
    totalFranchiseFees: number;
    totalAdminFees: number;
    totalMckaynineCommission: number;
  };
}

export interface FranchiseReportData {
  classes: FranchiseClassGroup[];
  reportTotals: {
    totalRevenue: number;
    totalFranchiseFees: number;
    totalAdminFees: number;
    totalMckaynineCommission: number;
    totalHandlers: number;
  };
}

export function useFranchiseClassesData(termId?: string) {
  const { currentBranch } = useBranch();
  const { termData } = useTerm();
  
  const selectedTermId = termId || termData?.id;

  return useQuery({
    queryKey: ['franchise-classes-data', currentBranch?.id, selectedTermId],
    queryFn: async (): Promise<FranchiseReportData> => {
      if (!currentBranch?.id) return { classes: [], reportTotals: { totalRevenue: 0, totalFranchiseFees: 0, totalAdminFees: 0, totalMckaynineCommission: 0, totalHandlers: 0 } };

      console.log(`Fetching franchise data for branch ${currentBranch.name} with term:`, selectedTermId);

      let query = supabase
        .from('classes')
        .select(`
          id,
          name,
          class_type,
          course_fee,
          trainer_fee_type,
          trainer_fee_value,
          admin_fee_type,
          admin_fee_value,
          mckaynine_commission_type,
          mckaynine_commission_value,
          class_schedules(
            id,
            selected_dates,
            start_time,
            term_id,
            bookings(
              id,
              payment_status,
              clients(id, first_name, last_name),
              dogs(id, name, breed),
              attendances:class_attendance(attendance_status),
              invoice_items(
                amount,
                invoices:invoice_id (
                  status,
                  payment_received
                )
              )
            )
          )
        `)
        .eq('branch_id', currentBranch.id);

      const { data: classes, error: classesError } = await query;

      if (classesError) {
        console.error("Error fetching franchise classes data:", classesError);
        throw classesError;
      }

      console.log(`Retrieved ${classes?.length || 0} classes for franchise report`);

      // Filter schedules to only include those for the selected term
      const filteredClasses = classes.map(classItem => {
        if (selectedTermId) {
          classItem.class_schedules = classItem.class_schedules.filter(schedule => {
            return schedule.term_id === selectedTermId;
          });
        }
        
        return classItem;
      });

      // Only include classes that have schedules for the selected term
      const classesWithSchedules = selectedTermId
        ? filteredClasses?.filter(classItem => classItem.class_schedules.length > 0)
        : filteredClasses;
      
      console.log(`Filtered to ${classesWithSchedules?.length || 0} classes with schedules for term`);
      
      const franchiseClasses: FranchiseClassGroup[] = [];
      let reportTotals = {
        totalRevenue: 0,
        totalFranchiseFees: 0,
        totalAdminFees: 0,
        totalMckaynineCommission: 0,
        totalHandlers: 0
      };

      classesWithSchedules.forEach(classItem => {
        const handlers: FranchiseHandler[] = [];
        let classTotals = {
          totalRevenue: 0,
          totalFranchiseFees: 0,
          totalAdminFees: 0,
          totalMckaynineCommission: 0
        };
        
        classItem.class_schedules?.forEach(schedule => {
          const totalClasses = (schedule.selected_dates || []).length;
          
          schedule.bookings?.forEach(booking => {
            if (!booking.clients || !booking.dogs) return;

            // Check attendance count
            const attendanceCount = booking.attendances?.filter(
              a => a.attendance_status === 'present'
            ).length || 0;
            
            // Check payment status from invoices and get invoice amount
            let paymentStatus = booking.payment_status;
            let invoiceAmount = 0;
            
            if (booking.invoice_items && booking.invoice_items.length > 0) {
              // Sum all invoice amounts for this booking
              invoiceAmount = booking.invoice_items.reduce((sum, item) => sum + (item.amount || 0), 0);
              
              // Check if any invoice is paid
              const hasPaidInvoice = booking.invoice_items.some(item => 
                item.invoices && (item.invoices.payment_received || item.invoices.status === 'paid')
              );
              
              if (hasPaidInvoice) {
                paymentStatus = 'paid';
              }
            }

            // Calculate fees based on class configuration
            const calculateFee = (type: string, value: number, baseAmount: number) => {
              if (type === 'percentage') {
                return (baseAmount * value) / 100;
              } else if (type === 'fixed') {
                return value;
              }
              return 0;
            };

            const franchiseFee = calculateFee(classItem.trainer_fee_type, classItem.trainer_fee_value, invoiceAmount);
            const adminFee = calculateFee(classItem.admin_fee_type, classItem.admin_fee_value, invoiceAmount);
            const mckaynineCommission = calculateFee(classItem.mckaynine_commission_type, classItem.mckaynine_commission_value, invoiceAmount);

            handlers.push({
              clientId: booking.clients.id,
              clientName: `${booking.clients.first_name} ${booking.clients.last_name}`,
              dogId: booking.dogs.id,
              dogName: booking.dogs.name,
              dogBreed: booking.dogs.breed,
              paymentStatus,
              attendanceCount,
              totalClasses,
              invoiceAmount,
              franchiseFee,
              adminFee,
              mckaynineCommission
            });

            // Add to class totals
            classTotals.totalRevenue += invoiceAmount;
            classTotals.totalFranchiseFees += franchiseFee;
            classTotals.totalAdminFees += adminFee;
            classTotals.totalMckaynineCommission += mckaynineCommission;
          });
        });

        if (handlers.length > 0) {
          franchiseClasses.push({
            className: classItem.name,
            classType: classItem.class_type,
            courseFee: classItem.course_fee || 0,
            trainerFeeType: classItem.trainer_fee_type,
            trainerFeeValue: classItem.trainer_fee_value || 0,
            adminFeeType: classItem.admin_fee_type,
            adminFeeValue: classItem.admin_fee_value || 0,
            mckaynineCommissionType: classItem.mckaynine_commission_type,
            mckaynineCommissionValue: classItem.mckaynine_commission_value || 0,
            handlers,
            classTotals
          });

          // Add to report totals
          reportTotals.totalRevenue += classTotals.totalRevenue;
          reportTotals.totalFranchiseFees += classTotals.totalFranchiseFees;
          reportTotals.totalAdminFees += classTotals.totalAdminFees;
          reportTotals.totalMckaynineCommission += classTotals.totalMckaynineCommission;
          reportTotals.totalHandlers += handlers.length;
        }
      });

      console.log(`Processed ${franchiseClasses.length} franchise classes with financial data`);
      return { classes: franchiseClasses, reportTotals };
    },
    enabled: !!currentBranch?.id,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });
}
