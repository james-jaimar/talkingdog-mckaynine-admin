

# Fix: "Create Invoice" Button Appears Inactive

## Problem

The "Create Invoice" button appears greyed out / unresponsive. Two issues:

1. **No visible validation errors**: The item fields (`description`, `quantity`, `unit_price`) have no `FormMessage` components, so when validation fails, the user sees nothing -- it just looks like the button didn't work.

2. **Default `unit_price: 0` fails validation**: The schema requires `min(0.01)`, but the default value is `0`. If react-hook-form is running in a validation mode that checks before submit, the form stays in an invalid state until the user changes the price field.

## Fix

### File: `src/components/handlers/detail/CreateCustomInvoice.tsx`

1. **Change default `unit_price`** from `0` to `0.01` (or just remove the min constraint for initial state)
2. **Add `FormMessage`** to each item field so validation errors are visible
3. **Add `mode: "onChange"`** to the form so validation state updates as the user types (rather than only on submit)
4. **Import `FormMessage`** from the form components

Changes:
- Line 5: add `FormMessage` to import
- Line 49: add `mode: "onChange"` to useForm config  
- Lines 168-174, 185-193, 200-212: add `<FormMessage />` after each `FormControl`

**1 file, ~6 lines added.**

