

## Problem

Deleting a handler fails because the `deleteHandler` function tries to delete dogs before deleting `handler_class_status` records. The `handler_class_status` table has a foreign key on `dog_id` referencing `dogs`, so the dogs can't be deleted first.

The error: `"update or delete on table \"dogs\" violates foreign key constraint \"handler_class_status_d..."`

## Solution

Update `deleteHandler` in `src/lib/api/handlers.ts` to delete related records in the correct order:

1. Delete `handler_class_status` records (references both `handler_id` → clients and `dog_id` → dogs)
2. Delete `handler_tasks` records (references `class_status_id` → handler_class_status, and `handler_id` → clients)
3. Delete `class_attendance` records (via bookings)
4. Delete `invoice_items` (via bookings)
5. Delete `bookings` for this handler
6. Delete `dogs` for this handler
7. Delete `client_branches` for this handler
8. Delete the `clients` record

The key fix is adding the `handler_class_status` deletion **before** deleting dogs. We should also defensively delete other FK-dependent records (bookings, attendance, etc.) to prevent similar cascading failures.

### File to modify

`src/lib/api/handlers.ts` — add deletion of `handler_class_status` (by `handler_id`) before deleting dogs, and add deletions for other dependent tables (handler_tasks, bookings, class_attendance, invoice_items, client_branches) to make the function robust against future FK issues.

