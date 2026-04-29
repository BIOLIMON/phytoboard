-- Migration: Create survey and students tables
-- Date: 2026-04-29
--
-- Creates tables for managing student surveys in PhytoBoard.
-- Includes students and survey responses with RLS support.

-- ============================================================================
-- TABLA: students
-- ============================================================================

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liceo_id UUID NOT NULL REFERENCES liceos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT,
  grado TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_liceo_id ON students(liceo_id);
CREATE INDEX IF NOT EXISTS idx_students_nombre ON students(nombre);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at DESC);

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLA: surveys
-- ============================================================================

CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  liceo_id UUID NOT NULL REFERENCES liceos(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  responses JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surveys_student_id ON surveys(student_id);
CREATE INDEX IF NOT EXISTS idx_surveys_liceo_id ON surveys(liceo_id);
CREATE INDEX IF NOT EXISTS idx_surveys_completed ON surveys(completed);
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_surveys_student_liceo ON surveys(student_id, liceo_id);

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_surveys_updated_at ON surveys;
CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- FUNCIONES AUXILIARES
-- ============================================================================

-- Función para crear una encuesta automáticamente cuando se crea un estudiante
CREATE OR REPLACE FUNCTION create_survey_for_student()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO surveys (student_id, liceo_id, completed)
  VALUES (NEW.id, NEW.liceo_id, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear automáticamente una encuesta al registrar un estudiante
DROP TRIGGER IF EXISTS create_survey_on_student_insert ON students;
CREATE TRIGGER create_survey_on_student_insert
  AFTER INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION create_survey_for_student();

-- Función para obtener estadísticas de encuestas por liceo
CREATE OR REPLACE FUNCTION get_survey_stats_by_liceo(p_liceo_id UUID)
RETURNS TABLE(
  total_students BIGINT,
  completed_surveys BIGINT,
  pending_surveys BIGINT,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT s.id)::BIGINT,
    COUNT(DISTINCT CASE WHEN surv.completed THEN surv.id END)::BIGINT,
    COUNT(DISTINCT CASE WHEN NOT surv.completed THEN surv.id END)::BIGINT,
    ROUND((COUNT(DISTINCT CASE WHEN surv.completed THEN surv.id END)::NUMERIC / 
           NULLIF(COUNT(DISTINCT s.id), 0) * 100), 2)::NUMERIC
  FROM students s
  LEFT JOIN surveys surv ON s.id = surv.student_id
  WHERE s.liceo_id = p_liceo_id;
END;
$$ LANGUAGE plpgsql;
