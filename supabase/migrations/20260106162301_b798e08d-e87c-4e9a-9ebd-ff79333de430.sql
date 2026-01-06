-- Update template_configurations to show EO3 instead of EO
UPDATE public.template_configurations 
SET name = 'EO3 Class Info Pack',
    description = 'Information pack for Elementary Obedience 3 (EO3) class',
    updated_at = now()
WHERE template_code = 'eo_info_pack';