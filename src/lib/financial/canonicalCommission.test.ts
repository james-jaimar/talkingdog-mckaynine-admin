import { describe, it, expect } from "vitest";
import { buildCanonicalCommissionLines, CanonicalBooking, CanonicalInvoiceItem, CanonicalSchedule } from "./canonicalCommission";

// NOTE: Fair-share redistribution is now performed by the database trigger
// `apply_fair_share_to_invoice`, which rewrites `invoice_items.amount` in place
// for multi-dog + multi-trainer + single-handler invoices. By the time these
// items reach `buildCanonicalCommissionLines`, `amount` already IS the fair
// share, so the canonical calculator simply reads it. These tests verify that
// no runtime redistribution happens — commission is always rate × amount.

const puppySchedule: CanonicalSchedule = {
  id: "puppy-schedule",
  trainer_id: "ady",
  classes: {
    id: "puppy-class",
    name: "15h00 Puppy Class July August",
    trainer_fee_type: "percentage",
    trainer_fee_value: 75,
    mckaynine_commission_type: "percentage",
    mckaynine_commission_value: 15,
    admin_fee_type: "percentage",
    admin_fee_value: 10,
    branch_id: "delta",
  },
};

const elementarySchedule: CanonicalSchedule = {
  id: "elementary-schedule",
  trainer_id: "therese",
  classes: {
    id: "elementary-class",
    name: "14h00 Elementary Obedience",
    trainer_fee_type: "percentage",
    trainer_fee_value: 40,
    mckaynine_commission_type: "percentage",
    mckaynine_commission_value: 15,
    admin_fee_type: "percentage",
    admin_fee_value: 10,
    branch_id: "delta",
  },
};

const bookings: CanonicalBooking[] = [
  {
    id: "puppy-booking",
    client_id: "handler-1",
    class_schedule_id: puppySchedule.id,
    class_schedules: puppySchedule,
  },
  {
    id: "elementary-booking",
    client_id: "handler-1",
    class_schedule_id: elementarySchedule.id,
    class_schedules: elementarySchedule,
  },
];

// After the DB trigger rewrites line amounts to R1398.75 each (fair share of R2797.50 net),
// the canonical calculator should just apply each trainer's own rate to it.
function fairShareRewrittenItems(): CanonicalInvoiceItem[] {
  return [
    {
      id: "puppy-item",
      invoice_id: "invoice-1",
      booking_id: "puppy-booking",
      amount: 1398.75, // rewritten from 1117.5
      description: "15h00 Puppy Class July August training class for Sammy",
      item_type: "course_fee",
      invoices: {
        id: "invoice-1",
        status: "paid",
        subtotal: 3327.5,
        monetary_discount: 0,
        discount_reason: "Multi-dog discount (25% off 2nd dog in different class)",
        branch_id: "delta",
      },
    },
    {
      id: "elementary-item",
      invoice_id: "invoice-1",
      booking_id: "elementary-booking",
      amount: 1398.75, // rewritten from 1680
      description: "14h00 Elementary Obedience training class for Remi",
      item_type: "course_fee",
      invoices: {
        id: "invoice-1",
        status: "paid",
        subtotal: 3327.5,
        monetary_discount: 0,
        discount_reason: "Multi-dog discount (25% off 2nd dog in different class)",
        branch_id: "delta",
      },
    },
  ];
}

describe("buildCanonicalCommissionLines", () => {
  it("applies each trainer's own commission rate to the already-rewritten line amount", () => {
    const lines = buildCanonicalCommissionLines(fairShareRewrittenItems(), bookings, [], "delta");
    const puppyLine = lines.find((line) => line.itemId === "puppy-item");
    const elementaryLine = lines.find((line) => line.itemId === "elementary-item");

    // trainerBaseAmount equals the stored (fair-share) amount — no runtime redistribution.
    expect(puppyLine?.trainerBaseAmount).toBe(1398.75);
    expect(elementaryLine?.trainerBaseAmount).toBe(1398.75);

    // Commission = rate × amount, applied per line.
    expect(puppyLine?.trainerCommission).toBe(1049.06); // 75% × 1398.75
    expect(elementaryLine?.trainerCommission).toBe(559.5); // 40% × 1398.75

    // Franchise/admin fees are also computed off the (rewritten) line amount.
    expect(puppyLine?.franchiseFee).toBe(209.81); // 15% × 1398.75
    expect(puppyLine?.adminFee).toBe(139.88); // 10% × 1398.75
    expect(elementaryLine?.franchiseFee).toBe(209.81);
    expect(elementaryLine?.adminFee).toBe(139.88);
  });

  it("does not redistribute for a single-trainer multi-dog invoice (trigger won't have rewritten it)", () => {
    const singleTrainerBookings: CanonicalBooking[] = [
      { id: "b1", client_id: "handler-x", class_schedule_id: elementarySchedule.id, class_schedules: elementarySchedule },
      { id: "b2", client_id: "handler-x", class_schedule_id: elementarySchedule.id, class_schedules: elementarySchedule },
    ];
    const items: CanonicalInvoiceItem[] = [
      { id: "i1", invoice_id: "inv-2", booking_id: "b1", amount: 1260, item_type: "course_fee",
        invoices: { id: "inv-2", status: "paid", subtotal: 2940, monetary_discount: 0,
          discount_reason: "Multi-dog discount", branch_id: "delta" } },
      { id: "i2", invoice_id: "inv-2", booking_id: "b2", amount: 1680, item_type: "course_fee",
        invoices: { id: "inv-2", status: "paid", subtotal: 2940, monetary_discount: 0,
          discount_reason: "Multi-dog discount", branch_id: "delta" } },
    ];
    const lines = buildCanonicalCommissionLines(items, singleTrainerBookings, [], "delta");
    expect(lines.find((l) => l.itemId === "i1")?.trainerCommission).toBe(504); // 40% × 1260
    expect(lines.find((l) => l.itemId === "i2")?.trainerCommission).toBe(672); // 40% × 1680
  });
});
