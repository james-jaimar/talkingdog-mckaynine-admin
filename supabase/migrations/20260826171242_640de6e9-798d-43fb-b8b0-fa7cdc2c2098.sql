UPDATE public.branch_info_packs p
SET logo_url = '/__l5e/assets-v1/15a0e857-e19c-40a2-b103-7e2a7b1e4c2c/delta-logo.jpg',
    map_image_url = '/__l5e/assets-v1/0406a117-19b6-4547-9251-968d51e271a9/delta-map.png',
    hero_image_url = '/__l5e/assets-v1/e32c061e-9c1c-451e-9d8d-424ea8433fb6/puppy-hero-man.jpg'
FROM public.branches b
WHERE b.id = p.branch_id AND b.name = 'Delta';

UPDATE public.branch_info_packs p
SET logo_url = '/__l5e/assets-v1/02c1f1a8-09d9-4709-85f8-d088f0da67ba/randburg-logo.png',
    map_image_url = '/__l5e/assets-v1/057424ba-7c90-4875-aaf5-46615db781c4/randburg-map.png',
    hero_image_url = '/__l5e/assets-v1/e32c061e-9c1c-451e-9d8d-424ea8433fb6/puppy-hero-man.jpg'
FROM public.branches b
WHERE b.id = p.branch_id AND b.name = 'Randburg';