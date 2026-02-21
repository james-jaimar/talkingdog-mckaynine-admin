

# Bulk Sync Unsynced Invoices to InvoicesOnline

## The Situation

The "Mark as Paid" flow **already** includes IO sync logic -- it syncs the invoice to IO first (if not already synced), then records the payment. This was working for the one invoice that went through the email workflow. The other 42 invoices were likely marked as paid **before** this IO sync logic was added to the mark-as-paid flow, so they never got pushed to IO.

Going forward, any new invoice marked as paid will automatically sync. The problem is the **existing backlog of 42 unsynced invoices**.

## What We'll Build

A "Bulk Sync to IO" feature on the Invoices page that:
1. Shows how many invoices are unsynced (have no `io_document_id`)
2. Lets you sync them all to IO with one click
3. For paid invoices, syncs both the invoice AND the payment
4. Shows progress as it works through them
5. Reports results (successes, failures)

## Where It Will Appear

On the Invoices page, a warning banner will appear when unsynced invoices are detected for the current branch:

```
[Warning Icon] 42 invoices not synced to InvoicesOnline  [Sync Now]
```

Clicking "Sync Now" opens a progress dialog showing each invoice being processed.

## Technical Details

### 1. New Component: `BulkIOSyncBanner.tsx`

Location: `src/components/invoices/BulkIOSyncBanner.tsx`

- Queries invoices where `io_document_id IS NULL` and `status != 'draft'` and `status != 'cancelled'` for the current branch
- Shows a warning banner with count and "Sync Now" button
- On click, opens a dialog that iterates through each invoice:
  - Calls `syncInvoiceToIO(id, 'invoice')` to create the invoice in IO
  - If the invoice is `paid`, also calls `syncInvoiceToIO(id, 'payment')` to record the payment
- Shows real-time progress (e.g., "Syncing 5 of 42...")
- Displays summary on completion (X succeeded, Y failed)

### 2. Add Banner to Invoices Page

In `src/pages/Invoices.tsx`, add the `BulkIOSyncBanner` component above the invoice list. It will only render when there are unsynced invoices.

### 3. No Edge Function Changes

The existing `sync-invoice-to-io` edge function already handles both `invoice` and `payment` actions with full idempotency checks. No backend changes needed.

### 4. No Database Changes

We're querying existing columns (`io_document_id`, `status`, `branch_id`) that already exist on the `invoices` table.

