-- Mark all 2025 bookings with pending payment as paid
UPDATE bookings 
SET payment_status = 'paid', 
    updated_at = now()
WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01' 
AND payment_status != 'paid';