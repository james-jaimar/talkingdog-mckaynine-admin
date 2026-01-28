
# InvoicesOnline (IO) Integration Implementation Plan

## Overview

This plan implements a one-way sync from McKaynine to InvoicesOnline.co.za (IO) for invoices and payment receipts. The sync will initially be **limited to test client only** (`jimmybhawkins@gmail.com`) until confirmed working.

## Test Client Details

| Property | Value |
|----------|-------|
| Email | `jimmybhawkins@gmail.com` |
| Client ID | `b07eb9dc-f8f9-40d0-b94d-9deccd49acf4` |
| Branches | Delta (primary), Randburg (via client_branches) |

---

## Phase 1: Database Schema Updates

### 1.1 Add IO Tracking Columns to `invoices` Table

```text
+------------------------+---------------+------------------------------------------+
| Column                 | Type          | Purpose                                  |
+------------------------+---------------+------------------------------------------+
| io_sync_status         | text          | pending, synced, failed, payment_synced  |
| io_sync_error          | text          | Error message if sync failed             |
| io_synced_at           | timestamptz   | When last synced to IO                   |
| io_document_id         | text          | IO's document/invoice ID                 |
| io_invoice_number      | text          | Invoice number from IO                   |
| io_invoice_url         | text          | URL to download IO invoice PDF           |
| io_payment_url         | text          | URL to download IO payment receipt PDF   |
| io_client_id           | integer       | IO's client ID used for this invoice     |
+------------------------+---------------+------------------------------------------+
```

### 1.2 Add IO Client IDs to `clients` Table

```text
+----------------------+---------+------------------------------------------+
| Column               | Type    | Purpose                                  |
+----------------------+---------+------------------------------------------+
| io_client_id_delta   | integer | IO client ID for Delta branch account    |
| io_client_id_randburg| integer | IO client ID for Randburg branch account |
+----------------------+---------+------------------------------------------+
```

---

## Phase 2: Secrets Configuration

Four new secrets will be added (once you provide them):

| Secret Name | Description |
|-------------|-------------|
| `IO_USERNAME_DELTA` | API username for Delta branch |
| `IO_PASSWORD_DELTA` | API password for Delta branch |
| `IO_USERNAME_RANDBURG` | API username for Randburg branch |
| `IO_PASSWORD_RANDBURG` | API password for Randburg branch |

---

## Phase 3: Edge Function - `sync-invoice-to-io`

A new edge function with these capabilities:

### 3.1 Endpoints

| Path | Method | Purpose |
|------|--------|---------|
| `/` (default) | POST | Sync invoice to IO (handles both invoice and payment) |

### 3.2 Test Mode Filter

The edge function will include a hardcoded test filter:

```text
TEST_MODE = true
TEST_CLIENT_EMAIL = "jimmybhawkins@gmail.com"
```

When `TEST_MODE` is enabled, the function will:
1. Check if the invoice's client email matches `TEST_CLIENT_EMAIL`
2. If not, return early with `{ skipped: true, reason: "Test mode - client not in test list" }`
3. Log the skip for debugging

### 3.3 Sync Flow

```text
+------------------+
| Receive Request  |
| (invoice_id,     |
|  action: invoice |
|  or payment)     |
+--------+---------+
         |
         v
+------------------+
| Fetch Invoice +  |
| Client Data      |
+--------+---------+
         |
         v
+------------------+
| TEST MODE CHECK  |
| Is client email  |
| in test list?    |
+--------+---------+
         |
    No   |   Yes
    +----+----+
    |         |
    v         v
+-------+  +------------------+
| SKIP  |  | Determine Branch |
| Return|  | (Delta/Randburg) |
+-------+  +--------+---------+
                    |
                    v
           +------------------+
           | Get IO           |
           | Credentials      |
           | for branch       |
           +--------+---------+
                    |
                    v
           +------------------+
           | Check/Create     |
           | Client in IO     |
           | (GetClientID or  |
           |  NewClient API)  |
           +--------+---------+
                    |
                    v
           +------------------+
           | Create Invoice   |
           | or Payment in IO |
           | (GenerateNew-    |
           |  Invoice or      |
           |  Payment API)    |
           +--------+---------+
                    |
                    v
           +------------------+
           | Update local DB  |
           | with IO IDs      |
           | and PDF URLs     |
           +------------------+
```

### 3.4 IO API Calls

**Get Client ID:**
```text
POST https://www.invoicesonline.co.za/api/GetClientID.php?apiformat=json
Body: { username, password, ClientName, ClientEmail, ClientBranchName }
Returns: Integer (ClientID) or Error string
```

**Create New Client:**
```text
POST https://www.invoicesonline.co.za/api/NewClient.php?apiformat=json
Body: { 
  username, password, 
  client_invoice_name, client_email, 
  client_phone_nr, contact_name, contact_surname,
  client_postal_address1, client_postal_address2
}
Returns: Integer (ClientID) or Error string
```

**Create Invoice:**
```text
POST https://www.invoicesonline.co.za/api/GenerateNewInvoice.php?apiformat=json
Body: {
  username, password, ClientID,
  EmailToClient: false,
  data: [
    { 
      0: "",           // prod_code
      1: quantity,     // qty
      2: description,  // description
      3: amount,       // amount per unit
      4: "ZAR",        // currency
      5: 0,            // vat_applies
      6: 0,            // vat_percentage
      7: 0             // amount_includes_vat
    }
  ]
}
Returns: { url, invoice_nr, document_nr, document_id, email_url }
```

