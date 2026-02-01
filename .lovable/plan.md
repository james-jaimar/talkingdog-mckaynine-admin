
# Fix: Credit Notes Should Include Original Invoice Reference

## Problem
When deleting an invoice that was synced to InvoicesOnline, the credit note is created but:
1. It doesn't include a reference to the original invoice number
2. The descriptions may not be appearing correctly on the IO credit note

## Analysis
Looking at the current `createIOCreditNote` function (lines 330-349), the code:
- ✅ Fetches invoice items with descriptions
- ✅ Prefixes each line with "Credit Note:"
- ❌ Doesn't include original invoice number reference
- ❌ Doesn't use `OrderNr` or `AdditionalValue1` to link back to original

## IO API Capabilities
From the API documentation for `GenerateNewCreditNote.php`:

| Field | Max Length | Purpose |
|-------|------------|---------|
| `OrderNr` | 10 chars | Order/reference number |
| `AdditionalValue1` | 32 chars | Custom field (appears on document) |
| `prepend_nr` | 9 chars | Prefix for credit note number |

## Solution
Update `createIOCreditNote` to:

1. **Add `OrderNr`**: Use the original IO invoice number as the order reference
2. **Add `AdditionalValue1`**: Include McKaynine invoice number for cross-reference
3. **Improve descriptions**: Include more context in line item descriptions

### Changes to `supabase/functions/sync-invoice-to-io/index.ts`

#### Update the `createIOCreditNote` function:

```javascript
// Create credit note in IO to reverse/void an invoice
async function createIOCreditNote(
  credentials: IOCredentials,
  ioClientId: number,
  invoice: InvoiceData
): Promise<{ success: boolean; documentId?: string; creditNoteNumber?: string; url?: string; error?: string }> {
  console.log(`Creating IO credit note for client ${ioClientId}, reversing invoice ${invoice.invoice_number}`);

  // Generate prefix from branch and invoice date
  const prefix = getIOInvoicePrefix(invoice.branch_id, invoice.issued_date);
  console.log(`Using IO credit note prefix: ${prefix}`);
  
  // Format credit note date (use current date - credit notes are issued now)
  const creditDate = new Date().toISOString().split("T")[0];

  // Format items for IO API - include reference to original invoice
  const data = invoice.items.map((item) => ({
    "0": "", // prod_code
    "1": item.quantity, // qty
    "2": `CN for ${invoice.invoice_number}: ${item.description}`, // Clear reference to original
    "3": item.unit_price, // amount per unit
    "4": "ZAR", // currency
    "5": 0, // vat_applies (no VAT)
    "6": 0, // vat_percentage
    "7": 0, // amount_includes_vat
  }));

  const result = await callIOAPI("GenerateNewCreditNote.php", {
    username: credentials.username,
    password: credentials.password,
    ClientID: ioClientId,
    EmailToClient: false, // We handle emails ourselves
    prepend_nr: prefix, // Add branch and date prefix
    InvoiceDate: creditDate, // Credit note issued date
    OrderNr: invoice.io_invoice_number || "", // Reference to original IO invoice (max 10 chars)
    AdditionalValue1: invoice.invoice_number, // McKaynine invoice number (max 32 chars)
    data: data,
  });

  // ... rest of response handling unchanged
}
```

## Technical Details

### Current Credit Note Description Format
```text
Credit Note: 14h00 Puppy Class Feb March training class for boris
```

### Improved Credit Note Description Format  
```text
CN for INV-McD-2602-0004: 14h00 Puppy Class Feb March training class for boris
```

### New Fields Sent to IO

| Field | Value | Purpose |
|-------|-------|---------|
| `OrderNr` | "238" (IO invoice number) | Shows in Order/Reference column |
| `AdditionalValue1` | "INV-McD-2602-0004" | McKaynine reference on document |
| Description | "CN for INV-McD-2602-0004: ..." | In-line reference |

## Data Requirement
The `InvoiceData` interface needs `io_invoice_number` to be available. Let me verify this is fetched:

Currently the invoice fetch (lines 523-556) includes `io_document_id` but we also need `io_invoice_number`.

### Update `InvoiceData` interface

Add `io_invoice_number` to the interface and the SELECT query:

```javascript
interface InvoiceData {
  // ... existing fields
  io_invoice_number: string | null;  // ADD THIS
}
```

And in the SELECT query:
```javascript
.select(`
  id,
  invoice_number,
  // ... other fields
  io_invoice_url,
  io_invoice_number,  // ADD THIS
  io_payment_url,
  // ...
`)
```

## Files to Modify

1. **`supabase/functions/sync-invoice-to-io/index.ts`**
   - Add `io_invoice_number` to `InvoiceData` interface
   - Add `io_invoice_number` to the SELECT query
   - Add `io_invoice_number` to the `invoiceData` object construction
   - Update `createIOCreditNote` to include `OrderNr`, `AdditionalValue1`, and improved descriptions

## Testing
1. Find or create a synced invoice (with `io_document_id`)
2. Delete the invoice
3. Check IO dashboard - credit note should show:
   - OrderNr references the original IO invoice number
   - AdditionalValue1 shows McKaynine invoice number (if configured in IO)
   - Line items say "CN for INV-McD-XXXX-XXXX: [original description]"
