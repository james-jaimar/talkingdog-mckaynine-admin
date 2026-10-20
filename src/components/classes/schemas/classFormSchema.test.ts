import { describe, expect, it } from "vitest";
import { classFormSchema } from "./classFormSchema";

const month = classFormSchema.shape.report_month_override;

describe("class reporting month", () => {
  it("accepts November 2026", () => {
    expect(month.parse("2026-11")).toBe("2026-11");
  });
  it("allows clearing the override to schedule-date allocation", () => {
    expect(month.parse(null)).toBeNull();
  });
  it("rejects invalid months", () => {
    expect(month.safeParse("2026-13").success).toBe(false);
  });
});