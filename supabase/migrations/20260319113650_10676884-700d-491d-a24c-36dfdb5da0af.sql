-- Force PostgREST schema cache reload so io_sync_status is recognized consistently
NOTIFY pgrst, 'reload schema';