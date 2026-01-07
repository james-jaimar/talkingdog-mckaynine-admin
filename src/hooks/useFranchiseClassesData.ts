
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
        console.log('Missing required data:', { 
          branchId: currentBranch?.id, 
          termId: selectedTermId 
        });
        return { 
          classes: [], 
          reportTotals: { 
            totalRevenue: 0, 
            totalFranchiseFees: 0, 
            totalAdminFees: 0, 
            totalMckaynineCommission: 0, 
            totalHandlers: 0 
          } 
        };
      }

      console.log(`Starting franchise data fetch for branch: ${currentBranch.name} (${currentBranch.id}), term: ${selectedTermId}`);

      // First, verify the term exists and get its details
      const { data: termInfo, error: termError } = await supabase
        .from('terms')
        .select(`
          id,
          term_number,
          start_date,
          end_date,
          academic_years(year)
        `)
        .eq('id', selectedTermId)
        .single();

      if (termError) {
        console.error("Error fetching term info:", termError);
        throw termError;
      }

      console.log('Term info:', termInfo);

      // Get all classes for the current branch
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

      console.log(`Retrieved ${classes?.length || 0} classes for branch ${currentBranch.name}`);

      // Get schedules for the specific term with enhanced debugging
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('class_schedules')
        .select(`
          id,
          class_id,
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
        `)
        .eq('term_id', selectedTermId);

      if (scheduleError) {
        console.error("Error fetching schedules:", scheduleError);
        throw scheduleError;
      }

      console.log(`Retrieved ${scheduleData?.length || 0} schedules for term ${selectedTermId}`);
      
      // Debug: log schedule details
      scheduleData?.forEach((schedule, index) => {
        console.log(`Schedule ${index + 1}:`, {
          id: schedule.id,
          class_id: schedule.class_id,
          term_id: schedule.term_id,
          bookings_count: schedule.bookings?.length || 0
        });
      });

      // Process the data
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
        
        console.log(`Processing class "${classItem.name}": found ${classSchedules.length} schedules`);
        
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
          console.log(`Schedule ${schedule.id} has ${schedule.bookings?.length || 0} bookings`);
          
          schedule.bookings?.forEach(booking => {
            if (!booking.clients || !booking.dogs) {
              console.log(`Skipping booking ${booking.id} - missing client or dog data`);
              return;
            }

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

            // Franchise Fee = McKaynine Commission (15%)
            const franchiseFee = calculateFee(classItem.mckaynine_commission_type, classItem.mckaynine_commission_value, invoiceAmount);
            const adminFee = calculateFee(classItem.admin_fee_type, classItem.admin_fee_value, invoiceAmount);
            // Commission column = Trainer Fee (40%)
            const mckaynineCommission = calculateFee(classItem.trainer_fee_type, classItem.trainer_fee_value, invoiceAmount);

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

        console.log(`Class "${classItem.name}" processed: ${handlers.length} handlers found`);

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

      console.log(`Final result: ${franchiseClasses.length} franchise classes with ${reportTotals.totalHandlers} total handlers`);
      
      if (franchiseClasses.length === 0) {
        console.warn(`No franchise data found for term ${selectedTermId} (${termInfo?.academic_years?.year} - Term ${termInfo?.term_number})`);
      }

      return { classes: franchiseClasses, reportTotals };
    },
    enabled: !!currentBranch?.id && !!selectedTermId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });
}
