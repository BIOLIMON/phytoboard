-- Migration: Load PhytoLink students and baseline survey questions
-- Date: 2026-04-29
--
-- Inserts 38 students from the PHYTOLINK program inaugural workshop
-- and configures the baseline survey with 10 Likert questions + 2 binary questions

-- ============================================================================
-- PREREQUISITOS: funciones y tablas base (autonomo)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liceo_id UUID NOT NULL REFERENCES liceos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT,
  grado TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_students_liceo_id ON students(liceo_id);
CREATE INDEX IF NOT EXISTS idx_students_nombre ON students(nombre);
CREATE INDEX IF NOT EXISTS idx_surveys_student_id ON surveys(student_id);
CREATE INDEX IF NOT EXISTS idx_surveys_liceo_id ON surveys(liceo_id);
CREATE INDEX IF NOT EXISTS idx_surveys_completed ON surveys(completed);

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_liceo_nombre_unique
  ON students(liceo_id, nombre);
CREATE UNIQUE INDEX IF NOT EXISTS idx_surveys_student_unique
  ON surveys(student_id);

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_surveys_updated_at ON surveys;
CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION create_survey_for_student()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO surveys (student_id, liceo_id, completed)
  VALUES (NEW.id, NEW.liceo_id, false)
  ON CONFLICT (student_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_survey_on_student_insert ON students;
CREATE TRIGGER create_survey_on_student_insert
  AFTER INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION create_survey_for_student();

-- ============================================================================
-- TABLA: survey_templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liceo_id UUID NOT NULL REFERENCES liceos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  preguntas JSONB NOT NULL DEFAULT '[]'::jsonb,
  tipo TEXT DEFAULT 'linea_base', -- linea_base, seguimiento, etc
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_templates_liceo_id ON survey_templates(liceo_id);
CREATE INDEX IF NOT EXISTS idx_survey_templates_tipo ON survey_templates(tipo);
CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_templates_liceo_tipo_unique
  ON survey_templates(liceo_id, tipo);

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_survey_templates_updated_at ON survey_templates;
CREATE TRIGGER update_survey_templates_updated_at
  BEFORE UPDATE ON survey_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- INSERT: Estudiantes del Liceo Menesiano Culipran
-- ============================================================================

-- Get the Liceo ID (adjust if needed based on your actual data)
DO $$
DECLARE
  v_menesiano_id UUID;
BEGIN
  -- Get or use the existing Liceo Menesiano ID
  SELECT id INTO v_menesiano_id 
  FROM liceos 
  WHERE codigo = 'MENESIANO' OR nombre ILIKE '%Menesiano%'
  LIMIT 1;

  -- If no Liceo Menesiano found, create it
  IF v_menesiano_id IS NULL THEN
    INSERT INTO liceos (codigo, nombre, region, comuna, latitud, longitud)
    VALUES ('MENESIANO', 'Liceo Menesiano Culipran', 'Metropolitana', 'Melipilla', -33.7, -71.22)
    RETURNING id INTO v_menesiano_id;
  END IF;

  -- Insert 38 students from the PHYTOLINK inaugural workshop
  INSERT INTO students (liceo_id, nombre)
  VALUES
    (v_menesiano_id, 'MORALES MOYA VICTORIA ANAÍS'),
    (v_menesiano_id, 'IBARRA GALLARDO JOSÉ TOMÁS'),
    (v_menesiano_id, 'CERVANTES VILCHES DEMIAN ALEXIS'),
    (v_menesiano_id, 'MEZA ORELLANA SEBASTIÁN MATÍAS'),
    (v_menesiano_id, 'DONOSO CÁCERES FACUNDO'),
    (v_menesiano_id, 'GUZMÁN CATALÁN DENISSE ISIDORA'),
    (v_menesiano_id, 'PALMA SÁNCHEZ NICOLÁS EDUARDO'),
    (v_menesiano_id, 'FARÍAS PINTO LUCIANO MAURICIO'),
    (v_menesiano_id, 'RETAMAL LOBOS LAURA ANTONIA'),
    (v_menesiano_id, 'CERDA DEVIA PATRICIO IGNACIO'),
    (v_menesiano_id, 'MUÑOZ GALAZ ISIDORA IGNACIA'),
    (v_menesiano_id, 'GUZMÁN DOMINIQUE'),
    (v_menesiano_id, 'QUENPIL VILLARROEL SAYEN TRINIDAD'),
    (v_menesiano_id, 'GARRIDO MORALES CRISTÓBAL JAVIER'),
    (v_menesiano_id, 'GONZÁLEZ CAVIERES CATALINA ANTONIA'),
    (v_menesiano_id, 'SÁNCHEZ MONTECINOS ISIDORA MILLARAY'),
    (v_menesiano_id, 'MANCILLA POBLETE ANTONELLA ANAHÍ'),
    (v_menesiano_id, 'GALLEGUILLOS ARAVENA ANAÍS IGNACIA'),
    (v_menesiano_id, 'LÓPEZ ESPINOZA AGUSTÍN LEONARDO'),
    (v_menesiano_id, 'MANSILLA SALAZAR GABRIEL JESÚS'),
    (v_menesiano_id, 'FUENTES MONTOYA ALONDRA ESTRELLA'),
    (v_menesiano_id, 'PIZARRO CÁCERES SEBASTIÁN MAXIMILIANO'),
    (v_menesiano_id, 'GONZÁLEZ PONCE MARTÍN IGNACIO'),
    (v_menesiano_id, 'ARAYA QUIÑONES ALICIA KATHERINE'),
    (v_menesiano_id, 'CONTRERAS QUILA AGUSTINA IGNACIA'),
    (v_menesiano_id, 'ROJAS SOLANO SALOME JAZMÍN'),
    (v_menesiano_id, 'MORA ABARCA VALENTINA IGNACIA'),
    (v_menesiano_id, 'GAJARDO BRAVO MARIO IGNACIO'),
    (v_menesiano_id, 'MEJÍAS ZENTENO MAITE ALEJANDRA'),
    (v_menesiano_id, 'BENAVIDES FERNANDO'),
    (v_menesiano_id, 'DEVIA MALLEA AGUSTÍN DAVID'),
    (v_menesiano_id, 'TOBAR BAHAMONDE VICENTE ESTEBAN'),
    (v_menesiano_id, 'DONOSO VILLA MATÍAS IGNACIO'),
    (v_menesiano_id, 'AGUILAR ESPINOZA AMARO ELIEZER'),
    (v_menesiano_id, 'ARÁNGUIZ BAZAES VALENTINA PÍA'),
    (v_menesiano_id, 'LÓPEZ NÚÑEZ VALENTINA RAFAELA'),
    (v_menesiano_id, 'HERNÁNDEZ JEREZ ISIDORA IGNACIA'),
    (v_menesiano_id, 'CAMPOS SALINAS AMARO CRISTÓBAL')
  ON CONFLICT (liceo_id, nombre) DO NOTHING;

  -- Create survey template for baseline survey
  INSERT INTO survey_templates (liceo_id, nombre, descripcion, preguntas, tipo)
  VALUES (
    v_menesiano_id,
    'Encuesta Línea Base PhytoLink',
    'Encuesta inicial para evaluar conocimientos y aptitudes en programación, sensórica y agricultura inteligente',
    '[
      {
        "id": 1,
        "tipo": "likert",
        "pregunta": "Tengo conocimientos básicos sobre programación (por ejemplo, lógica, variables o uso de bloques).",
        "escala": [1, 2, 3, 4, 5],
        "categoria": "Conocimientos"
      },
      {
        "id": 2,
        "tipo": "likert",
        "pregunta": "Entiendo qué es un sensor y para qué se utiliza en la agricultura.",
        "escala": [1, 2, 3, 4, 5],
        "categoria": "Conocimientos"
      },
      {
        "id": 3,
        "tipo": "likert",
        "pregunta": "Sé cómo se puede medir la humedad del suelo utilizando tecnología.",
        "escala": [1, 2, 3, 4, 5],
        "categoria": "Conocimientos"
      },
      {
        "id": 4,
        "tipo": "likert",
        "pregunta": "Estoy familiarizado/a con el uso de tecnología para monitorear nutrientes como el nitrógeno en cultivos.",
        "escala": [1, 2, 3, 4, 5],
        "categoria": "Conocimientos"
      },
      {
        "id": 5,
        "tipo": "likert",
        "pregunta": "Me siento capaz de leer el dato de un sensor y entender qué significa para el estado de un cultivo.",
        "escala": [1, 2, 3, 4, 5],
        "categoria": "Competencia"
      },
      {
        "id": 6,
        "tipo": "likert",
        "pregunta": "Me interesa aprender sobre programación y uso de sensores aplicados a la agricultura.",
        "escala": [1, 2, 3, 4, 5],
        "categoria": "Motivación"
      },
      {
        "id": 7,
        "tipo": "likert",
        "pregunta": "Me siento preparado/a para armar un circuito electrónico básico siguiendo instrucciones paso a paso.",
        "escala": [1, 2, 3, 4, 5],
        "categoria": "Competencia"
      },
      {
        "id": 8,
        "tipo": "likert",
        "pregunta": "Cuando tengo un manual o una guía técnica con imágenes, puedo seguir los pasos sin mayor dificultad.",
        "escala": [1, 2, 3, 4, 5],
        "categoria": "Competencia"
      },
      {
        "id": 9,
        "tipo": "likert",
        "pregunta": "Creo que las tecnologías digitales pueden ayudar a mejorar la agricultura en mi comunidad.",
        "escala": [1, 2, 3, 4, 5],
        "categoria": "Actitudes"
      },
      {
        "id": 10,
        "tipo": "likert",
        "pregunta": "Me sentiría capaz de enseñarle a un agricultor/a de mi entorno a usar un sensor si aprendo a hacerlo.",
        "escala": [1, 2, 3, 4, 5],
        "categoria": "Competencia"
      },
      {
        "id": 11,
        "tipo": "binaria",
        "pregunta": "¿Has utilizado antes un microcontrolador (Arduino, ESP32) o algún sensor?",
        "opciones": ["Sí", "No"],
        "categoria": "Experiencia"
      },
      {
        "id": 12,
        "tipo": "binaria",
        "pregunta": "¿Has programado antes, aunque sea con bloques o de forma visual?",
        "opciones": ["Sí", "No"],
        "categoria": "Experiencia"
      },
      {
        "id": 13,
        "tipo": "abierta",
        "pregunta": "En tus palabras, ¿cómo crees que la tecnología (sensores, programación, datos) puede ayudar a mejorar la agricultura? Da un ejemplo si se te ocurre.",
        "categoria": "Comprensión"
      },
      {
        "id": 14,
        "tipo": "abierta",
        "pregunta": "Piensa en el cultivo o la huerta de tu liceo (o de alguien de tu comunidad). Describe una situación donde un sensor podría ser útil y qué información te gustaría obtener de él.",
        "categoria": "Aplicación"
      }
    ]'::jsonb,
    'linea_base'
  )
  ON CONFLICT (liceo_id, tipo) DO UPDATE
  SET nombre = EXCLUDED.nombre,
      descripcion = EXCLUDED.descripcion,
      preguntas = EXCLUDED.preguntas,
      activa = true,
      updated_at = NOW();

