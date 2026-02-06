import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBranch } from '@/context/BranchContext';
import { isEnrollmentFeeItem } from '@/lib/invoiceItemUtils';
import { roundToCents } from '@/lib/invoiceMath';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface FranchiseHandler {
  clientId: string;
  clientName: string;
  clientEmail: string;
  dogId: string;
  dogName: string;
  dogBreed: string;
  paymentStatus: string;
  attendanceCount: number;
  totalClasses: number;
  courseFeeAmount: number;
  enrollmentFeeAmount: number;
  franchiseFee: number;
  totalAmount: number;
  invoiceDate?: string;
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
    totalCourseFees: number;
    totalEnrollmentFees: number;
    totalFranchiseFees: number;
    totalAmount: number;
  };
}

export interface FranchisePaymentStatus {
  id?: string;
  status: 'pending' | 'partial' | 'paid';
  amountPaid: number;
  paymentDate?: string;
  paymentReference?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface FranchiseReportData {
  classes: FranchiseClassGroup[];
  reportTotals: {
    totalCourseFees: number;
    totalEnrollmentFees: number;
    totalFranchiseFees: number;
    totalAmount: number;
    totalHandlers: number;
  };
  paymentStatus?: FranchisePaymentStatus;
  month: number;
  year: number;
  monthLabel: string;
}

interface UseFranchiseMonthlyDataParams {
  month: number; // 1-12
  year: number;
}

export function useFranchiseMonthlyData({ month, year }: UseFranchiseMonthlyDataParams) {
  const { currentBranch } = useBranch();

  return useQuery({
    queryKey: ['franchise-monthly-data', currentBranch?.id, month, year],
    queryFn: async (): Promise<FranchiseReportData> => {
      if (!currentBranch?.id) {
        console.log('Missing required data:', { branchId: currentBranch?.id });
        return { 
          classes: [], 
          reportTotals: { 
            totalCourseFees: 0, 
            totalEnrollmentFees: 0,
            totalFranchiseFees: 0, 
            totalAmount: 0, 
            totalHandlers: 0 
          },
          month,
          year,
          monthLabel: format(new Date(year, month - 1), 'MMMM yyyy')
        };
      }

      // Calculate date range for the month
      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(new Date(year, month - 1));
      const startDateStr = format(monthStart, 'yyyy-MM-dd');
      const endDateStr = format(monthEnd, 'yyyy-MM-dd');
      const franchiseMonthStr = `${year}-${String(month).padStart(2, '0')}`;

      console.log(`Starting franchise data fetch for branch: ${currentBranch.name}, month: ${month}/${year} (${startDateStr} to ${endDateStr})`);

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

      // Get invoices filtered by branch at database level
      // An invoice is included if:
      // 1. franchise_report_month matches the target month, OR
      // 2. franchise_report_month is NULL and issued_date falls within the month
      // Include discount fields for proper net amount calculation
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          issued_date,
          status,
          payment_received,
          franchise_report_month,
          subtotal,
          monetary_discount,
          discount_type,
          discount_amount,
          branch_id,
          client:client_id (
            id,
            first_name,
            last_name,
            email,
            branch_id
          ),
          invoice_items (
            id,
            amount,
            description,
            item_type,
            booking:booking_id (
              id,
              payment_status,
              dog:dog_id (id, name, breed),
              class_schedule:class_schedule_id (
                id,
                class_id,
                selected_dates
              )
            )
          )
        `)
        .eq('branch_id', currentBranch.id); // Filter at database level

      if (invoicesError) {
        console.error("Error fetching invoices:", invoicesError);
        throw invoicesError;
      }

      // Filter invoices by franchise month allocation OR issued date
      // Branch filtering is already done at database level
      const branchInvoices = invoicesData?.filter(inv => {
        // If franchise_report_month is set, use that
        if (inv.franchise_report_month) {
          return inv.franchise_report_month === franchiseMonthStr;
        }

        // Otherwise, use issued_date
        const issuedDate = inv.issued_date;
        return issuedDate >= startDateStr && issuedDate <= endDateStr;
      }) || [];

      console.log(`Found ${branchInvoices.length} invoices for month ${month}/${year}`);

      // Check for existing payment record
      const { data: paymentRecord } = await supabase
        .from('franchise_payments')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .eq('month', month)
        .eq('year', year)
        .maybeSingle();

      // Process the data - group by class
      // IMPORTANT: Apply invoice-level discounts to items for accurate amounts
      const classHandlersMap = new Map<string, { classData: any; handlers: FranchiseHandler[] }>();

      branchInvoices.forEach(invoice => {
        // Calculate discount ratio for this invoice
        const invoiceSubtotal = invoice.subtotal || 0;
        const invoiceDiscount = invoice.monetary_discount || 0;
        const discountRatio = invoiceSubtotal > 0 ? invoiceDiscount / invoiceSubtotal : 0;
        
        invoice.invoice_items?.forEach(item => {
          if (!item.booking?.class_schedule?.class_id) return;

          const classId = item.booking.class_schedule.class_id;
          const classData = classes?.find(c => c.id === classId);
          if (!classData) return;

          if (!classHandlersMap.has(classId)) {
            classHandlersMap.set(classId, { classData, handlers: [] });
          }

          const entry = classHandlersMap.get(classId)!;
          
          // Apply proportional discount to this item
          const originalAmount = item.amount || 0;
          const itemDiscount = roundToCents(originalAmount * discountRatio);
          const netAmount = roundToCents(originalAmount - itemDiscount);
          
          // Check if this is an enrollment fee
          const isEnrollmentFee = isEnrollmentFeeItem({
            item_type: item.item_type,
            description: item.description
          });
          
          // Check if this handler+dog combo already exists
          const existingHandler = entry.handlers.find(
            h => h.clientId === invoice.client?.id && h.dogId === item.booking?.dog?.id
          );

          if (existingHandler) {
            // Aggregate amounts (using net amounts after discount)
            if (isEnrollmentFee) {
              existingHandler.enrollmentFeeAmount += netAmount;
            } else {
              existingHandler.courseFeeAmount += netAmount;
            }
            
            // Recalculate franchise fee based on updated course fee
            existingHandler.franchiseFee = classData.mckaynine_commission_type === 'percentage'
              ? roundToCents((existingHandler.courseFeeAmount * (classData.mckaynine_commission_value || 0)) / 100)
              : roundToCents(classData.mckaynine_commission_value || 0);
            existingHandler.totalAmount = roundToCents(existingHandler.enrollmentFeeAmount + existingHandler.franchiseFee);
          } else {
            // New handler entry (using net amounts after discount)
            const courseFeeAmount = isEnrollmentFee ? 0 : netAmount;
            const enrollmentFeeAmount = isEnrollmentFee ? netAmount : 0;

            const franchiseFee = classData.mckaynine_commission_type === 'percentage'
              ? roundToCents((courseFeeAmount * (classData.mckaynine_commission_value || 0)) / 100)
              : roundToCents(classData.mckaynine_commission_value || 0);

            const totalClasses = (item.booking.class_schedule?.selected_dates || []).length;

            entry.handlers.push({
              clientId: invoice.client?.id || '',
              clientName: `${invoice.client?.first_name || ''} ${invoice.client?.last_name || ''}`.trim(),
              clientEmail: invoice.client?.email || '',
              dogId: item.booking.dog?.id || '',
              dogName: item.booking.dog?.name || '',
              dogBreed: item.booking.dog?.breed || '',
              paymentStatus: invoice.payment_received ? 'paid' : (invoice.status || 'pending'),
              attendanceCount: 0, // Attendance tracking simplified for monthly report
              totalClasses,
              courseFeeAmount,
              enrollmentFeeAmount,
              franchiseFee,
              totalAmount: roundToCents(enrollmentFeeAmount + franchiseFee),
              invoiceDate: invoice.issued_date
            });
          }
        });
      });

      // Build the result
      const franchiseClasses: FranchiseClassGroup[] = [];
      let reportTotals = {
        totalCourseFees: 0,
        totalEnrollmentFees: 0,
        totalFranchiseFees: 0,
        totalAmount: 0,
        totalHandlers: 0
      };

      classHandlersMap.forEach(({ classData, handlers }) => {
        if (handlers.length === 0) return;

        const classTotals = {
          totalCourseFees: handlers.reduce((sum, h) => sum + h.courseFeeAmount, 0),
          totalEnrollmentFees: handlers.reduce((sum, h) => sum + h.enrollmentFeeAmount, 0),
          totalFranchiseFees: handlers.reduce((sum, h) => sum + h.franchiseFee, 0),
          totalAmount: handlers.reduce((sum, h) => sum + h.totalAmount, 0)
        };

        franchiseClasses.push({
          className: classData.name,
          classType: classData.class_type,
          courseFee: classData.course_fee || 0,
          trainerFeeType: classData.trainer_fee_type,
          trainerFeeValue: classData.trainer_fee_value || 0,
          adminFeeType: classData.admin_fee_type,
          adminFeeValue: classData.admin_fee_value || 0,
          mckaynineCommissionType: classData.mckaynine_commission_type,
          mckaynineCommissionValue: classData.mckaynine_commission_value || 0,
          handlers,
          classTotals
        });

        reportTotals.totalCourseFees += classTotals.totalCourseFees;
        reportTotals.totalEnrollmentFees += classTotals.totalEnrollmentFees;
        reportTotals.totalFranchiseFees += classTotals.totalFranchiseFees;
        reportTotals.totalAmount += classTotals.totalAmount;
        reportTotals.totalHandlers += handlers.length;
      });

      // Sort classes alphabetically
      franchiseClasses.sort((a, b) => a.className.localeCompare(b.className));

      const monthLabel = format(new Date(year, month - 1), 'MMMM yyyy');
      console.log(`Final result: ${franchiseClasses.length} classes with ${reportTotals.totalHandlers} handlers for ${monthLabel}`);

      return { 
        classes: franchiseClasses, 
        reportTotals,
        paymentStatus: paymentRecord ? {
          id: paymentRecord.id,
          status: paymentRecord.status as 'pending' | 'partial' | 'paid',
          amountPaid: paymentRecord.amount_paid,
          paymentDate: paymentRecord.payment_date,
          paymentReference: paymentRecord.payment_reference,
          paymentMethod: paymentRecord.payment_method,
          notes: paymentRecord.notes
        } : undefined,
        month,
        year,
        monthLabel
      };
    },
    enabled: !!currentBranch?.id && month >= 1 && month <= 12 && year > 2000,
    staleTime: 5 * 60 * 1000, // 5 minutes - report data rarely changes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
}

// Hook to update/create franchise payment
export function useFranchisePaymentMutation() {
  const { currentBranch } = useBranch();

  const upsertPayment = async (params: {
    month: number;
    year: number;
    totalCourseFees: number;
    totalEnrollmentFees: number;
    totalFranchiseFees: number;
    totalDue: number;
    amountPaid: number;
    paymentDate?: string;
    paymentReference?: string;
    paymentMethod?: string;
    notes?: string;
    status: 'pending' | 'partial' | 'paid';
  }) => {
    if (!currentBranch?.id) throw new Error('No branch selected');

    const { data, error } = await supabase
      .from('franchise_payments')
      .upsert({
        branch_id: currentBranch.id,
        month: params.month,
        year: params.year,
        total_course_fees: params.totalCourseFees,
        total_enrollment_fees: params.totalEnrollmentFees,
        total_franchise_fees: params.totalFranchiseFees,
        total_due: params.totalDue,
        amount_paid: params.amountPaid,
        payment_date: params.paymentDate,
        payment_reference: params.paymentReference,
        payment_method: params.paymentMethod,
        notes: params.notes,
        status: params.status
      }, {
        onConflict: 'branch_id,month,year'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return { upsertPayment };
}
