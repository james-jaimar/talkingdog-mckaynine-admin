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

const sameRateElementarySchedule: CanonicalSchedule = {
  ...elementarySchedule,
  classes: {
    ...elementarySchedule.classes,
    trainer_fee_value: 75,
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

describe("buildCanonicalCommissionLines", () => {
  it("does not redistribute multi-dog revenue across trainers with different commission rates", () => {
    const lines = buildCanonicalCommissionLines(multiDogItems(), bookings, [], "delta");
    const puppyLine = lines.find((line) => line.itemId === "puppy-item");
    const elementaryLine = lines.find((line) => line.itemId === "elementary-item");

    expect(puppyLine?.trainerBaseAmount).toBe(1117.5);
    expect(puppyLine?.trainerCommission).toBe(838.13);
    expect(puppyLine?.profit).toBe(0);
    expect(elementaryLine?.trainerBaseAmount).toBe(1680);
    expect(elementaryLine?.trainerCommission).toBe(672);
  });

  it("still redistributes multi-dog revenue across trainers with matching commission rates", () => {
    const matchingBookings = bookings.map((booking) =>
      booking.id === "elementary-booking"
        ? { ...booking, class_schedules: sameRateElementarySchedule }
        : booking
    );

    const lines = buildCanonicalCommissionLines(multiDogItems(), matchingBookings, [], "delta");
    const puppyLine = lines.find((line) => line.itemId === "puppy-item");
    const elementaryLine = lines.find((line) => line.itemId === "elementary-item");

    expect(puppyLine?.trainerBaseAmount).toBe(1398.75);
    expect(puppyLine?.trainerCommission).toBe(1049.06);
    expect(elementaryLine?.trainerBaseAmount).toBe(1398.75);
    expect(elementaryLine?.trainerCommission).toBe(1049.06);
  });
});