END $$;

-- ============================================================================
-- UPDATE: Vincular template a las encuestas existentes
-- ============================================================================

-- Actualizar surveys para incluir referencia al template y estructura de preguntas
ALTER TABLE surveys 
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES survey_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS respuestas JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_surveys_template_id ON surveys(template_id);

UPDATE surveys s
SET template_id = t.id
FROM students st
JOIN survey_templates t
  ON t.liceo_id = st.liceo_id
 AND t.tipo = 'linea_base'
WHERE s.student_id = st.id
  AND s.template_id IS NULL;

-- ============================================================================
-- PERMISOS Y POLITICAS (para uso con anon key en frontend)
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON TABLE students TO anon, authenticated;
GRANT SELECT ON TABLE surveys TO anon, authenticated;
GRANT SELECT ON TABLE survey_templates TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON TABLE students TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE surveys TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE survey_templates TO authenticated;

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_select_all" ON students;
CREATE POLICY "students_select_all" ON students
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "students_write_authenticated" ON students;
CREATE POLICY "students_write_authenticated" ON students
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "surveys_select_all" ON surveys;
CREATE POLICY "surveys_select_all" ON surveys
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "surveys_write_authenticated" ON surveys;
CREATE POLICY "surveys_write_authenticated" ON surveys
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT UPDATE ON TABLE surveys TO anon;

DROP POLICY IF EXISTS "surveys_submit_once_anon" ON surveys;
CREATE POLICY "surveys_submit_once_anon" ON surveys
  FOR UPDATE TO anon
  USING (completed = false)
  WITH CHECK (completed = true);

DROP POLICY IF EXISTS "survey_templates_select_all" ON survey_templates;
CREATE POLICY "survey_templates_select_all" ON survey_templates
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "survey_templates_write_authenticated" ON survey_templates;
CREATE POLICY "survey_templates_write_authenticated" ON survey_templates
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
