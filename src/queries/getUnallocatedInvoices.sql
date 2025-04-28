
-- Find invoices where none of their items are linked to bookings
WITH invoice_booking_status AS (
  SELECT 
    i.id as invoice_id,
    i.invoice_number,
    i.total,
    i.status,
    i.issued_date,
    c.first_name,
    c.last_name,
    c.email,
    COUNT(DISTINCT ii.id) as total_items,
    COUNT(DISTINCT ii.booking_id) as items_with_bookings
  FROM invoices i
  JOIN clients c ON i.client_id = c.id
  LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
  WHERE i.status IN ('sent', 'paid', 'overdue')
  GROUP BY i.id, i.invoice_number, i.total, i.status, i.issued_date, 
           c.first_name, c.last_name, c.email
)
SELECT 
  invoice_id,
  invoice_number,
  total,
  status,
  issued_date,
  first_name,
  last_name,
  email,
  total_items,
  items_with_bookings
FROM invoice_booking_status
WHERE items_with_bookings = 0
ORDER BY issued_date DESC;
