-- Seed data for students and surveys
-- Use this to populate test data for the survey system

-- First, get the liceo IDs (these will be the actual UUIDs from your database)
-- You should update these with the real UUIDs from your liceos table

-- Insert sample students for Liceo Menesiano
INSERT INTO students (liceo_id, nombre, email, grado)
SELECT 
  id as liceo_id,
  nombre,
  email,
  grado
FROM (
  VALUES
    ((SELECT id FROM liceos WHERE codigo = 'MENESIANO' LIMIT 1), 'Juan González', 'juan.gonzalez@menesiano.cl', '4A'),
    ((SELECT id FROM liceos WHERE codigo = 'MENESIANO' LIMIT 1), 'María López', 'maria.lopez@menesiano.cl', '4A'),
    ((SELECT id FROM liceos WHERE codigo = 'MENESIANO' LIMIT 1), 'Carlos Martínez', 'carlos.martinez@menesiano.cl', '4B'),
    ((SELECT id FROM liceos WHERE codigo = 'MENESIANO' LIMIT 1), 'Ana Silva', 'ana.silva@menesiano.cl', '4B'),
    ((SELECT id FROM liceos WHERE codigo = 'MENESIANO' LIMIT 1), 'Roberto Flores', 'roberto.flores@menesiano.cl', '4C'),
    ((SELECT id FROM liceos WHERE codigo = 'MENESIANO' LIMIT 1), 'Patricia Rojas', 'patricia.rojas@menesiano.cl', '4C'),
    ((SELECT id FROM liceos WHERE codigo = 'MENESIANO' LIMIT 1), 'Diego Mendoza', 'diego.mendoza@menesiano.cl', '4D'),
    ((SELECT id FROM liceos WHERE codigo = 'MENESIANO' LIMIT 1), 'Laura Torres', 'laura.torres@menesiano.cl', '4D')
) AS data(liceo_id, nombre, email, grado)
ON CONFLICT DO NOTHING;

-- Update some surveys to mark them as completed
UPDATE surveys
SET completed = true, completed_at = NOW() - INTERVAL '1 day'
WHERE student_id IN (
  SELECT s.id FROM students s
  WHERE s.nombre IN ('Juan González', 'Carlos Martínez', 'Roberto Flores', 'Diego Mendoza')
    AND s.liceo_id = (SELECT id FROM liceos WHERE codigo = 'MENESIANO' LIMIT 1)
);

-- Optional: Insert sample students for Liceo El Carmen (currently disabled in UI)
-- INSERT INTO students (liceo_id, nombre, email, grado)
-- SELECT 
--   id as liceo_id,
--   nombre,
--   email,
--   grado
-- FROM (
--   VALUES
--     ((SELECT id FROM liceos WHERE codigo = 'ELCARMEN' LIMIT 1), 'Student Name 1', 'student1@elcarmen.cl', '3A'),
--     ((SELECT id FROM liceos WHERE codigo = 'ELCARMEN' LIMIT 1), 'Student Name 2', 'student2@elcarmen.cl', '3A')
-- ) AS data(liceo_id, nombre, email, grado)
-- ON CONFLICT DO NOTHING;
