import { describe, it, expect } from "vitest";
import { buildCanonicalCommissionLines, CanonicalBooking, CanonicalInvoiceItem, CanonicalSchedule } from "./canonicalCommission";


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

const sameRatePuppySchedule: CanonicalSchedule = {
  ...puppySchedule,
  classes: {
    ...puppySchedule.classes,
    trainer_fee_value: 40,
  },
};

const sameRateElementarySchedule: CanonicalSchedule = {
  ...elementarySchedule,
  classes: {
    ...elementarySchedule.classes,
    trainer_fee_value: 40,
  },
};

const bronzeSchedule: CanonicalSchedule = {
  id: "bronze-schedule",
  trainer_id: "maria",
  classes: {
    id: "bronze-class",
    name: "14h00 Bronze CGC",
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

function multiDogItems(): CanonicalInvoiceItem[] {
  return [
    {
      id: "puppy-item",
      invoice_id: "invoice-1",
      booking_id: "puppy-booking",
      amount: 1117.5,
      description: "15h00 Puppy Class July August training class for Sammy (25% multi-dog discount applied)",
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
      amount: 1680,
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

function angelaGloverItems(): CanonicalInvoiceItem[] {
  return [
    {
      id: "angela-elementary-item",
      invoice_id: "INV-McD-2607-0037",
      booking_id: "angela-elementary-booking",
      amount: 1260,
      description: "14h00 Elementary Obedience training class for Cedar (25% multi-dog discount applied)",
      item_type: "course_fee",
      invoices: {
        id: "INV-McD-2607-0037",
        status: "paid",
        subtotal: 2940,
        monetary_discount: 0,
        discount_reason: "Multi-dog discount (25% off 2nd dog in different class)",
        branch_id: "delta",
      },
    },
    {
      id: "angela-bronze-item",
      invoice_id: "INV-McD-2607-0037",
      booking_id: "angela-bronze-booking",
      amount: 1680,
      description: "14h00 Bronze CGC training class for Pineapple",
      item_type: "course_fee",
      invoices: {
        id: "INV-McD-2607-0037",
        status: "paid",
        subtotal: 2940,
        monetary_discount: 0,
        discount_reason: "Multi-dog discount (25% off 2nd dog in different class)",
        branch_id: "delta",
      },
    },
  ];
}

describe("buildCanonicalCommissionLines", () => {
  it("splits multi-dog invoice evenly across trainers even when commission rates differ (each applies own rate to their half)", () => {
    const lines = buildCanonicalCommissionLines(multiDogItems(), bookings, [], "delta");
    const puppyLine = lines.find((line) => line.itemId === "puppy-item");
    const elementaryLine = lines.find((line) => line.itemId === "elementary-item");

    // Net course total R2797.50 → R1398.75 each trainer base
    expect(puppyLine?.trainerBaseAmount).toBe(1398.75);
    expect(elementaryLine?.trainerBaseAmount).toBe(1398.75);
    // Ady 75% × R1398.75 = R1049.06; Therese 40% × R1398.75 = R559.50
    expect(puppyLine?.trainerCommission).toBe(1049.06);
    expect(elementaryLine?.trainerCommission).toBe(559.5);
    // Franchise/admin fees stay per-line on the actual line net (not redistributed)
    expect(puppyLine?.franchiseFee).toBe(167.63);
    expect(puppyLine?.adminFee).toBe(111.75);
    expect(elementaryLine?.franchiseFee).toBe(252);
    expect(elementaryLine?.adminFee).toBe(168);
  });

  it("splits multi-dog invoice evenly across trainers with matching commission rates", () => {
    const matchingBookings = bookings.map((booking) =>
      booking.id === "elementary-booking"
        ? { ...booking, class_schedules: sameRateElementarySchedule }
        : booking.id === "puppy-booking"
        ? { ...booking, class_schedules: sameRatePuppySchedule }
        : booking
    );

    const lines = buildCanonicalCommissionLines(multiDogItems(), matchingBookings, [], "delta");
    const puppyLine = lines.find((line) => line.itemId === "puppy-item");
    const elementaryLine = lines.find((line) => line.itemId === "elementary-item");

    expect(puppyLine?.trainerBaseAmount).toBe(1398.75);
    expect(puppyLine?.trainerCommission).toBe(559.5);
    expect(elementaryLine?.trainerBaseAmount).toBe(1398.75);
    expect(elementaryLine?.trainerCommission).toBe(559.5);
  });


  it("shares Angela Glover's same-rate multi-dog discount evenly across Therese and Maria", () => {
    const angelaBookings: CanonicalBooking[] = [
      {
        id: "angela-elementary-booking",
        client_id: "angela",
        class_schedule_id: sameRateElementarySchedule.id,
        class_schedules: sameRateElementarySchedule,
      },
      {
        id: "angela-bronze-booking",
        client_id: "angela",
        class_schedule_id: bronzeSchedule.id,
        class_schedules: bronzeSchedule,
      },
    ];

    const lines = buildCanonicalCommissionLines(angelaGloverItems(), angelaBookings, [], "delta");
    const elementaryLine = lines.find((line) => line.itemId === "angela-elementary-item");
    const bronzeLine = lines.find((line) => line.itemId === "angela-bronze-item");

    expect(elementaryLine?.netAmount).toBe(1260);
    expect(bronzeLine?.netAmount).toBe(1680);
    expect(elementaryLine?.trainerBaseAmount).toBe(1470);
    expect(bronzeLine?.trainerBaseAmount).toBe(1470);
    expect(elementaryLine?.trainerCommission).toBe(588);
    expect(bronzeLine?.trainerCommission).toBe(588);
  });
});