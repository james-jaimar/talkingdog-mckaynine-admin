import { describe, expect, it } from "vitest";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { inventoryCodeForFee, invoiceEditItemSchema } from "./inventoryMetadata";

describe("invoice inventory metadata", () => {
  it("retains course inventory codes through the actual form resolver", async () => {
    const resolver = zodResolver(z.object({ items: z.array(invoiceEditItemSchema) }));
    const result = await resolver({ items: [{ description: "Puppy course", quantity: 1, unit_price: 1490, booking_id: "booking", io_inventory_code: "PU", item_type: "course_fee" }] }, {}, { fields: {}, shouldUseNativeValidation: false });
    expect(result.values).toEqual({ items: [{ description: "Puppy course", quantity: 1, unit_price: 1490, booking_id: "booking", io_inventory_code: "PU", item_type: "course_fee" }] });
  });

  it("retains enrollment categorization through validation", () => {
    const item = invoiceEditItemSchema.parse({ description: "Enrollment fee", quantity: 1, unit_price: 265, io_inventory_code: "EN", item_type: "enrollment_fee" });
    expect(item.io_inventory_code).toBe("EN");
    expect(item.item_type).toBe("enrollment_fee");
  });

  it("uses the linked class code for imported course fees", () => {
    expect(inventoryCodeForFee("course_fee", "BEG")).toBe("BEG");
  });

  it("always gives enrollment fees EN rather than the course code", () => {
    expect(inventoryCodeForFee("enrollment_fee", "PU")).toBe("EN");
  });

  it("does not invent a code for a class without one", () => {
    expect(inventoryCodeForFee("course_fee", " ")).toBeNull();
  });
});