ALTER TABLE class_attendance DROP CONSTRAINT IF EXISTS class_attendance_performance_grade_check;
ALTER TABLE class_attendance ADD CONSTRAINT class_attendance_performance_grade_check 
  CHECK (performance_grade = ANY (ARRAY['A','B','C','D','E','F','1','2','3','4','5','6']));