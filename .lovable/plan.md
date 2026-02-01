# Payment Receipt PDF Attachment - COMPLETED ✓

## What Was Fixed
The IO `GenerateNewPayment.php` API doesn't return a PDF URL, so we now construct it ourselves using the `PaymentID`, `PaymentNR`, and branch `BusinessID`.

## Changes Made
- Added `IO_BUSINESS_ID_DELTA` and `IO_BUSINESS_ID_RANDBURG` constants
- Added `IO_DOWNLOAD_BASE` URL constant
- Added `getIOBusinessId()` helper function
- Updated `createIOPayment()` to construct the payment receipt URL
- Updated payment action handler to pass business ID

## URL Pattern
`https://www.invoicesonline.co.za/scripts/Download.php?type=payment&id={PaymentID}&bid={businessId}&did={PaymentNR}`

## Testing
1. Mark a test invoice as paid for jimmybhawkins@gmail.com
2. Check `io_payment_url` is now populated with the constructed URL
3. Verify the payment receipt email has the PDF attachment
