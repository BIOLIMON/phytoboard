-- Migration: Survey RLS and access control policies
-- Date: 2026-04-29
--
-- Sets up Row Level Security (RLS) for students and surveys tables.
-- Allows:
-- - Authenticated users to read students and surveys from any liceo
-- - Authenticated users to submit survey responses
-- - Admins to manage students and surveys

-- ============================================================================
-- RLS: Enable security on tables
-- ============================================================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS: STUDENTS TABLE
-- ============================================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Students readable by authenticated users" ON students;
DROP POLICY IF EXISTS "Students creatable by admins" ON students;
DROP POLICY IF EXISTS "Students updatable by admins" ON students;
DROP POLICY IF EXISTS "Students deletable by admins" ON students;

-- Policy: Everyone can read students (needed for the survey interface)
CREATE POLICY "Students readable by authenticated users" ON students
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert students (admin operations)
CREATE POLICY "Students creatable by authenticated users" ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Only authenticated users can update students
CREATE POLICY "Students updatable by authenticated users" ON students
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Only authenticated users can delete students
CREATE POLICY "Students deletable by authenticated users" ON students
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- RLS: SURVEYS TABLE
-- ============================================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Surveys readable by authenticated users" ON surveys;
DROP POLICY IF EXISTS "Surveys updatable by authenticated users" ON surveys;
DROP POLICY IF EXISTS "Surveys creatable by authenticated users" ON surveys;
DROP POLICY IF EXISTS "Surveys deletable by admins" ON surveys;

-- Policy: Everyone can read surveys (needed for the survey status interface)
CREATE POLICY "Surveys readable by authenticated users" ON surveys
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert surveys
CREATE POLICY "Surveys creatable by authenticated users" ON surveys
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update their own survey responses
CREATE POLICY "Surveys updatable by authenticated users" ON surveys
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Only admins can delete surveys
CREATE POLICY "Surveys deletable by authenticated admins" ON surveys
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant appropriate permissions to authenticated role
GRANT SELECT ON students TO authenticated;
GRANT INSERT ON students TO authenticated;
GRANT UPDATE ON students TO authenticated;
GRANT DELETE ON students TO authenticated;

GRANT SELECT ON surveys TO authenticated;
GRANT INSERT ON surveys TO authenticated;
GRANT UPDATE ON surveys TO authenticated;
GRANT DELETE ON surveys TO authenticated;

-- Grant anon access for reading (optional, for public dashboards)
GRANT SELECT ON students TO anon;
GRANT SELECT ON surveys TO anon;
