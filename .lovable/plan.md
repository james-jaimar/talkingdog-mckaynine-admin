

## Analysis: Template Copy Branch Safety

### What's Already Safe (No Changes Needed)

1. **Template data itself** — The copy only duplicates `content`, `subject`, `name`, `class_type`, and `variables`. The `branch_id` is set to the target branch. No Delta-specific data leaks.

2. **Logo** — Determined at send time from `currentBranch.name` via `wrapEmailContent` → `getEmailLogoUrl()`. Correct logo will be used.

3. **Signature** — Determined at send time from `currentBranch.name` via `getEmailSignature()`. Correct branch signature will appear.

4. **SMTP credentials** — The edge function already switches SMTP password based on `from_email` address (Delta vs Randburg).

5. **Queue branch attribution** — `addToQueue` uses `currentBranch.id`, so the email record is attributed to the correct branch.

### What Needs Fixing

**`from_email` is not set per-branch in the Quick Email and Info Pack modals.** When Ady sends from Randburg, the `from_email` field is left blank. The edge function then defaults to `FROM_EMAIL` (Delta's address). The email would come from `delta@mckaynine.co.za` even when sent from the Randburg branch.

The invoice email dialog already does this correctly (line 143 of `EmailInvoicePreviewDialog.tsx`), but it's missing from:
- `SendQuickEmailModal.tsx` (line 238-245)
- `SendInfoPackModal.tsx` (similar pattern)

### Plan

**Files to modify:**
- `src/components/handlers/detail/SendQuickEmailModal.tsx` — Add `from_email` to `addToQueue` calls, derived from `currentBranch.name` (randburg → `randburg@mckaynine.co.za`, else `delta@mckaynine.co.za`)
- `src/components/tasks/SendInfoPackModal.tsx` — Same fix

**Logic (same pattern already used in `EmailInvoicePreviewDialog.tsx`):**
```typescript
const fromEmail = currentBranch?.name?.toLowerCase().includes("randburg")
  ? "randburg@mckaynine.co.za"
  : "delta@mckaynine.co.za";
```

Then pass `from_email: fromEmail` in each `addToQueue.mutateAsync()` call.

This is a small but important fix — two files, a few lines each. No template content changes needed since the wrapper handles logo/signature dynamically.

