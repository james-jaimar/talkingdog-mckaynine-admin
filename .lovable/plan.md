

# Fix: Invoice Edit Drops `io_inventory_code` and `item_type`

## Problem

When INV-McD-2603-0058 was edited, the `io_inventory_code` (WTD) and `item_type` (course_fee) on the invoice item were wiped out. This caused the IO sync to send an empty product code.

**Root cause**: Two gaps in the edit flow:

1. **`InvoiceFormValues.items`** (types.ts line 119-125) doesn't include `io_inventory_code` or `item_type` — so the form never carries them
2. **`useUpdateInvoice`** (line 138-145) re-inserts items without `io_inventory_code` or `item_type` — so even if the form had them, they'd be dropped on save

## Fix

### 1. `src/hooks/invoices/types.ts`
Add `io_inventory_code` and `item_type` to the `InvoiceFormValues.items` type:
```typescript
items: {
  description: string;
  quantity: number;
  unit_price: number;
  booking_id?: string | null;
  id?: string;
  io_inventory_code?: string | null;  // ADD
  item_type?: string;                  // ADD
}[];
```

### 2. `src/hooks/invoices/mutations/useUpdateInvoice.ts`
Include `io_inventory_code` and `item_type` in the item re-insert (line 138-145):
```typescript
const itemsToInsert = values.items.map(item => ({
  invoice_id: invoiceId,
  description: item.description || "Invoice item",
  quantity: item.quantity || 1,
  unit_price: item.unit_price || 0,
  amount: (item.quantity || 1) * (item.unit_price || 0),
  booking_id: item.booking_id || null,
  io_inventory_code: item.io_inventory_code || null,  // ADD
  item_type: item.item_type || 'course_fee',           // ADD
}));
```

### 3. `src/pages/InvoiceEdit.tsx`
When loading existing items into the form, preserve `io_inventory_code` and `item_type` from the fetched invoice items (wherever the form `defaultValues` or `reset()` maps items).

## Scope
3 files, ~5 lines each. No DB migration needed — columns already exist.

