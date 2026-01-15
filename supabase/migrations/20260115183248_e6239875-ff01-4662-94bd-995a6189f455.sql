
-- Clean up cross-branch booking for Jane & Richard
-- Client is Randburg, but was incorrectly enrolled in Delta class

-- First, delete the invoice items (must be deleted before invoice)
DELETE FROM invoice_items 
WHERE invoice_id = '7b581677-32d9-4b23-a123-27d04baa5aa1';

-- Delete the invoice
DELETE FROM invoices 
WHERE id = '7b581677-32d9-4b23-a123-27d04baa5aa1';

-- Delete the cross-branch booking
DELETE FROM bookings 
WHERE id = 'a789ca8f-86bc-45fe-afc7-b6c517f17556';
