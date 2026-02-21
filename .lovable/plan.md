

# Add IO Inventory Codes to Classes and Invoice Sync

## Summary

Add an optional `io_inventory_code` field to each class. When syncing invoices to IO, this code is sent as the `prod_code` field. Your custom description (with dog names) is preserved -- IO treats `prod_code` and `description` as independent fields. McKaynine remains the single source of truth for all pricing; the inventory code is purely a reporting label for the franchisor.

## How It Works

- Each class gets a new optional text field: **IO Inventory Code** (e.g., `BEG`, `PU`, `EN`)
- When creating an invoice, the inventory code from the class is stored on each invoice item
- When syncing to IO, the code is sent as `prod_code` -- but YOUR description and YOUR price are what IO uses. The inventory code just tags the line for the franchisor's reports
- Enrollment fee items get a hardcoded code of `EN` (since enrollment is always the same SKU)
- If no code is set on a class, an empty string is sent (same as today -- nothing breaks)

This means:
- Your prices stay as the single source of truth (IO inventory prices are ignored when a custom price is provided)
- Your descriptions with dog names are preserved
- The franchisor gets her inventory reporting codes
- You only need to set the code once per class, not per invoice

## Technical Details

### 1. Database Migration

Add two new columns:

- `classes.io_inventory_code` (text, nullable) -- stores the IO SKU for each class (e.g., `BEG`, `PU`, `EO3`)
- `invoice_items.io_inventory_code` (text, nullable) -- captures the code at invoice creation time so it's frozen even if the class code changes later

### 2. Class Form Updates

**Files:** `EditClassForm.tsx`, `AddClassForm.tsx`, `classFormSchema.ts`, `class.ts`, `class-types.ts`

- Add `io_inventory_code` to the Zod schema as an optional string
- Add a text input field in the class forms labeled "IO Inventory Code" with a helper description: "SKU code for InvoicesOnline reporting (e.g., BEG, PU, NOV)"
- Add the field to the Class type interface
- The submission handler already saves all form values to the `classes` table, so no special save logic needed

### 3. Invoice Creation

**File:** `createInvoiceForHandler.ts`

- Accept `classIOInventoryCode` as a new optional prop
- When building invoice items, set `io_inventory_code` on course fee items from the class code
- Enrollment fee items get hardcoded `EN`
- The `createInvoiceUtils.ts` passes this through to the `invoice_items` insert

**File:** `createInvoiceUtils.ts`

- Include `io_inventory_code` when inserting invoice items

### 4. Edge Function Sync

**File:** `supabase/functions/sync-invoice-to-io/index.ts`

- Expand the invoice items SELECT query to include `io_inventory_code`
- Add `io_inventory_code` to the items interface in `InvoiceData`
- In `createIOInvoice`, use `item.io_inventory_code || ""` for field `"0"` (prod_code) instead of the current empty string

### 5. Caller Updates

**File:** `addHandlerToClass.ts`

- Pass the class's `io_inventory_code` through to `createInvoiceForHandler`

### Data Flow

```text
Class (io_inventory_code: "BEG")
  --> Invoice Creation (item.io_inventory_code = "BEG")
    --> Invoice Item stored in DB (io_inventory_code: "BEG")
      --> IO Sync reads item.io_inventory_code
        --> Sends prod_code: "BEG" + your custom description + your price to IO
```

### Suggested IO Code Mapping (for reference when filling in classes)

```text
Class Type     IO Code
----------     -------
Puppy          PU
EO (2-month)   EO2
EO (3-month)   EO3
Beginner       BEG
Novice         NOV
CGC Bronze     CGCB
CGC Silver     CGCS
WT             WTD
A-Test         ATEST
Yoga           BNB
Enrollment     EN (auto-set)
```

You'll set these codes once per class via the edit form. No automatic mapping -- you're in full control of which code goes where, which handles edge cases like EO2 vs EO3 naturally since those are separate classes.

