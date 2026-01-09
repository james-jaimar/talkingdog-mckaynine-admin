-- Delete the duplicate uppercase Keith Osburn (KEITH.OSBURN@GMAIL.COM)
-- Client ID: 6be4cc68-6ade-4cfc-8896-856fb3e7f515

-- First delete class attendance records
DELETE FROM class_attendance WHERE booking_id IN (SELECT id FROM bookings WHERE client_id = '6be4cc68-6ade-4cfc-8896-856fb3e7f515');

-- Delete bookings
DELETE FROM bookings WHERE client_id = '6be4cc68-6ade-4cfc-8896-856fb3e7f515';

-- Delete dogs
DELETE FROM dogs WHERE client_id = '6be4cc68-6ade-4cfc-8896-856fb3e7f515';

-- Delete the client
DELETE FROM clients WHERE id = '6be4cc68-6ade-4cfc-8896-856fb3e7f515';