-- Set proof_of_payment for all 2025 bookings to mark them as cleared
UPDATE bookings 
SET proof_of_payment = 'Marked as paid (batch 2025)', 
    updated_at = now()
WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01' 
AND (proof_of_payment IS NULL OR proof_of_payment = '');