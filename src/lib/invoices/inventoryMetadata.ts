import { z } from "zod";

// Zod strips undeclared fields; metadata must be declared before resolver submission.
export const invoiceEditItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit_price: z.number().min(0, "Unit price can't be negative"),
  booking_id: z.string().optional().nullable(),
  io_inventory_code: z.string().optional().nullable(),
  item_type: z.string().optional(),
});

export function inventoryCodeForFee(itemType: string, classCode?: string | null): string | null {
  return itemType === "enrollment_fee" ? "EN" : classCode?.trim() || null;
}