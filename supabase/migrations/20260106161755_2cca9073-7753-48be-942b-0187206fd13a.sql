-- Update the EO template to be specifically for EO3
UPDATE public.platform_email_templates 
SET name = 'EO3 Class Info Pack',
    description = 'Information pack for Elementary Obedience 3 (EO3) class',
    updated_at = now()
WHERE code = 'EO3_INFO_PACK_JAN_2026';