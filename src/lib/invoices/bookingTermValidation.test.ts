import { describe, expect, it } from "vitest";
import { validateBookingsForInvoiceTerm } from "./bookingTermValidation";

describe("validateBookingsForInvoiceTerm", () => {
  it("accepts bookings from the invoice term", () => {
    expect(validateBookingsForInvoiceTerm([
      { id: "booking-1", class_schedules: { term_id: "term-3" } },
      { id: "booking-2", class_schedules: { term_id: "term-3" } },
    ], "term-3")).toBeNull();
  });

  it("rejects a booking from another term", () => {
    expect(validateBookingsForInvoiceTerm([
      { id: "booking-1", class_schedules: { term_id: "term-2" } },
    ], "term-3")).toBe("Every selected booking must belong to the active invoice term");
  });

  it("rejects bookings without term attribution", () => {
    expect(validateBookingsForInvoiceTerm([
      { id: "booking-1", class_schedules: { term_id: null } },
    ], "term-3")).toBe("One or more bookings do not have a term assigned");
  });
});