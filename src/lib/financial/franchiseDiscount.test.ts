import { describe, expect, it } from 'vitest';
import { franchiseCourseDiscount } from './franchiseDiscount';

const puppyFee = { grossAmount: 1490, netAmount: 1117.5, courseFee: 1490, itemDiscount: 372.5 };

describe('franchise course discount annotations', () => {
  it('identifies the 25% second-dog reduction of R372.50 on the R1490 course fee', () => {
    expect(franchiseCourseDiscount(puppyFee)).toEqual({ reason: 'Second dog discount applied', amount: 372.5, percentage: 25 });
  });
  it('does not annotate a full-price R1490 course fee', () => {
    expect(franchiseCourseDiscount({ ...puppyFee, netAmount: 1490, itemDiscount: 0 })).toBeUndefined();
  });
  it('retains a different recorded reason instead of calling every 25% reduction second-dog', () => {
    const note = franchiseCourseDiscount({ ...puppyFee, discountReason: 'Staff discount' });
    expect(note?.reason).toBe('Staff discount');
    expect(note?.amount).toBe(372.5);
  });
  it('recognises a second-dog reduction already saved in the line without deducting it again', () => {
    expect(franchiseCourseDiscount({ ...puppyFee, grossAmount: 1117.5, itemDiscount: 0, discountReason: 'Multi-dog discount (25% off 2nd dog)' }))
      .toEqual({ reason: 'Second dog discount applied', amount: 372.5, percentage: 25 });
  });
  it('does not describe redistributed trainer shares as a line-specific 25% discount', () => {
    const note = franchiseCourseDiscount({ ...puppyFee, grossAmount: 1398.75, netAmount: 1398.75, itemDiscount: 0, adjustmentReason: 'multi_dog_fair_share' });
    expect(note?.amount).toBeNull();
    expect(note?.percentage).toBeNull();
  });
  it('does not infer a discount from a lower historical fee without a recorded household reason', () => {
    expect(franchiseCourseDiscount({ ...puppyFee, grossAmount: 1117.5, itemDiscount: 0 })).toBeUndefined();
  });
});