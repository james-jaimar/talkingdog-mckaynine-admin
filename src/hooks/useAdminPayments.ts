import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBranch } from '@/context/BranchContext';
import { isEnrollmentFeeItem } from '@/lib/invoiceItemUtils';
import { roundToCents } from '@/lib/invoiceMath';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface AdminFeeClassGroup {
  className: string;
  classType: string;
  revenue: number;
  adminFeeType: string;
  adminFeeValue: number;
  adminFeeTotal: number;
}

export interface AdminPaymentStatus {
  id?: string;
  status: 'pending' | 'partial' | 'paid';
  amountPaid: number;
  paymentDate?: string;
  paymentReference?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface AdminPaymentData {
  classes: AdminFeeClassGroup[];
  totalAdminFees: number;
  paymentStatus?: AdminPaymentStatus;
  month: number;
  year: number;
  monthLabel: string;
}

interface UseAdminPaymentsParams {
  month: number;
  year: number;
}

export function useAdminPayments({ month, year }: UseAdminPaymentsParams) {
  const { currentBranch } = useBranch();

  return useQuery({
    queryKey: ['admin-payments-data', currentBranch?.id, month, year],
    queryFn: async (): Promise<AdminPaymentData> => {
      if (!currentBranch?.id) {
        return {
          classes: [],
          totalAdminFees: 0,
          month,
          year,
          monthLabel: format(new Date(year, month - 1), 'MMMM yyyy')
        };
      }

      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(new Date(year, month - 1));
      const startDateStr = format(monthStart, 'yyyy-MM-dd');
      const endDateStr = format(monthEnd, 'yyyy-MM-dd');
      const franchiseMonthStr = `${year}-${String(month).padStart(2, '0')}`;

      // Fetch classes and invoices in parallel
      const [classesResult, invoicesResult, paymentResult] = await Promise.all([
        supabase
          .from('classes')
          .select('id, name, class_type, admin_fee_type, admin_fee_value')
          .eq('branch_id', currentBranch.id),
        supabase
          .from('invoices')
          .select(`
            id, issued_date, franchise_report_month, subtotal, monetary_discount,
            invoice_items (
              id, amount, description, item_type,
              booking:booking_id (
                id,
                class_schedule:class_schedule_id (
                  id, class_id
                )
              )
            )
          `)
          .eq('branch_id', currentBranch.id),
        supabase
          .from('admin_payments')
          .select('*')
          .eq('branch_id', currentBranch.id)
          .eq('month', month)
          .eq('year', year)
          .maybeSingle()
      ]);

      if (classesResult.error) throw classesResult.error;
      if (invoicesResult.error) throw invoicesResult.error;

      const classes = classesResult.data || [];
      
      // Filter invoices by franchise month or issued date
      const branchInvoices = (invoicesResult.data || []).filter(inv => {
        if (inv.franchise_report_month) {
          return inv.franchise_report_month === franchiseMonthStr;
        }
        const issuedDate = inv.issued_date;
        return issuedDate >= startDateStr && issuedDate <= endDateStr;
      });

      // Aggregate revenue per class (net of discounts, excluding enrollment fees)
      const classRevenueMap = new Map<string, number>();

      branchInvoices.forEach(invoice => {
        const invoiceSubtotal = invoice.subtotal || 0;
        const invoiceDiscount = invoice.monetary_discount || 0;
        const discountRatio = invoiceSubtotal > 0 ? invoiceDiscount / invoiceSubtotal : 0;

        invoice.invoice_items?.forEach(item => {
          if (!item.booking?.class_schedule?.class_id) return;
          
          const isEnrollment = isEnrollmentFeeItem({
            item_type: item.item_type,
            description: item.description
          });
          if (isEnrollment) return; // Admin fees are on course fees only

          const originalAmount = item.amount || 0;
          const netAmount = roundToCents(originalAmount - originalAmount * discountRatio);
          const classId = item.booking.class_schedule.class_id;

          classRevenueMap.set(classId, (classRevenueMap.get(classId) || 0) + netAmount);
        });
      });

      // Build class groups with admin fee calculations
      const adminClasses: AdminFeeClassGroup[] = [];
      let totalAdminFees = 0;

      classes.forEach(cls => {
        const revenue = classRevenueMap.get(cls.id) || 0;
        if (revenue === 0) return;

        const adminFeeTotal = cls.admin_fee_type === 'percentage'
          ? roundToCents((revenue * (cls.admin_fee_value || 0)) / 100)
          : roundToCents(cls.admin_fee_value || 0);

        adminClasses.push({
          className: cls.name,
          classType: cls.class_type,
          revenue,
          adminFeeType: cls.admin_fee_type,
          adminFeeValue: cls.admin_fee_value || 0,
          adminFeeTotal
        });

        totalAdminFees += adminFeeTotal;
      });

      adminClasses.sort((a, b) => a.className.localeCompare(b.className));

      const paymentRecord = paymentResult.data;

      return {
        classes: adminClasses,
        totalAdminFees: roundToCents(totalAdminFees),
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
        monthLabel: format(new Date(year, month - 1), 'MMMM yyyy')
      };
    },
    enabled: !!currentBranch?.id && month >= 1 && month <= 12 && year > 2000,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
}

export function useAdminPaymentMutation() {
  const { currentBranch } = useBranch();

  const upsertPayment = async (params: {
    month: number;
    year: number;
    totalAdminFees: number;
    amountPaid: number;
    paymentDate?: string;
    paymentReference?: string;
    paymentMethod?: string;
    notes?: string;
    status: 'pending' | 'partial' | 'paid';
  }) => {
    if (!currentBranch?.id) throw new Error('No branch selected');

    const { data, error } = await supabase
      .from('admin_payments')
      .upsert({
        branch_id: currentBranch.id,
        month: params.month,
        year: params.year,
        total_admin_fees: params.totalAdminFees,
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
