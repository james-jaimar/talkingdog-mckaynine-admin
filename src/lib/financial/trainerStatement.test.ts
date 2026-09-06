import { describe, it, expect } from "vitest";
import {
  statementPeriodMonthKeys,
  isInvoiceInStatementPeriod,
  statementPeriodFromMonthKeys,
  buildTrainerStatementGroups,
} from "./trainerStatement";
import { CanonicalCommissionLine } from "./canonicalCommission";

function line(overrides: Partial<CanonicalCommissionLine>): CanonicalCommissionLine {
  return {
    itemId: "item-1",
    invoiceId: "inv-1",
    bookingId: "booking-1",
    clientId: "client-1",
    scheduleId: "sched-1",
    trainerId: "trainer-1",
    classId: "class-1",
    className: "15h00 Working Trials",
    branchId: "delta",
    invoiceStatus: "paid",
    periodKey: "2026-07",
    periodInferred: false,
    isEnrollmentFee: false,
    isAllocated: true,
    grossAmount: 720,
    netAmount: 720,
    trainerBaseAmount: 720,
    trainerCommission: 288,
    franchiseFee: 0,
    adminFee: 0,
    profit: 0,
    totalFees: 288,
    isOverallocated: false,
    overallocatedAmount: 0,
    ...overrides,
  };
}

const bookingById = new Map([
  ["booking-1", { clientName: "Benjamin McNally", clientEmail: "ben@example.com", dogName: "Gordon", dogBreed: "Cocker spaniel" }],
]);

const scheduleById = new Map([
  ["sched-1", { className: "15h00 Working Trials", classDate: "11/07/2026", sortDate: 1000, trainerId: "trainer-1" }],
]);

describe("statementPeriodMonthKeys", () => {
  it("returns inclusive months for a partial date range", () => {
    expect(statementPeriodMonthKeys(new Date(2026, 6, 1), new Date(2026, 8, 6)))
      .toEqual(["2026-07", "2026-08", "2026-09"]);
  });

  it("returns a single month for a range within one month", () => {
    expect(statementPeriodMonthKeys(new Date(2026, 7, 1), new Date(2026, 7, 31))).toEqual(["2026-08"]);
  });

  it("handles reversed dates safely", () => {
    expect(statementPeriodMonthKeys(new Date(2026, 8, 6), new Date(2026, 6, 1)))
      .toEqual(["2026-07", "2026-08", "2026-09"]);
  });
});

describe("isInvoiceInStatementPeriod", () => {
  const months = new Set(["2026-08"]);

  it("prefers franchise_report_month over issued_date", () => {
    expect(isInvoiceInStatementPeriod(
      { franchise_report_month: "2026-08", issued_date: "2026-07-29T00:00:00Z" },
      months
    )).toBe(true);
    expect(isInvoiceInStatementPeriod(
      { franchise_report_month: "2026-07", issued_date: "2026-08-24T00:00:00Z" },
      months
    )).toBe(false);
  });

  it("falls back to issued_date when the report month is missing", () => {
    expect(isInvoiceInStatementPeriod(
      { franchise_report_month: null, issued_date: "2026-08-10T00:00:00Z" },
      months
    )).toBe(true);
  });

  it("excludes invoices with no usable period", () => {
    expect(isInvoiceInStatementPeriod({ franchise_report_month: null, issued_date: null }, months)).toBe(false);
  });
});

describe("statementPeriodFromMonthKeys", () => {
  it("labels a single month", () => {
    const period = statementPeriodFromMonthKeys(["2026-08"]);
    expect(period?.label).toBe("August 2026");
  });

  it("labels a multi-month span", () => {
    const period = statementPeriodFromMonthKeys(["2026-09", "2026-07"]);
    expect(period?.label).toBe("Jul - Sep 2026");
  });
});

describe("buildTrainerStatementGroups", () => {
  it("keeps one handler row per invoice item so monthly invoices are not merged", () => {
    const summary = buildTrainerStatementGroups([
      line({ itemId: "i1", invoiceId: "inv-jul", periodKey: "2026-07" }),
      line({ itemId: "i2", invoiceId: "inv-aug", periodKey: "2026-08" }),
      line({ itemId: "i3", invoiceId: "inv-sep", periodKey: "2026-09" }),
    ], { bookingById, scheduleById });

    expect(summary.classes).toHaveLength(1);
    const group = summary.classes[0];
    expect(group.className).toBe("15h00 Working Trials");
    expect(group.handlers).toHaveLength(3);
    expect(group.handlers.map((h) => h.periodKey)).toEqual(["2026-07", "2026-08", "2026-09"]);
    expect(group.courseFee).toBe(2160);
    expect(group.commissionAmount).toBe(864);
    expect(summary.totalCommission).toBe(864);
    expect(summary.totalPaid).toBe(864);
    expect(summary.outstanding).toBe(0);
  });

  it("marks mixed payment statuses as partial and totals outstanding", () => {
    const summary = buildTrainerStatementGroups([
      line({ itemId: "i1", invoiceStatus: "paid" }),
      line({ itemId: "i2", invoiceId: "inv-2", invoiceStatus: "sent", periodKey: "2026-08" }),
    ], { bookingById, scheduleById });

    expect(summary.classes[0].paymentStatus).toBe("partial");
    expect(summary.totalPaid).toBe(288);
    expect(summary.outstanding).toBe(288);
  });

  it("skips cancelled, unallocated and enrollment fee lines", () => {
    const summary = buildTrainerStatementGroups([
      line({ itemId: "i1", invoiceStatus: "cancelled" }),
      line({ itemId: "i2", isAllocated: false }),
      line({ itemId: "i3", isEnrollmentFee: true }),
    ], { bookingById, scheduleById });

    expect(summary.classes).toHaveLength(0);
    expect(summary.totalCommission).toBe(0);
  });

  it("applies the substitute commission ratio per schedule", () => {
    const subSchedule = new Map([
      ["sched-1", { className: "15h00 Working Trials", classDate: "11/07/2026", sortDate: 1000, trainerId: "original", commissionRatio: 0.5, isSubstitute: true, originalTrainerName: "Steve McClean" }],
    ]);
    const summary = buildTrainerStatementGroups([line({})], { bookingById, scheduleById: subSchedule });

    expect(summary.classes[0].handlers[0].commissionAmount).toBe(144);
    expect(summary.classes[0].isSubstitute).toBe(true);
    expect(summary.classes[0].originalTrainerName).toBe("Steve McClean");
  });

  it("rounds repeated additions to cents without drift", () => {
    const lines = Array.from({ length: 3 }, (_, i) =>
      line({ itemId: `i${i}`, netAmount: 1398.75, trainerCommission: 1049.06, periodKey: "2026-08" }));
    const summary = buildTrainerStatementGroups(lines, { bookingById, scheduleById });
    expect(summary.totalCommission).toBe(3147.18);
  });
});
