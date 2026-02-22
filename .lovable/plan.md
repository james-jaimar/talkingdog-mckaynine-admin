

# Fix: IO Inventory Code Missing on 2nd Dog Line Item

## Problem

When a second dog is added to an existing invoice via the multi-dog discount flow (`addToExistingInvoice`), the `io_inventory_code` is not included on the new line items. The database confirms this: Molly's item has `BNB` but Fagin's item has `null`.

The root cause is that `addToExistingInvoice` was written before IO inventory codes were introduced, so it neither accepts nor uses the code.

## Fix (2 files)

### 1. `src/components/classes/handlers/hooks/add-handler-modal/addToExistingInvoice.ts`

- Add `classIOInventoryCode?: string | null` to the `AddToExistingInvoiceProps` interface (line 8-19)
- Add `io_inventory_code` to the item type definition (lines 87-95)
- Set `io_inventory_code: classIOInventoryCode || null` on course fee items (line 110-118)
- Set `io_inventory_code: 'EN'` on enrollment fee items (line 124-132), matching the pattern in `createInvoiceForHandler.ts`

### 2. `src/components/classes/handlers/hooks/add-handler-modal/addHandlerToClass.ts`

- Pass the existing `classDetails.ioInventoryCode` to the `addToExistingInvoice` call (around line 188-199), adding:
  `classIOInventoryCode: classDetails.ioInventoryCode`

No database migration needed. The `io_inventory_code` column already exists on `invoice_items`.

