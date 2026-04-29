-- Migration: enforce one-time survey responses and remove extra student fields
-- Date: 2026-04-29

-- Remove hallucinated/unneeded fields from students
ALTER TABLE students
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS grado;

-- Ensure respuestas column exists for survey payloads
ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS respuestas JSONB DEFAULT '{}'::jsonb;

-- Keep backward compatibility with previous responses column if present
UPDATE surveys
SET respuestas = COALESCE(respuestas, responses, '{}'::jsonb)
WHERE respuestas IS NULL OR respuestas = '{}'::jsonb;

-- Enforce: once completed, a survey cannot be edited again
CREATE OR REPLACE FUNCTION lock_completed_survey_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('app.allow_survey_reset', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF OLD.completed = true THEN
    IF current_setting('request.jwt.claim.role', true) = 'authenticated'
      AND NEW.completed = false
      AND NEW.completed_at IS NULL
      AND COALESCE(NEW.respuestas, '{}'::jsonb) = '{}'::jsonb THEN
      RETURN NEW;
    END IF;

    IF NEW.completed IS DISTINCT FROM OLD.completed
      OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
      OR NEW.respuestas IS DISTINCT FROM OLD.respuestas THEN
      RAISE EXCEPTION 'Encuesta ya completada: no se puede modificar nuevamente';
    END IF;
  END IF;

  IF OLD.completed = false AND NEW.completed = true AND NEW.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lock_completed_survey_updates ON surveys;
CREATE TRIGGER trg_lock_completed_survey_updates
  BEFORE UPDATE ON surveys
  FOR EACH ROW
  EXECUTE FUNCTION lock_completed_survey_updates();

CREATE OR REPLACE FUNCTION submit_survey_responses(
  p_survey_id UUID,
  p_respuestas JSONB
)
RETURNS surveys
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_survey surveys;
BEGIN
  UPDATE surveys
  SET completed = true,
      completed_at = COALESCE(completed_at, NOW()),
      respuestas = p_respuestas
  WHERE id = p_survey_id
    AND completed = false
  RETURNING * INTO v_survey;

  IF v_survey.id IS NULL THEN
    RAISE EXCEPTION 'La encuesta ya fue completada o no existe';
  END IF;

  RETURN v_survey;
END;
$$;

CREATE OR REPLACE FUNCTION reset_survey_response(
  p_survey_id UUID
)
RETURNS surveys
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_survey surveys;
BEGIN
  UPDATE surveys
  SET completed = false,
      completed_at = NULL,
      respuestas = '{}'::jsonb
  WHERE id = p_survey_id
  RETURNING * INTO v_survey;

  IF v_survey.id IS NULL THEN
    RAISE EXCEPTION 'No se encontro la encuesta a reiniciar';
  END IF;

  RETURN v_survey;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_survey_responses(UUID, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_survey_response(UUID) TO authenticated;

-- Allow public (anon) submit exactly once from the frontend
GRANT UPDATE ON TABLE surveys TO anon;

ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "surveys_submit_once_anon" ON surveys;
CREATE POLICY "surveys_submit_once_anon" ON surveys
  FOR UPDATE
  TO anon
  USING (completed = false)
  WITH CHECK (completed = true);
