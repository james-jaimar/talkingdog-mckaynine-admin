

# Delete Paid Invoice with IO Balance Correction

## Summary
When deleting a **paid** invoice that was synced to InvoicesOnline (IO), the system needs to create both a **Payout** and a **Credit Note** to bring the client's IO balance back to zero.

## Accounting Logic

**Starting State (after invoice paid):**
```text
Invoice:  +R1,755 (client owed this)
Payment:  -R1,755 (client paid this)
Balance:   R0 (settled)
```

**Problem: If we only issue a credit note:**
```text
Credit Note: -R1,755 (reduces what client owes)
Balance:     -R1,755 (client now has CREDIT on their account)
```

**Solution: Payout first, then Credit Note:**
```text
Step 1 - Payout:      +R1,755 (as if we're refunding them - increases their balance)
Step 2 - Credit Note: -R1,755 (reverses the original invoice)
Balance:               R0 (back to zero!)
```

## API Endpoints to Use

1. **GenerateNewPayout.php** - Create a payout document (like a refund voucher)
   - Required: `username`, `password`, `ClientID`, `data[]` (line items)
   - Optional: `prepend_nr`, `OrderNr`, `AdditionalValue1`

2. **GenerateNewCreditNote.php** - Already implemented, creates the credit note

## Implementation Changes

### 1. Edge Function: New `createIOPayout` function

```javascript
async function createIOPayout(
  credentials: IOCredentials,
  ioClientId: number,
  invoice: InvoiceData
): Promise<{ success: boolean; documentId?: string; payoutNumber?: string; url?: string; error?: string }>
```

- Calls `GenerateNewPayout.php`
- Uses the same prefix format (McD-/McR-)
- Description: `Reversal for ${invoice.invoice_number}: ${item.description}`
- `OrderNr`: Original IO invoice number
- `AdditionalValue1`: McKaynine invoice number

### 2. Edge Function: New action `reverse_paid_invoice`

Sequence:
1. Create Payout (same amount as invoice)
2. Create Credit Note (same amount as invoice)
3. Return combined result

### 3. Frontend: Update `useDeleteInvoice` hook

Check if invoice was **paid** AND synced to IO:
- If `status === 'paid'` and `io_document_id` exists:
  - Call new `reversePaidInvoice()` action
- If just synced (not paid):
  - Call existing `issueCreditNote()` action

### 4. New frontend function: `reversePaidInvoice()`

