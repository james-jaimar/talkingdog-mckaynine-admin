-- Fix corrupted booking dates: restore created_at from linked invoice issued_date
UPDATE bookings b
SET created_at = i.issued_date,
    updated_at = now()
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
WHERE ii.booking_id = b.id
AND b.created_at >= '2026-01-01'
AND i.issued_date < '2026-01-01';