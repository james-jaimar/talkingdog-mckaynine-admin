
# Fix: Email Invoice Dialog Disappears Immediately

## Problem Summary
When clicking "Email Invoice" in the dropdown menu, the progress dialog flashes briefly and disappears. No console logs appear, indicating the `handleEmailInvoice` callback in `InvoiceTableActions` is never being executed.

## Root Cause
The issue is a **callback ordering race condition**:

1. In `InvoiceBasicActions.tsx`, the handler does:
   ```javascript
   const handleEmailInvoice = () => {
     onCloseDropdown();  // <-- This triggers dropdown unmount
     onEmailInvoice(invoice);  // <-- This may never execute
   };
   ```

2. When `onCloseDropdown()` is called, it sets `dropdownOpen = false` in the parent component
3. React's state update causes the `DropdownMenuContent` (and all children including `InvoiceBasicActions`) to begin unmounting
4. The `onEmailInvoice(invoice)` call on the next line may not execute reliably because the component is being torn down

This explains why:
- No console logs appear (the parent callback is never invoked)
- The dialog "flashes" (React briefly mounts it but the state is inconsistent)

## Solution
Reverse the order of operations and use asynchronous execution to ensure the parent callback fires before the dropdown state changes affect the component tree.

### Changes Required

**File 1: `src/components/invoices/table/actions/InvoiceBasicActions.tsx`**

Change the `handleEmailInvoice` function to:
1. Call `onEmailInvoice(invoice)` FIRST (notify parent before any state changes)
2. Then call `onCloseDropdown()` to close the menu

```javascript
const handleEmailInvoice = () => {
  // CRITICAL: Notify parent FIRST, before closing dropdown
  // The parent will handle opening the dialog
  onEmailInvoice(invoice);
  // Close dropdown after parent has captured the invoice
  onCloseDropdown();
};
```

**File 2: `src/components/invoices/table/InvoiceTableActions.tsx`**

Update `handleEmailInvoice` to be more defensive:
1. Remove the `setDropdownOpen(false)` call (it's redundant since child already calls `onCloseDropdown`)
2. Add a synchronous state capture before any async operations
3. Use `requestAnimationFrame` instead of `setTimeout(0)` for more reliable timing

```javascript
const handleEmailInvoice = (inv: Invoice) => {
  console.log('[InvoiceTableActions] Email Invoice clicked for:', inv.invoice_number);
  
  // Capture state synchronously
  setSelectedInvoiceForEmail(inv);
  setPreparedPdfBase64(undefined);
  setEmailPreviewOpen(false);
  
  // Use requestAnimationFrame for reliable next-frame execution
  requestAnimationFrame(() => {
    console.log('[InvoiceTableActions] Opening progress dialog');
    setEmailProgressOpen(true);
  });
};
```

**File 3: `src/components/invoices/dialogs/EmailInvoiceProgressDialog.tsx`**

Add unconditional `onPointerDownOutside` and `onInteractOutside` prevention:
- Currently these only prevent outside clicks when `status === "loading"`
- But if the dialog opens and immediately gets an outside click event from the dropdown close, it closes
- Change to ALWAYS prevent outside clicks (use explicit Cancel button instead)

```javascript
onPointerDownOutside={(e) => {
  // Always prevent outside clicks - user must use Cancel button
  e.preventDefault();
}}
onInteractOutside={(e) => {
  // Always prevent - this stops the dropdown close event from closing the dialog
  e.preventDefault();
}}
```

## Why This Will Work

1. **Callback order fix**: By calling `onEmailInvoice(invoice)` before `onCloseDropdown()`, the parent captures the invoice and sets state before any unmounting begins

2. **requestAnimationFrame**: More reliable than `setTimeout(0)` for ensuring the dialog opens after the current render cycle completes

3. **Unconditional outside-click prevention**: Stops any lingering events from the dropdown close from being interpreted as "click outside dialog"

4. **State synchronization**: Setting `selectedInvoiceForEmail` synchronously ensures the conditional render `{selectedInvoiceForEmail && (...)}` is satisfied before attempting to open the dialog

## Technical Details

### Before (broken flow)
```text
Click "Email Invoice"
  -> onCloseDropdown() sets dropdownOpen=false
  -> React begins unmounting DropdownMenuContent
  -> onEmailInvoice(invoice) may or may not execute
  -> If it does, setTimeout fires but component tree is unstable
  -> Dialog flashes and disappears
```

### After (fixed flow)
```text
Click "Email Invoice"
  -> onEmailInvoice(invoice) called FIRST
  -> Parent sets selectedInvoiceForEmail synchronously
  -> onCloseDropdown() sets dropdownOpen=false
  -> React unmounts dropdown (doesn't affect parent state)
  -> requestAnimationFrame fires
  -> setEmailProgressOpen(true) opens dialog stably
  -> Dialog stays open
```

## Files to Modify
1. `src/components/invoices/table/actions/InvoiceBasicActions.tsx` - Reorder callback execution
2. `src/components/invoices/table/InvoiceTableActions.tsx` - Use requestAnimationFrame, remove redundant setDropdownOpen
3. `src/components/invoices/dialogs/EmailInvoiceProgressDialog.tsx` - Unconditional outside-click prevention

## Testing Checklist
1. Click dropdown menu "..." on any invoice
2. Click "Email Invoice"
3. Verify console shows `[InvoiceTableActions] Email Invoice clicked for: ...`
4. Verify progress dialog opens and stays visible
5. Verify progress advances through steps
6. Verify success leads to email preview dialog
7. Verify error shows error state with Retry button
8. Test on both desktop and mobile
