

# Fix: Starter Kit Allocation Foreign Key Blocking Invoice Updates/Deletes

## Problem

The `starter_kit_allocations` table has a foreign key (`invoice_item_id`) pointing to `invoice_items.id` with the default `ON DELETE RESTRICT` behavior. This means:

1. **Editing an invoice** fails because `useUpdateInvoice.ts` deletes all invoice_items then re-inserts them
2. **Deleting an invoice** fails because the cascade tries to remove invoice_items that are referenced by allocations

## Solution

Two changes:

### 1. Database: Change the foreign key to ON DELETE SET NULL

Drop and recreate the FK so that when an invoice_item is deleted, the allocation record is kept (for historical tracking) but its `invoice_item_id` is set to `NULL`.

```text
ALTER TABLE starter_kit_allocations
  DROP CONSTRAINT starter_kit_allocations_invoice_item_id_fkey;

ALTER TABLE starter_kit_allocations
  ADD CONSTRAINT starter_kit_allocations_invoice_item_id_fkey
  FOREIGN KEY (invoice_item_id)
  REFERENCES invoice_items(id)
  ON DELETE SET NULL;
```

This preserves the allocation history (who got a kit, when, which branch) even if the invoice is later edited or deleted.

### 2. Code: Smarter item update in useUpdateInvoice.ts

Instead of blindly deleting all items, delete only the items that do NOT have a starter kit allocation linked. For items with allocations (enrollment fees), update them in place rather than delete+recreate.

Alternatively, since the DB fix (SET NULL) handles the constraint, the existing delete-all approach will work fine after the migration. The allocation record simply loses its `invoice_item_id` link, which is acceptable since the allocation already stores `handler_id`, `dog_name`, and `branch_id` independently.

## Files

| File | Change |
|------|--------|
| New migration SQL | Alter FK to ON DELETE SET NULL |
| `src/hooks/invoices/mutations/useUpdateInvoice.ts` | No code change needed once FK is fixed |
| `src/hooks/invoices/mutations/useDeleteInvoice.ts` | No code change needed once FK is fixed |

This is a single database migration fix.
