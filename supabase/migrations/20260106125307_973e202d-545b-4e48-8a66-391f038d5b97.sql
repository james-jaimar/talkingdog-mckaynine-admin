-- Update the EO3 template to use the new domain
UPDATE public.platform_email_templates 
SET html_content = REPLACE(html_content, 'www.mckaynine.co.za', 'mckaynine.talkingdog.co.za'),
    updated_at = now()
WHERE code = 'EO3_INFO_PACK_JAN_2026' 
  AND html_content LIKE '%www.mckaynine.co.za%';