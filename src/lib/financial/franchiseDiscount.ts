import { roundToCents } from '@/lib/invoiceMath';

export interface FranchiseDiscountNote {
  reason: string;
  amount: number | null;
  percentage: number | null;
}

/** Report annotations only: never change stored fees or report totals. */
export function franchiseCourseDiscount(params: {
  discountReason?: string | null;
  itemDiscount: number;
  grossAmount: number;
  netAmount: number;
  courseFee: number;
  adjustmentReason?: string | null;
}): FranchiseDiscountNote | undefined {
  const reason = params.discountReason?.trim();
  const household = /multi[-\s]?dog|(?:2nd|second)\s+dog/i.test(reason || '');
  if (params.adjustmentReason === 'multi_dog_fair_share') {
    return { reason: 'Second dog discount applied; shared course-fee allocation', amount: null, percentage: null };
  }
  const embeddedDiscount = household && params.itemDiscount <= 0
    ? Math.max(0, roundToCents(params.courseFee - params.netAmount)) : 0;
  const amount = roundToCents(params.itemDiscount > 0 ? params.itemDiscount : embeddedDiscount);
  if (amount <= 0) return undefined;
  const gross = embeddedDiscount > 0 ? params.courseFee : params.grossAmount;
  const percentage = gross > 0 ? roundToCents(amount / gross * 100) : null;
  return {
    reason: household || (!reason && percentage === 25)
      ? 'Second dog discount applied' : reason || 'Discount applied',
    amount,
    percentage,
  };
}

export function formatFranchiseDiscount(note: FranchiseDiscountNote, currency: (amount: number) => string): string {
  return [
    note.amount !== null ? `-${currency(note.amount)}` : '',
    note.percentage !== null ? `${note.percentage}%` : '',
    note.reason,
  ].filter(Boolean).join(' · ');
}