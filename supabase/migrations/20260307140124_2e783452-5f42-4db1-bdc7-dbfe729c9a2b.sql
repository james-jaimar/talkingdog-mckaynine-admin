ALTER TABLE class_types ADD COLUMN next_class_type text;

UPDATE class_types SET next_class_type = 'EO' WHERE name = 'Puppy';
UPDATE class_types SET next_class_type = 'CGC Bronze' WHERE name = 'EO';
UPDATE class_types SET next_class_type = 'CGC Silver' WHERE name = 'CGC Bronze';
UPDATE class_types SET next_class_type = 'Novice' WHERE name = 'Beginner';