```typescript
export async function reversePaidInvoice(invoiceId: string): Promise<{
  success: boolean;
  error?: string;
}>
```

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/sync-invoice-to-io/index.ts` | Add `createIOPayout()` function, add `reverse_paid_invoice` action handler |
| `src/hooks/invoices/useIOSync.ts` | Add `reversePaidInvoice()` export function |
| `src/hooks/invoices/mutations/useDeleteInvoice.ts` | Update logic to detect paid invoices and call `reversePaidInvoice()` instead of `issueCreditNote()` |

## Technical Details

### createIOPayout Function

```javascript
async function createIOPayout(
  credentials: IOCredentials,
  ioClientId: number,
  invoice: InvoiceData
): Promise<{ success: boolean; documentId?: string; payoutNumber?: string; url?: string; error?: string }> {
  console.log(`Creating IO payout for client ${ioClientId}, reversing payment for ${invoice.invoice_number}`);

  const prefix = getIOInvoicePrefix(invoice.branch_id, invoice.issued_date);
  
  const payoutDate = invoice.payment_date 
    ? new Date(invoice.payment_date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  // Format items - same as credit note but marked as payout
  const data = invoice.items.map((item) => ({
    "0": "",
    "1": item.quantity,
    "2": `Reversal for ${invoice.invoice_number}: ${item.description}`,
    "3": item.unit_price,
    "4": "ZAR",
    "5": 0,
    "6": 0,
    "7": 0,
  }));

  const result = await callIOAPI("GenerateNewPayout.php", {
    username: credentials.username,
    password: credentials.password,
    ClientID: ioClientId,
    EmailToClient: false,
    prepend_nr: prefix,
    InvoiceDate: payoutDate,
    OrderNr: invoice.io_invoice_number || "",
    AdditionalValue1: invoice.invoice_number,
    data: data,
  });

  // Parse response (same pattern as credit note)
  if (Array.isArray(result) && result.length >= 2) {
    const docInfo = result[1] as Record<string, unknown>;
    if (docInfo.document_id || docInfo.invoice_nr) {
      return {
        success: true,
        documentId: String(docInfo.document_id || ""),
        payoutNumber: String(docInfo.invoice_nr || docInfo.document_nr || ""),
        url: String(docInfo.url || ""),
      };
    }
  }
  // ... fallback handling
}
```

### reverse_paid_invoice Action Handler

```javascript
if (action === "reverse_paid_invoice") {
  if (!invoice.io_document_id) {
    return new Response(
      JSON.stringify({ error: "Invoice must be synced to IO before reversing" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Step 1: Create payout to reverse the payment effect
  console.log("[Reverse] Step 1: Creating payout to reverse payment...");
  const payoutResult = await createIOPayout(credentials, ioClientId, invoiceData);
  
  if (!payoutResult.success) {
    return new Response(
      JSON.stringify({ error: `Payout failed: ${payoutResult.error}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Step 2: Create credit note to reverse the invoice
  console.log("[Reverse] Step 2: Creating credit note to reverse invoice...");
  const creditResult = await createIOCreditNote(credentials, ioClientId, invoiceData);
  
  if (!creditResult.success) {
    return new Response(
      JSON.stringify({ 
        error: `Credit note failed: ${creditResult.error}`,
        payout_created: true,
        io_payout_id: payoutResult.documentId,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Both succeeded - update invoice record
  await supabase
    .from("invoices")
    .update({
      io_sync_status: "reversed",
      io_payout_id: payoutResult.documentId,
      io_payout_number: payoutResult.payoutNumber,
      io_credit_note_id: creditResult.documentId,
      io_credit_note_number: creditResult.creditNoteNumber,
    })
    .eq("id", invoice_id);

  return new Response(
    JSON.stringify({ 
      success: true, 
      action: "reverse_paid_invoice",
      io_payout_id: payoutResult.documentId,
      io_payout_number: payoutResult.payoutNumber,
      io_credit_note_id: creditResult.documentId,
      io_credit_note_number: creditResult.creditNoteNumber,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### Updated useDeleteInvoice Hook

```typescript
mutationFn: async (invoiceId: string): Promise<{ id: string; ioActionTaken: string }> => {
  let ioActionTaken = 'none';

  const { data: invoice } = await supabase
    .from('invoices')
    .select('io_document_id, io_sync_status, status')
    .eq('id', invoiceId)
    .single();

  if (invoice?.io_document_id) {
    // Check if invoice was PAID - needs both payout and credit note
    if (invoice.status === 'paid') {
      console.log('[Delete] Invoice was paid and synced to IO, reversing...');
      const result = await reversePaidInvoice(invoiceId);
      
      if (!result.success) {
        console.warn('[Delete] Reverse failed:', result.error);
        toast.warning('IO reversal could not be completed', {
          description: result.error,
        });
        ioActionTaken = 'failed';
      } else {
        console.log('[Delete] Payout + Credit Note issued successfully');
        ioActionTaken = 'reversed';
      }
    } else {
      // Not paid - just issue credit note
      console.log('[Delete] Invoice synced to IO (not paid), issuing credit note');
      const result = await issueCreditNote(invoiceId);
      
      if (!result.success) {
        console.warn('[Delete] Credit note failed:', result.error);
        toast.warning('IO credit note could not be issued', {
          description: result.error,
        });
        ioActionTaken = 'failed';
      } else {
        ioActionTaken = 'credit_note';
      }
    }
  }

  // Proceed with local deletion
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId);

  if (error) throw error;

  return { id: invoiceId, ioActionTaken };
}
```

## Testing Steps

1. Go to Randburg branch
2. Find a **paid** invoice that's synced to IO (or create one)
3. Click Delete
4. Verify in IO:
   - A Payout was created for the same amount
   - A Credit Note was created for the same amount
   - The client's balance is R0
5. Verify the invoice is deleted locally

