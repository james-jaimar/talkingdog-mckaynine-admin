-- Delete ghost duplicate invoice item (no booking_id) from Dean Nolte's invoice
DELETE FROM invoice_items WHERE id = 'f7fe1e9f-951f-41ba-8472-cdef87167bb5';

-- Correct Dean Nolte's invoice totals: 1680 (Bronze CGC) + 1327.50 (Beginner Obedience discounted) = 3007.50
UPDATE invoices SET subtotal = 3007.50, total = 3007.50 WHERE id = '4e2f6889-5e22-4296-9033-015ecbe1e13f';