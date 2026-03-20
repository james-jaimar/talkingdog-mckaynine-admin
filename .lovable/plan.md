

# Unified Household Invoice: One Invoice, Both Handlers See It, Email Goes to Both

## Current Behavior
- Household enrollment creates **two separate invoices** (50/50 rebalance via `rebalanceHouseholdInvoices`)
- Each handler only sees invoices where `client_id = their ID`
- Email is sent to one recipient only

## Desired Behavior
- Household enrollment adds items to the **existing** invoice (same as multi-dog same-handler path)
- Both household handlers can **see** that single invoice
- When emailing, the invoice is sent to **both** handlers' email addresses

## Implementation

### 1. New DB table: `invoice_additional_recipients`
Create a junction table to link additional handlers to an invoice:

```sql
CREATE TABLE invoice_additional_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(invoice_id, client_id)
);

ALTER TABLE invoice_additional_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access for now" ON invoice_additional_recipients FOR ALL USING (true);
```

### 2. Change household enrollment path (`addHandlerToClass.ts`)
Replace the `rebalanceHouseholdInvoices` call (lines 146–177) with `addToExistingInvoice` — identical to the same-handler multi-dog path. Then insert a row into `invoice_additional_recipients` linking the second handler to the existing invoice.

### 3. Show shared invoices to both handlers (`useClientInvoices.ts`)
Change the query from `eq('client_id', clientId)` to an `or` filter:
- `client_id = handlerId` OR `id IN (SELECT invoice_id FROM invoice_additional_recipients WHERE client_id = handlerId)`

This makes the single invoice visible on both handlers' detail pages.

### 4. Email to both handlers (`useEmailInvoice.ts`)
When queueing an invoice email:
- Query `invoice_additional_recipients` for the invoice
- If additional recipients exist, fetch their email from `clients`
- Queue one email per recipient (same PDF, same content)

### 5. Update success message (`addHandlerToClass.ts`)
Change the household success message to reflect consolidation rather than rebalancing.

## Files Changed
- **New migration**: `invoice_additional_recipients` table
- `src/components/classes/handlers/hooks/add-handler-modal/addHandlerToClass.ts` — use `addToExistingInvoice` + insert recipient link
- `src/hooks/invoices/queries/useClientInvoices.ts` — include shared invoices in results
- `src/hooks/invoices/useEmailInvoice.ts` — queue emails for additional recipients
- `src/components/invoices/dialogs/EmailInvoiceDialog.tsx` — send to all recipients

~5 files, ~60 lines changed.