**Create Payment:**
```text
POST https://www.invoicesonline.co.za/api/GenerateNewPayment.php?apiformat=json
Body: {
  username, password, ClientID,
  PaymentDate: "YYYY-MM-DD",
  PaymentAmount: total,
  PaymentMethod: "EFT",
  EmailToClient: false
}
Returns: { url, invoice_nr, email_url }
```

---

## Phase 4: TypeScript Type Updates

### 4.1 Update Invoice Interface

Add to `src/hooks/invoices/types.ts`:

```text
// IO Sync Status
io_sync_status?: 'pending' | 'synced' | 'failed' | 'payment_synced' | null;
io_sync_error?: string | null;
io_synced_at?: string | null;
io_document_id?: string | null;
io_invoice_number?: string | null;
io_invoice_url?: string | null;
io_payment_url?: string | null;
io_client_id?: number | null;
```

---

## Phase 5: Hook Integration

### 5.1 Modify `useMarkInvoiceAsSent`

After successfully marking invoice as "sent":
1. Call the `sync-invoice-to-io` edge function with `action: 'invoice'`
2. Handle response in background (don't block UI)
3. Show toast notification with sync result

### 5.2 Modify `useMarkInvoiceAsPaid`

After successfully marking invoice as "paid":
1. Check if invoice already has `io_document_id` (was synced)
2. If synced, call `sync-invoice-to-io` with `action: 'payment'`
3. Handle response in background
4. Show toast notification

---

## Phase 6: UI Additions (Optional for initial release)

### 6.1 Invoice Detail View

Add IO sync status indicator showing:
- Pending (gray clock icon)
- Synced (green check icon)
- Failed (red X icon with retry button)
- Payment Synced (green check with payment badge)

### 6.2 Future: Date-Based Sync UI

Once testing is complete, add a UI for syncing invoices by date range:
- Select date range (start/end)
- Preview invoices to sync
- "Sync to IO" button
- Progress indicator

---

## Implementation Order

### Step 1: Database Migration
- Add IO columns to `invoices` table
- Add IO client ID columns to `clients` table

### Step 2: Secrets Setup (BLOCKED - waiting for API credentials)
- Add IO_USERNAME_DELTA, IO_PASSWORD_DELTA
- Add IO_USERNAME_RANDBURG, IO_PASSWORD_RANDBURG

### Step 3: Edge Function Development
- Create `sync-invoice-to-io` edge function
- Implement test mode filter for `jimmybhawkins@gmail.com`
- Implement client lookup/creation
- Implement invoice sync
- Implement payment sync

### Step 4: TypeScript Types
- Update Invoice interface with IO fields

### Step 5: Hook Integration
- Modify `useMarkInvoiceAsSent` to trigger sync
- Modify `useMarkInvoiceAsPaid` to trigger payment sync

### Step 6: Testing
- Create test invoice for james hawkins
- Mark as sent -> verify sync to IO
- Mark as paid -> verify payment sync to IO

---

## Rollout Strategy

### Phase A: Test Client Only
- `TEST_MODE = true`
- Only syncs for `jimmybhawkins@gmail.com`
- Verify end-to-end flow works

### Phase B: Expand Testing
- Add more test clients to the list
- Verify multi-branch handling

### Phase C: Date-Based Sync UI
- Build UI for selecting date ranges
- Allow bulk sync of historical invoices

### Phase D: Full Rollout
- Set `TEST_MODE = false`
- All new invoices sync automatically

---

## Technical Notes

### Branch-to-IO Account Mapping

```text
+----------------------------------+----------------------------------+
| Branch                           | IO Account Credentials           |
+----------------------------------+----------------------------------+
| Delta (6351a9e8-77db...)         | IO_USERNAME_DELTA / PASSWORD     |
| Randburg (284817cf-de0d...)      | IO_USERNAME_RANDBURG / PASSWORD  |
+----------------------------------+----------------------------------+
```

### Error Handling

- All IO API failures are logged but don't break local functionality
- Failed syncs update `io_sync_status = 'failed'` and store error in `io_sync_error`
- Retry can be triggered manually (future: retry button in UI)

### PDF Storage (Future Enhancement)

IO returns PDF URLs that can be downloaded. Future enhancement:
1. Download PDF from IO URL
2. Store in Supabase Storage bucket `io-documents`
3. Attach IO PDF to emails instead of locally-generated

---

## Files to Create/Modify

### New Files
- `supabase/functions/sync-invoice-to-io/index.ts` - Main edge function

### Modified Files
- `src/hooks/invoices/types.ts` - Add IO sync fields to Invoice interface
- `src/hooks/invoices/status/useMarkInvoiceAsSent.ts` - Add IO sync trigger
- `src/hooks/invoices/status/useMarkInvoiceAsPaid.ts` - Add IO payment sync trigger
- `supabase/config.toml` - Add function configuration

### Database Migration
- Add columns to `invoices` table
- Add columns to `clients` table

---

## What's Needed to Proceed

1. **IO API Credentials** (4 secrets):
   - Delta: username + password
   - Randburg: username + password

Once you provide the credentials, I can implement the full solution with the test mode enabled for your email only.
