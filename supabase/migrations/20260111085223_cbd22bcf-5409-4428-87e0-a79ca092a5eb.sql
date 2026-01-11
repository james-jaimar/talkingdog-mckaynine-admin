-- Add performance grade column to class_attendance table
-- Grades A-F based on handler comprehension and results during class
ALTER TABLE public.class_attendance 
ADD COLUMN performance_grade TEXT CHECK (performance_grade IN ('A', 'B', 'C', 'D', 'E', 'F'));

-- Add comment to document the grading scale
COMMENT ON COLUMN public.class_attendance.performance_grade IS 'Performance grade: A=100% comprehension/excellent, B=Coping well/enthusiastic, C=Coping adequately, D=Not coping but committed, E=Disinterested/poor results, F=No comprehension/commitment';