
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
      if (!currentBranch?.id || !selectedTermId) {
        console.log('Missing branch or term ID:', { branchId: currentBranch?.id, termId: selectedTermId });
        return { classes: [], reportTotals: { totalRevenue: 0, totalFranchiseFees: 0, totalAdminFees: 0, totalMckaynineCommission: 0, totalHandlers: 0 } };
      }

      console.log(`Fetching franchise data for branch ${currentBranch.name} with term:`, selectedTermId);

      // First, get all classes for the branch
      const { data: classes, error: classesError } = await supabase
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
          mckaynine_commission_value
        `)
        .eq('branch_id', currentBranch.id);

      if (classesError) {
        console.error("Error fetching classes:", classesError);
        throw classesError;
      }

      console.log(`Retrieved ${classes?.length || 0} classes for branch`);

      // Now get schedules and bookings for the specific term
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('class_schedules')
        .select(`
          id,
          class_id,
          selected_dates,
          start_time,
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
        `)
        .eq('term_id', selectedTermId);

      if (scheduleError) {
        console.error("Error fetching schedules:", scheduleError);
        throw scheduleError;
      }

      console.log(`Retrieved ${scheduleData?.length || 0} schedules for term ${selectedTermId}`);

      // Combine classes with their schedule data
      const franchiseClasses: FranchiseClassGroup[] = [];
      let reportTotals = {
        totalRevenue: 0,
        totalFranchiseFees: 0,
        totalAdminFees: 0,
        totalMckaynineCommission: 0,
        totalHandlers: 0
      };

      classes?.forEach(classItem => {
        const classSchedules = scheduleData?.filter(schedule => schedule.class_id === classItem.id) || [];
        
        if (classSchedules.length === 0) {
          console.log(`No schedules found for class ${classItem.name} in term ${selectedTermId}`);
          return;
        }

        const handlers: FranchiseHandler[] = [];
        let classTotals = {
          totalRevenue: 0,
          totalFranchiseFees: 0,
          totalAdminFees: 0,
          totalMckaynineCommission: 0
        };

        classSchedules.forEach(schedule => {
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

      console.log(`Processed ${franchiseClasses.length} franchise classes with financial data for term ${selectedTermId}`);
      return { classes: franchiseClasses, reportTotals };
    },
    enabled: !!currentBranch?.id && !!selectedTermId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });
}
