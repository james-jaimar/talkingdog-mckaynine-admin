INSERT INTO public.assistants (user_id, first_name, last_name, email, branch_id, is_active)
VALUES ('ae0b1b9d-6942-45ad-a0ab-49c601bb26e8', 'Ady', 'Hawkins', 'ady@talkingdog.co.za', '6351a9e8-77db-403b-ab1f-cd47e393a006', true)
ON CONFLICT DO NOTHING;