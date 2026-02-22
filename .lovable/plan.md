

# Fix: Migrate All RLS Policies from `profiles.role` to `has_role()`

## Problem

Since adding the Assistant role to AD, there have been permission errors across the system. The root cause is that **many RLS policies still use exact string matching on `profiles.role`** (e.g., `profiles.role = 'admin'`) instead of the modern `has_role()` function that checks the `user_roles` table.

This is fragile because:
- When a user has multiple roles, the `profiles.role` column may not reflect all their roles accurately
- Any role change can break previously working policies
- The `profiles.role` column is a legacy field -- `user_roles` is the authoritative source

There are **~25 RLS policies** across the following tables that still use the old pattern:
- `enrollment_registrations` (4 policies) -- this is why the intake form save fails
- `invoice_items` (6 policies)
- `invoices` (4 policies)
- `client_messages` (4 policies)
- `scan_processing_jobs` (1 policy, partially migrated)
- `branch_branding` (1 policy)
- `branch_notifications` (1 policy)
- Storage objects for `vet-clearance-docs`, `message-attachments`, `scanned-forms` buckets

## Solution

Replace every `profiles.role` check with the equivalent `has_role(auth.uid(), 'role')` call. No code changes needed -- this is purely a database migration.

### Example transformation

**Before:**
```sql
CREATE POLICY "Staff can insert enrollment registrations"
ON enrollment_registrations FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'trainer'))
);
```

**After:**
```sql
CREATE POLICY "Staff can insert enrollment registrations"
ON enrollment_registrations FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'trainer')
);
```

### Tables and Policies to Migrate

| Table | Policy | Current Check | New Check |
|-------|--------|--------------|-----------|
| enrollment_registrations | Staff can insert | profiles.role = admin/trainer | has_role admin/trainer |
| enrollment_registrations | Staff can update | profiles.role = admin/trainer | has_role admin/trainer |
| enrollment_registrations | Staff can view all | profiles.role = admin/trainer | has_role admin/trainer |
| enrollment_registrations | Staff can delete | profiles.role = admin | has_role admin |
| invoice_items | All 6 policies | profiles.role checks | has_role equivalents |
| invoices | All 4 policies | profiles.role checks | has_role equivalents |
| client_messages | Staff can view/insert | profiles.role = admin/trainer | has_role admin/trainer |
| scan_processing_jobs | Admins can manage | Mixed (partially done) | Clean up to has_role only |
| branch_branding | Platform admins | profiles.role = platform_admin | has_role platform_admin |
| branch_notifications | Platform admins | profiles.role = platform_admin | has_role platform_admin |
| storage objects | Multiple policies | profiles.role checks | has_role equivalents |

### Implementation

This will be done via SQL statements that:
1. DROP each old policy
2. CREATE the replacement policy with `has_role()` checks

All changes are atomic -- each policy replacement is independent so if one fails, the others still work.

### No Code Changes Needed

The `has_role()` security definer function already exists and is used by newer policies. This migration simply brings older policies in line with the established pattern.

